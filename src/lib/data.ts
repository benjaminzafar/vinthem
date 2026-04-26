import { cache } from 'react';
import { createAdminClient } from '@/utils/supabase/server';
import type { StorefrontSettings } from '@/store/useSettingsStore';
import { maybeDecryptStoredValue } from './integrations';

export const getSettings = cache(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes('missing')) {
    console.warn('Database URL missing. Using default settings.');
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

    const settings = settingsData.data as StorefrontSettings;
    return settings;
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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes('missing')) return {};

  try {
    const supabase = createAdminClient();
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('key, value')
      .in('key', ['CLARITY_ID', 'POSTHOG_PROJECT_KEY', 'POSTHOG_HOST']);

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
