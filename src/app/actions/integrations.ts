'use server';

import { encrypt } from '@/lib/encryption';
import { revalidatePath } from 'next/cache';
import { requireAdminUser } from '@/lib/admin';

export type IntegrationActionResponse = {
  success: boolean;
  message: string;
  data?: Record<string, string>;
  error?: string;
};

/**
 * Fetch Decrypted Integration Config
 */
export async function getIntegrationsAction(): Promise<IntegrationActionResponse> {
  try {
    const { supabase } = await requireAdminUser();

    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('key, value');

    if (error) {
      throw error;
    }

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch integrations';
    console.error('[Action Error] getIntegrationsAction:', error);
    return { success: false, message: 'Failed to fetch integrations', error: message };
  }
}

/**
 * Save Encrypted Integration Key
 * Diagnostics added for troubleshooting silent save failures.
 */
export async function saveIntegrationAction(updates: Record<string, string>): Promise<IntegrationActionResponse> {
  try {
    const { supabase } = await requireAdminUser();

    const now = new Date().toISOString();
    
    // 2. Process and Upsert
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'string' && value.trim() !== '' && value !== '********') {
        const sanitizedValue = value.replace(/[<>]/g, '');
        const isSensitive = ['API_KEY', 'SECRET', 'PASS', 'TOKEN'].some(s => key.includes(s));
        const finalValue = isSensitive ? encrypt(sanitizedValue) : sanitizedValue;

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

    revalidatePath('/admin/integrations');
    
    return { success: true, message: 'Settings saved and encrypted securely' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save settings';
    console.error('[Action Error] saveIntegrationAction:', error);
    return { success: false, message: `Failed to save settings: ${message}` };
  }
}
