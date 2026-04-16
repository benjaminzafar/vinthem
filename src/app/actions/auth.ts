'use server';

import { ensureUserProfile } from '@/lib/admin';
import { upsertNewsletterSubscriber } from '@/app/actions/newsletter';
import { createAdminClient, createClient } from '@/utils/supabase/server';

type AuthActionResult = {
  success: boolean;
  message: string;
  error?: string;
};

export async function syncCurrentUserProfileAction(name?: string): Promise<AuthActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    if (!user) {
      throw new Error('Authentication required.');
    }

    await ensureUserProfile(user, name?.replace(/[<>]/g, '').trim() || user.user_metadata?.full_name);

    return {
      success: true,
      message: 'User profile synchronized.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to synchronize profile.';
    console.error('[Action Error] syncCurrentUserProfileAction:', error);
    return {
      success: false,
      message,
      error: message,
    };
  }
}

type SignupConsentInput = {
  fullName?: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  marketingOptIn: boolean;
};

export async function recordSignupConsentAction({
  fullName,
  acceptedTerms,
  acceptedPrivacy,
  marketingOptIn,
}: SignupConsentInput): Promise<AuthActionResult> {
  try {
    if (!acceptedTerms || !acceptedPrivacy) {
      throw new Error('You must accept the Terms and Privacy Policy to create an account.');
    }

    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    if (!user) {
      throw new Error('Authentication required.');
    }

    const sanitizedName = fullName?.replace(/[<>]/g, '').trim() || user.user_metadata?.full_name || '';
    await ensureUserProfile(user, sanitizedName);

    const now = new Date().toISOString();
    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from('users')
      .update({
        full_name: sanitizedName || null,
        accepted_terms_at: now,
        accepted_privacy_at: now,
        marketing_consent: marketingOptIn,
        marketing_consent_at: marketingOptIn ? now : null,
        consent_version: '2026-04-16',
        updated_at: now,
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    if (marketingOptIn && user.email) {
      const newsletterResult = await upsertNewsletterSubscriber({
        email: user.email,
        source: 'account_signup',
        marketingConsent: true,
        userId: user.id,
      });

      if (!newsletterResult.success) {
        throw new Error(newsletterResult.message);
      }
    }

    return {
      success: true,
      message: 'Signup consent preferences saved.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save signup consent.';
    console.error('[Action Error] recordSignupConsentAction:', error);
    return {
      success: false,
      message,
      error: message,
    };
  }
}
