'use server';
﻿import { logger } from '@/lib/logger';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { StorefrontSettings as StorefrontSettingsType } from '@/store/useSettingsStore';
import { requireAdminUser } from '@/lib/admin';

export type ActionResponse = {
  success: boolean;
  message: string;
  error?: string;
};

function revalidateStorefrontPaths(languages: string[]) {
  const staticPaths = [
    '/',
    '/products',
    '/auth',
    '/cart',
    '/payment',
    '/profile',
    '/privacy-policy',
    '/cookie-policy',
    '/terms-of-service',
    '/p/privacy-policy',
    '/p/cookie-policy',
    '/p/terms-of-service',
  ];

  staticPaths.forEach((path) => revalidatePath(path));

  languages.forEach((lang) => {
    staticPaths
      .filter((path) => path !== '/')
      .forEach((path) => revalidatePath(`/${lang}${path}`));

    revalidatePath(`/${lang}`);
  });
}

/**
 * Update Storefront Settings
 * Uses Next.js Server Actions for reliability and security.
 */
export async function updateSettingsAction(settings: StorefrontSettingsType): Promise<ActionResponse> {
  try {
    const { supabase } = await requireAdminUser();
    const now = new Date().toISOString();

    // Perform Upsert
    const { error } = await supabase
      .from('settings')
      .upsert({ 
        id: 'primary', 
        data: settings,
        updated_at: now
      });

    if (error) throw error;

    const policyPages = [
      {
        slug: 'privacy-policy',
        title: settings.privacyPolicyPageTitle,
        content: settings.privacyPolicyPageContent,
      },
      {
        slug: 'cookie-policy',
        title: settings.cookiePolicyPageTitle,
        content: settings.cookiePolicyPageContent,
      },
      {
        slug: 'terms-of-service',
        title: settings.termsOfServicePageTitle,
        content: settings.termsOfServicePageContent,
      },
    ];

    for (const page of policyPages) {
      const { error: pageError } = await supabase
        .from('pages')
        .upsert({
          slug: page.slug,
          title: page.title,
          content: page.content,
          updated_at: now,
        }, {
          onConflict: 'slug',
        });

      if (pageError) {
        throw pageError;
      }
    }

    revalidateStorefrontPaths(settings.languages || ['en']);
    revalidatePath('/', 'layout');
    revalidatePath('/admin');
    
    return { success: true, message: 'Settings saved successfully' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save settings';
    logger.error('[Action Error] updateSettingsAction:', error);
    return { success: false, message: 'Failed to save settings', error: message };
  }
}

/**
 * Handle Asset Uploads via Server Action (Optional, usually handled client-side with presigned URLs or direct SDK)
 * But we provide it here for "New System" completeness if requested.
 */
export async function uploadAssetAction(formData: FormData) {
  // Logic for direct server-side upload if needed
  return { success: true, message: 'Ready' };
}

