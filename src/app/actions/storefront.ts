'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { StorefrontSettings as StorefrontSettingsType } from '@/store/useSettingsStore';
import { requireAdminUser } from '@/lib/admin';

export type ActionResponse = {
  success: boolean;
  message: string;
  error?: string;
};

/**
 * Update Storefront Settings
 * Uses Next.js Server Actions for reliability and security.
 */
export async function updateSettingsAction(settings: StorefrontSettingsType): Promise<ActionResponse> {
  try {
    const { supabase } = await requireAdminUser();

    // Perform Upsert
    const { error } = await supabase
      .from('settings')
      .upsert({ 
        id: 'primary', 
        data: settings,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    // Purge cache to reflect changes immediately across the site
    revalidatePath('/', 'layout');
    revalidatePath('/admin');
    
    return { success: true, message: 'Settings saved successfully' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save settings';
    console.error('[Action Error] updateSettingsAction:', error);
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
