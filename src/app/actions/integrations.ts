'use server';
﻿import { logger } from '@/lib/logger';
import Stripe from 'stripe';

import { encrypt } from '@/lib/encryption';
import { revalidatePath } from 'next/cache';
import { requireAdminUser } from '@/lib/admin';
import {
  isSensitiveIntegrationKey,
  maybeDecryptStoredValue,
} from '@/lib/integrations';
import { AI_PROMPT_DEFAULTS, normalizePromptSettingValue } from '@/lib/ai-prompts';

export type IntegrationActionResponse = {
  success: boolean;
  message: string;
  data?: Record<string, string>;
  activeLocales?: string[];
  error?: string;
};

/**
 * Fetch Decrypted Integration Config
 */
export async function getIntegrationsAction(): Promise<IntegrationActionResponse> {
  try {
    const { supabase } = await requireAdminUser();

    // 1. Fetch Integrations
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('key, value');

    if (error) throw error;

    // 2. Fetch Active Locales from settings
    const { data: settingsRow } = await supabase
      .from('settings')
      .select('data')
      .eq('id', 'primary')
      .single();

    const activeLocales = settingsRow?.data?.languages || ['en', 'sv', 'fi', 'da'];

    const config: Record<string, string> = {};
    for (const item of integrations ?? []) {
      config[`${item.key}_CONNECTED`] = 'true';
      if (isSensitiveIntegrationKey(item.key)) {
        config[item.key] = '********';
        continue;
      }
      config[item.key] = await maybeDecryptStoredValue(item.value);
    }

    for (const [key, defaultValue] of Object.entries(AI_PROMPT_DEFAULTS)) {
      if (!config[key]?.trim()) {
        config[key] = defaultValue;
      }
    }

    return { 
      success: true, 
      message: 'Config loaded', 
      data: config,
      activeLocales
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch integrations';
    logger.error('[Action Error] getIntegrationsAction:', error);
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
        const normalizedValue = normalizePromptSettingValue(key, sanitizedValue);
        const finalValue = isSensitiveIntegrationKey(key)
          ? await encrypt(normalizedValue)
          : normalizedValue;

        const { error: upsertError } = await supabase
          .from('integrations')
          .upsert({ 
            key, 
            value: finalValue, 
            updated_at: now 
          }, { onConflict: 'key' });

        if (upsertError) {
          logger.error(`[Integrations] Upsert failed for ${key}:`, upsertError);
          throw upsertError;
        }
      }
    }

    revalidatePath('/admin/integrations');
    
    return { success: true, message: 'Settings saved and encrypted securely' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save settings';
    logger.error('[Action Error] saveIntegrationAction:', error);
    return { success: false, message: `Failed to save settings: ${message}` };
  }
}

/**
 * Test Stripe Connection
 */
export async function testStripeConnectionAction(apiKey: string): Promise<IntegrationActionResponse> {
  try {
    await requireAdminUser();
    
    if (!apiKey || apiKey === '********') {
       return { success: false, message: 'Invalid or masked API key provided for testing' };
    }

    const stripe = new Stripe(apiKey, { 
      apiVersion: '2023-10-16' as any, // Match project standard
      typescript: true 
    });
    
    // Simple balance check to verify key validity
    await stripe.balance.retrieve();
    
    return { success: true, message: 'Secure connection to Stripe established successfully' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Connection failed';
    logger.error('[Integrations] Stripe test failed:', error);
    return { success: false, message: `Stripe connection failed: ${message}` };
  }
}

/**
 * Test Brevo API Connection
 */
export async function testBrevoApiAction(apiKey: string): Promise<IntegrationActionResponse> {
  try {
    await requireAdminUser();
    
    if (!apiKey || apiKey === '********') {
       // Try to get from existing config if masked
       const { supabase: adminClient } = await requireAdminUser();
       const { data: row } = await adminClient
         .from('integrations')
         .select('value')
         .eq('key', 'BREVO_API_KEY')
         .single();
       
       if (row) {
         apiKey = await maybeDecryptStoredValue(row.value);
       }
    }

    if (!apiKey || apiKey === '********' || !apiKey) {
       return { success: false, message: 'Invalid or missing Brevo API key' };
    }

    const response = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'API verification failed');

    return { 
      success: true, 
      message: `Brevo API verified. Account: ${data.email}`,
      data: { accountEmail: data.email }
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Brevo test failed';
    logger.error('[Integrations] Brevo API test failed:', error);
    return { success: false, message: `Brevo API connection failed: ${message}` };
  }
}
