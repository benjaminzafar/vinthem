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
      return { success: false, error: 'You must accept the Terms and Privacy Policy to create an account.', message: 'Consent required' };
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'User session not found.', message: 'Not authenticated' };
    }

    // 1. Force ensure profile exists first to avoid database conflicts
    await ensureUserProfile(user, fullName ?? user.user_metadata?.full_name);

    // 2. Update the consent flags in the DB
    const { error: dbError } = await supabase
      .from('users')
      .update({
        full_name: fullName ?? user.user_metadata?.full_name ?? '',
        accepted_terms_at: acceptedTerms ? new Date().toISOString() : null,
        accepted_privacy_at: acceptedPrivacy ? new Date().toISOString() : null,
        marketing_consent: marketingOptIn,
        marketing_consent_at: marketingOptIn ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (dbError) {
      console.error('[recordSignupConsentAction] DB Error:', dbError);
      return { success: false, error: `Database error: ${dbError.message}`, message: 'Database failure' };
    }

    // 3. Background Sync to Brevo (Non-blocking)
    if (marketingOptIn && user.email) {
      void upsertNewsletterSubscriber({
        email: user.email,
        source: 'account_signup',
        marketingConsent: true,
        userId: user.id,
      }).catch(e => console.error('[Brevo Background Sync Error]:', e));
    }

    revalidatePath('/', 'layout');
    return { success: true, message: 'Signup consent preferences saved.' };
  } catch (err: any) {
    console.error('[recordSignupConsentAction] General Error:', err);
    return { success: false, error: err.message || 'Failed to save signup consent.', message: err.message || 'Unexpected error' };
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

export async function updatePasswordAction(password: string) {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    logger.error('[Action Error] updatePasswordAction:', error);
    return { success: false, message: error.message || 'Failed to update password' };
  }
}

