import 'server-only';

import Stripe from 'stripe';

import { maybeDecryptStoredValue } from '@/lib/integrations';
import { createAdminClient } from '@/utils/supabase/server';

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

  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey);
}
