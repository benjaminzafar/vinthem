'use server';
﻿import { logger } from '@/lib/logger';

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
      throw new Error('You appear to be signed out. Please sign in again.');
    }

    // Attempt to get language from user metadata or current URL context if available
    const lang = user.user_metadata?.lang || 'en';

    // Check if profile already exists with identical data to avoid unnecessary writes
    const { data: existingProfile } = await supabase
      .from('users')
      .select('full_name, preferred_lang')
      .eq('id', user.id)
      .maybeSingle();

    const sanitizedName = name?.replace(/[<>]/g, '').trim() || user.user_metadata?.full_name;

    if (existingProfile && 
        existingProfile.full_name === sanitizedName && 
        existingProfile.preferred_lang === lang) {
      return {
        success: true,
        message: 'Profile already up to date.',
      };
    }

    await ensureUserProfile(user, sanitizedName, lang);

    return {
      success: true,
      message: 'User profile synchronized.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to synchronize profile.';
    logger.error('[Action Error] syncCurrentUserProfileAction:', error);
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
    logger.error('[Action Error] recordSignupConsentAction:', error);
    return {
      success: false,
      message,
      error: message,
    };
  }
}

export async function checkEmailExistsAction(email: string): Promise<{ exists: boolean }> {
  try {
    const admin = createAdminClient();
    // Query our public.users profile table which exists for confirmed users
    const { data, error } = await admin
      .from('users')
      .select('id')
      .eq('email', email.trim())
      .maybeSingle();
    
    if (error) {
      logger.error('[Action Error] checkEmailExistsAction:', error);
      return { exists: false };
    }

    return { exists: !!data };
  } catch (error) {
    logger.error('[Action Error] checkEmailExistsAction Exception:', error);
    return { exists: false };
  }
}

