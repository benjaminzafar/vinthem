import { cache } from 'react';
import { createAdminClient } from '@/utils/supabase/server';
import type { StorefrontSettings } from '@/store/useSettingsStore';
import { maybeDecryptStoredValue } from './integrations';
import { getEnv } from './env';
import { logger } from './logger';

const DEFAULT_SETTINGS: Partial<StorefrontSettings> = {
  storeName: { en: 'Vinthem', sv: 'Vinthem' },
  logoImage: '',
  heroBackgroundColor: '#ffffff',
};

function sanitizeClarityId(value: string): string {
  const normalized = value.trim();
  return /^[a-z0-9]+$/i.test(normalized) ? normalized : '';
}

export const getSettings = cache(async () => {
  const url = getEnv('SUPABASE_URL');
  const adminKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || url.includes('missing') || !adminKey) {
    logger.warn('[Settings] Supabase configuration missing. Falling back to default storefront settings.');
    return DEFAULT_SETTINGS as StorefrontSettings;
  }

  try {
    const supabase = createAdminClient();
    const { data: settingsData, error } = await supabase
      .from('settings')
      .select('data')
      .eq('id', 'primary')
      .maybeSingle();

    if (error || !settingsData) {
      if (error) {
        logger.error('[Settings] Failed to load settings row:', error);
      }
      return DEFAULT_SETTINGS as StorefrontSettings;
    }

    return settingsData.data as StorefrontSettings;
  } catch (error) {
    logger.error('[Settings] Unexpected settings loader failure:', error);
    return DEFAULT_SETTINGS as StorefrontSettings;
  }
});

export const getIntegrations = cache(async (): Promise<Record<string, string>> => {
  const url = getEnv('SUPABASE_URL');
  if (!url || url.includes('missing')) return {};

  try {
    const supabase = createAdminClient();
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('key, value')
      .in('key', ['CLARITY_ID']);

    if (error || !integrations) return {};

    const decryptedIntegrations = await Promise.all(
      integrations.map(async (integration) => ({
        ...integration,
        value: await maybeDecryptStoredValue(integration.value),
      }))
    );

    return decryptedIntegrations.reduce((acc, curr) => ({
      ...acc,
      [curr.key]: curr.key === 'CLARITY_ID' ? sanitizeClarityId(curr.value) : curr.value
    }), {} as Record<string, string>);
  } catch (error) {
    logger.error('[Integrations] Failed to load public integrations:', error);
    return {};
  }
});
