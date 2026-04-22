'use server';
﻿import { logger } from '@/lib/logger';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/utils/supabase/server';

export type NewsletterResponse = {
  success: boolean;
  message: string;
  error?: string;
};

type SubscriberPayload = {
  email: string;
  source: string;
  marketingConsent: boolean;
  userId?: string | null;
};

function revalidateNewsletterViews() {
  revalidatePath('/');
  revalidatePath('/[lang]', 'page');
  revalidatePath('/admin/crm');
  revalidatePath('/unsubscribe');
  revalidatePath('/[lang]/unsubscribe', 'page');
}

function sanitizeEmail(rawEmail: string | null | undefined): string {
  return (rawEmail ?? '').trim().toLowerCase();
}

function sanitizeSource(rawSource: string | null | undefined): string {
  const source = (rawSource ?? '').trim().toLowerCase();
  return source.replace(/[^a-z0-9_-]/g, '') || 'storefront_homepage';
}

function createUnsubscribeToken(): string {
  return randomBytes(24).toString('hex');
}

import { sendTransactionalEmail, syncContactToBrevo } from '@/lib/brevo';

export async function upsertNewsletterSubscriber({
  email,
  source,
  marketingConsent,
  userId,
}: SubscriberPayload): Promise<NewsletterResponse> {
  const normalizedEmail = sanitizeEmail(email);

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  if (!marketingConsent) {
    return {
      success: false,
      message: 'Marketing consent is required before we can send newsletter emails.',
    };
  }

  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();
    const { data: existingSubscriber, error: readError } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (readError) {
      throw readError;
    }

    const payload = {
      email: normalizedEmail,
      user_id: userId ?? null,
      status: 'subscribed',
      source: sanitizeSource(source),
      consent_marketing: true,
      consented_at: now,
      subscribed_at: now,
      unsubscribed_at: null,
      unsubscribe_token: createUnsubscribeToken(),
      updated_at: now,
    };

    const { error } = existingSubscriber
      ? await supabase
          .from('newsletter_subscribers')
          .update(payload)
          .eq('id', String(existingSubscriber.id))
      : await supabase
          .from('newsletter_subscribers')
          .insert({
            ...payload,
            created_at: now,
          });

    if (error) {
      throw error;
    }

    // --- NEW: Sync to Brevo Contacts ---
    // This ensures your Brevo dashboard is always up to date with new signups
    try {
      await syncContactToBrevo(normalizedEmail, {
        SOURCE: payload.source,
        SUBSCRIBED_AT: now,
      });
    } catch (syncErr) {
      logger.error('Brevo Sync failed during signup:', syncErr);
      // We don't throw here to avoid failing the local subscription
    }

    revalidateNewsletterViews();

    return { success: true, message: 'You are subscribed and can unsubscribe anytime.' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update newsletter preferences.';
    logger.error('[Action Error] upsertNewsletterSubscriber:', error);
    return { success: false, message: 'Failed to subscribe. Please try again later.', error: message };
  }
}

/**
 * Newsletter Subscription Server Action
 * Securely handles consented email signups without exposing API keys to the client.
 */
export async function subscribeAction(formData: FormData): Promise<NewsletterResponse> {
  return upsertNewsletterSubscriber({
    email: String(formData.get('email') ?? ''),
    source: String(formData.get('source') ?? 'storefront_homepage'),
    marketingConsent: formData.get('marketingConsent') === 'on',
  });
}

export async function unsubscribeAction(formData: FormData): Promise<NewsletterResponse> {
  const email = sanitizeEmail(String(formData.get('email') ?? ''));
  const unsubscribeToken = String(formData.get('unsubscribeToken') ?? '').trim();

  if (!email || !email.includes('@')) {
    return { success: false, message: 'Please enter the email address you subscribed with.' };
  }

  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();
    const query = supabase
      .from('newsletter_subscribers')
      .update({
        status: 'unsubscribed',
        consent_marketing: false,
        unsubscribed_at: now,
        updated_at: now,
      })
      .ilike('email', email);

    const { error } = unsubscribeToken
      ? await query.eq('unsubscribe_token', unsubscribeToken)
      : await query;

    if (error) {
      throw error;
    }

    revalidateNewsletterViews();

    return {
      success: true,
      message: 'Your email preferences were updated. You will no longer receive marketing emails.',
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update newsletter preferences.';
    logger.error('[Action Error] unsubscribeAction:', error);
    return { success: false, message: 'Unable to unsubscribe right now. Please try again later.', error: message };
  }
}

/**
 * Dispatches a new campaign to the audience
 * Now actually sends emails via Brevo API!
 */
export async function dispatchCampaignAction(payload: { subject: string; content: string }): Promise<NewsletterResponse> {
  const subject = payload.subject.trim();
  const content = payload.content.trim();

  if (!subject || !content) {
    return { success: false, message: 'Campaign subject and content are required.' };
  }

  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // 1. Fetch Audience (Subscribers + Customers)
    const [subsRes, authRes] = await Promise.all([
      supabase.from('newsletter_subscribers').select('email').eq('status', 'subscribed'),
      supabase.auth.admin.listUsers()
    ]);

    const subscribers = subsRes.data || [];
    const authUsers = authRes.data?.users || [];
    
    // 2. Build unique recipient list
    const recipientSet = new Set<string>();
    subscribers.forEach(s => recipientSet.add(s.email.toLowerCase()));
    authUsers.forEach(u => u.email && recipientSet.add(u.email.toLowerCase()));

    const recipients = Array.from(recipientSet).map(email => ({ email }));

    if (recipients.length === 0) {
      return { success: false, message: 'No active subscribers found to send this campaign.' };
    }

    // 3. Dispatch via Brevo API
    // We send this as a transactional batch. 
    // In a high-traffic production build, this should be moved to a Background Worker or Queue.
    const result = await sendTransactionalEmail({
      to: recipients,
      subject: subject,
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
          ${content}
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            You received this email because you are a customer or subscriber of Vinthem.
          </p>
        </div>
      `
    });

    if (!result.success) {
      throw new Error('Brevo API rejected the campaign dispatch.');
    }

    // 4. Record Campaign in DB
    const { error: campaignError } = await supabase
      .from('newsletter_campaigns')
      .insert({
        subject,
        content,
        sent_at: now,
        recipient_count: recipients.length
      });

    if (campaignError) throw campaignError;

    revalidateNewsletterViews();

    return { 
      success: true, 
      message: `Campaign "${subject}" successfully sent to ${recipients.length} recipients via Brevo API.` 
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to dispatch campaign.';
    logger.error('[Action Error] dispatchCampaignAction:', error);
    return { success: false, message: 'Failed to launch campaign. Check Brevo API status.', error: message };
  }
}
