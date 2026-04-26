import 'server-only';

import Stripe from 'stripe';

import { decrypt } from '@/lib/encryption';
import { createAdminClient } from '@/utils/supabase/server';

type IntegrationRow = {
  key: string;
  value: string | null;
};

export interface StripeCredentials {
  secretKey: string;
  webhookSecret: string;
}

export async function getStripeCredentials(): Promise<StripeCredentials> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('integrations')
    .select('key, value')
    .in('key', ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']);

  if (error) {
    throw new Error(`Failed to load Stripe integrations: ${error.message}`);
  }

  const integrations = (data ?? []) as IntegrationRow[];
  const encryptedSecretKey = integrations.find((row) => row.key === 'STRIPE_SECRET_KEY')?.value;
  const encryptedWebhookSecret = integrations.find((row) => row.key === 'STRIPE_WEBHOOK_SECRET')?.value;

  return {
    secretKey: encryptedSecretKey ? await decrypt(encryptedSecretKey) : '',
    webhookSecret: encryptedWebhookSecret ? await decrypt(encryptedWebhookSecret) : '',
  };
}

export async function getStripeClient(): Promise<Stripe | null> {
  const { secretKey } = await getStripeCredentials();

  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey);
}
