import { cache } from 'react';
import { createAdminClient } from '@/utils/supabase/server';
import type { StorefrontSettings } from '@/store/useSettingsStore';
import { maybeDecryptStoredValue } from './integrations';
import { getEnv } from './env';

export const getSettings = cache(async () => {
  const url = getEnv('SUPABASE_URL');
  const adminKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || url.includes('missing') || !adminKey) {
    return {
      storeName: { en: 'Vinthem', sv: 'Vinthem' },
      logoUrl: '',
      heroBackgroundColor: '#ffffff',
      primaryColor: '#000000',
    } as any;
  }

  try {
    const supabase = createAdminClient();
    const { data: settingsData, error } = await supabase
      .from('settings')
      .select('data')
      .eq('id', 'primary')
      .maybeSingle();

    if (error || !settingsData) {
      return {
        storeName: { en: 'Vinthem', sv: 'Vinthem' },
        logoUrl: '',
        heroBackgroundColor: '#ffffff',
        primaryColor: '#000000',
      } as any;
    }

    return settingsData.data as StorefrontSettings;
  } catch (e) {
    return {
      storeName: { en: 'Vinthem', sv: 'Vinthem' },
      logoUrl: '',
      heroBackgroundColor: '#ffffff',
      primaryColor: '#000000',
    } as any;
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
      [curr.key]: curr.value
    }), {} as Record<string, string>);
  } catch (e) {
    return {};
  }
});
