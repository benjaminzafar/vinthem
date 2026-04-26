import { createAdminClient } from '@/utils/supabase/server';
import { cache } from 'react';
import { StorefrontSettings } from '@/store/useSettingsStore';
import { logger } from '@/lib/logger';
import {
  maybeDecryptStoredValue,
} from '@/lib/integrations';

export const getIntegrations = cache(async () => {
  const supabase = createAdminClient();
  const { data: integrations, error } = await supabase
    .from('integrations')
    .select('key, value')
    .in('key', ['CLARITY_ID', 'POSTHOG_PROJECT_KEY', 'POSTHOG_HOST']);

  if (error) {
    logger.error('Error fetching integrations:', error);
    return {};
  }

  const config: Record<string, string> = {};
  for (const item of integrations ?? []) {
    config[item.key] = await maybeDecryptStoredValue(item.value);
  }

  return config;
});

export const getSettings = async () => {
  const supabase = createAdminClient();
  const { data: settingsData, error } = await supabase
    .from('settings')
    .select('data')
    .eq('id', 'primary')
    .single();

  if (error || !settingsData) {
    if (error) {
      console.error('SERVER-SIDE FETCH ERROR:', error);
      logger.error(`Error fetching settings: [${error.code}] ${error.message}`, {
        details: error.details,
        hint: error.hint
      });
    } else {
      console.warn('SERVER-SIDE: No settings record found in Supabase.');
    }
    // Return minimal defaults so the UI doesn't crash
    return ({
      storeName: { en: 'Vinthem', sv: 'Vinthem' },
      logoUrl: '',
      heroBackgroundColor: '#ffffff',
      primaryColor: '#000000'
    } as unknown) as StorefrontSettings;
  }

  const settings = (settingsData.data || {}) as StorefrontSettings;
  return settings;
};
