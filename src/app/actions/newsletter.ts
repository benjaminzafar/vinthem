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

