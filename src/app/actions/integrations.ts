'use server';

import { createClient } from '@/utils/supabase/server';
import { encrypt } from '@/lib/encryption';
import { revalidatePath } from 'next/cache';

export type IntegrationActionResponse = {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
};

/**
 * Fetch Decrypted Integration Config
 */
export async function getIntegrationsAction(): Promise<IntegrationActionResponse> {
  try {
    const supabase = await createClient();
    
    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('[Integrations] No user found in getIntegrationsAction');
      return { success: false, message: 'Authentication required' };
    }

    // 2. Fetch from database
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('key, value');

    if (error) {
      console.error('[Integrations] Fetch error:', error);
      throw error;
    }

    console.log(`[Integrations] Fetched ${integrations?.length || 0} keys for user: ${user.email}`);

    const config: Record<string, string> = {};
    integrations?.forEach(item => {
      config[`${item.key}_CONNECTED`] = 'true';
      // Mask sensitive values
      if (!['API_KEY', 'SECRET', 'PASS', 'TOKEN'].some(sensitive => item.key.includes(sensitive))) {
          config[item.key] = item.value;
      } else {
        config[item.key] = '********';
      }
    });

    return { success: true, message: 'Config loaded', data: config };
  } catch (error: any) {
    console.error('[Action Error] getIntegrationsAction:', error);
    return { success: false, message: 'Failed to fetch integrations', error: error.message };
  }
}

/**
 * Save Encrypted Integration Key
 * Diagnostics added for troubleshooting silent save failures.
 */
export async function saveIntegrationAction(updates: Record<string, string>): Promise<IntegrationActionResponse> {
  try {
    const supabase = await createClient();
    
    // 1. Auth & Identity Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, message: 'Authentication required' };

    console.log(`[Integrations] Save attempt by: ${user.email}`);

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || 
                    ['benjaminzafar10@gmail.com', 'benjaminzafar7@gmail.com'].includes(user.email || '');

    if (!isAdmin) {
      console.warn(`[Integrations] Denied: ${user.email} is not an admin. Role in DB: ${profile?.role}`);
      return { success: false, message: 'Unauthorized: Admin access required' };
    }

    const now = new Date().toISOString();
    
    // 2. Process and Upsert
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'string' && value.trim() !== '' && value !== '********') {
        const sanitizedValue = value.replace(/[<>]/g, '');
        const isSensitive = ['API_KEY', 'SECRET', 'PASS', 'TOKEN'].some(s => key.includes(s));
        const finalValue = isSensitive ? encrypt(sanitizedValue) : sanitizedValue;

        console.log(`[Integrations] Upserting key: ${key}`);

        const { error: upsertError } = await supabase
          .from('integrations')
          .upsert({ 
            key, 
            value: finalValue, 
            updated_at: now 
          }, { onConflict: 'key' });

        if (upsertError) {
          console.error(`[Integrations] Upsert failed for ${key}:`, upsertError);
          throw upsertError;
        }
      }
    }

    console.log('[Integrations] Save successful. Revalidating path...');
    revalidatePath('/admin/integrations');
    
    return { success: true, message: 'Settings saved and encrypted securely' };
  } catch (error: any) {
    console.error('[Action Error] saveIntegrationAction:', error);
    return { success: false, message: `Failed to save settings: ${error.message}` };
  }
}
