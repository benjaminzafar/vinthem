import 'server-only';

import Stripe from 'stripe';

import { maybeDecryptStoredValue } from '@/lib/integrations';
import { createAdminClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';

type IntegrationRow = {
  key: string;
  value: string | null;
};

export interface StripeCredentials {
  secretKey: string;
  webhookSecret: string;
}

async function loadStripeIntegrationValues() {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('integrations')
    .select('key, value')
    .in('key', ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']);

  if (error) {
    throw new Error(`Failed to load Stripe integrations: ${error.message}`);
  }

  return (data ?? []) as IntegrationRow[];
}

export async function getStripeCredentials(): Promise<StripeCredentials> {
  const integrations = await loadStripeIntegrationValues();
  const secretKey = (await maybeDecryptStoredValue(
    integrations.find((row) => row.key === 'STRIPE_SECRET_KEY')?.value,
  )).trim();
  const webhookSecret = (await maybeDecryptStoredValue(
    integrations.find((row) => row.key === 'STRIPE_WEBHOOK_SECRET')?.value,
  )).trim();

  if (secretKey === 'DECRYPTION_FAILED') {
    throw new Error('Stripe secret key could not be decrypted. Please re-save it in Admin > Integrations.');
  }

  if (webhookSecret === 'DECRYPTION_FAILED') {
    throw new Error('Stripe webhook secret could not be decrypted. Please re-save it in Admin > Integrations.');
  }

  return {
    secretKey,
    webhookSecret,
  };
}

export async function getStripeSecretKey(): Promise<string> {
  const integrations = await loadStripeIntegrationValues();
  const secretKey = (await maybeDecryptStoredValue(
    integrations.find((row) => row.key === 'STRIPE_SECRET_KEY')?.value,
  )).trim();

  if (secretKey === 'DECRYPTION_FAILED') {
    throw new Error('Stripe secret key could not be decrypted. Please re-save it in Admin > Integrations.');
  }

  return secretKey;
}

export async function getStripeClient(): Promise<Stripe | null> {
  const secretKey = await getStripeSecretKey();

  if (!secretKey || secretKey.trim() === '') {
    logger.warn('Stripe initialization skipped: Missing secret key.');
    return null;
  }

  // Debug log to verify the key format without exposing the full secret
  const maskedKey = `${secretKey.slice(0, 7)}...${secretKey.slice(-4)}`;
  logger.info(`Initializing Stripe client with key: ${maskedKey} (Length: ${secretKey.length})`);

  return new Stripe(secretKey, {
    apiVersion: '2026-03-25.dahlia',
    httpClient: Stripe.createFetchHttpClient(), // Use fetch for better compatibility
    timeout: 60000,
    maxNetworkRetries: 3,
    telemetry: false,
  });
}
