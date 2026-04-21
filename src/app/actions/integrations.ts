'use server';
﻿import { logger } from '@/lib/logger';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';

import { encrypt } from '@/lib/encryption';
import { revalidatePath } from 'next/cache';
import { requireAdminUser } from '@/lib/admin';
import {
  isSensitiveIntegrationKey,
  maybeDecryptStoredValue,
} from '@/lib/integrations';

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
      if (isSensitiveIntegrationKey(item.key)) {
        config[item.key] = '********';
        return;
      }

      config[item.key] = maybeDecryptStoredValue(item.value);
    });

    return { success: true, message: 'Config loaded', data: config };
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
        const normalizedValue = sanitizedValue;
        const finalValue = isSensitiveIntegrationKey(key)
          ? encrypt(normalizedValue)
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
 * Test Email Connection (SMTP)
 */
export async function testEmailConnectionAction(config: {
  user: string;
  pass: string;
  host: string;
  port: string;
  sender: string;
  to?: string;
}): Promise<IntegrationActionResponse> {
  try {
    await requireAdminUser();

    // Handle masked password by fetching from DB
    let finalPass = config.pass;
    let finalUser = config.user;
    let finalHost = config.host;
    let finalPort = config.port;

    if (finalPass === '********') {
       const { supabase: adminClient } = await requireAdminUser();
       const { data: storedKeys } = await adminClient
         .from('integrations')
         .select('key, value')
         .in('key', ['ZOHO_USER', 'ZOHO_PASS', 'ZOHO_SMTP_HOST', 'ZOHO_SMTP_PORT', 'ZOHO_TEST_EMAIL']);
       
       const getVal = (k: string) => {
         const row = storedKeys?.find(r => r.key === k);
         return row ? maybeDecryptStoredValue(row.value) : '';
       };

       finalPass = getVal('ZOHO_PASS');
       if (!finalUser) finalUser = getVal('ZOHO_USER');
       if (!finalHost) finalHost = getVal('ZOHO_SMTP_HOST');
       if (!finalPort) finalPort = getVal('ZOHO_SMTP_PORT');
    }

    if (!finalPass || finalPass === '********') {
       return { success: false, message: 'No valid password found to perform handshake.' };
    }

    const transporter = nodemailer.createTransport({
      host: finalHost || 'smtp-relay.brevo.com',
      port: Number(finalPort) || 587,
      secure: Number(finalPort) === 465,
      auth: {
        user: finalUser,
        pass: finalPass,
      },
      // Robustness: short timeout for testing
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    await transporter.verify();

    // If 'to' is provided, send a real test email
    if (config.to && config.to.includes('@')) {
      await transporter.sendMail({
        from: config.user,
        to: config.to,
        subject: `Vinthem Test Email - ${new Date().toLocaleTimeString()}`,
        text: 'Hello! This is a successful SMTP test from your Vinthem shop using Brevo relay. If you see this, your email system is live.',
      });
      return { success: true, message: `SMTP test email successfully sent to ${config.to}` };
    }
    
    return { success: true, message: 'SMTP Handshake successful. Server is ready to relay.' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'SMTP Handshake failed';
    logger.error('[Integrations] Email test failed:', error);
    return { success: false, message: `Email connection failed: ${message}` };
  }
}
