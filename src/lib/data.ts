import { createClient } from '@/utils/supabase/server';
import { cache } from 'react';
import { StorefrontSettings } from '@/store/useSettingsStore';
import {
  maybeDecryptStoredValue,
  normalizePostHogIngestionHost,
} from '@/lib/integrations';

// We use react cache to deduplicate requests within a single render cycle (request)
// Next.js also automatically caches data fetched via the Supabase client if configured,
// but explicitly caching here is more robust for Server Components.
export const getIntegrations = cache(async () => {
  const supabase = await createClient();
  const { data: integrations, error } = await supabase
    .from('integrations')
    .select('key, value')
    .in('key', ['CLARITY_ID', 'POSTHOG_PROJECT_KEY', 'POSTHOG_HOST']);

  if (error) {
    console.error('Error fetching integrations:', error);
    return {};
  }

  const config: Record<string, string> = {};
  integrations?.forEach(item => {
    if (item.key === 'POSTHOG_HOST') {
      config[item.key] = normalizePostHogIngestionHost(item.value);
      return;
    }

    config[item.key] = maybeDecryptStoredValue(item.value);
  });

  return config;
});

export const getSettings = cache(async () => {
  const supabase = await createClient();
  const { data: settingsData, error } = await supabase
    .from('settings')
    .select('data')
    .eq('id', 'primary')
    .single();

  if (error || !settingsData) {
    if (error) console.error('Error fetching settings:', error);
    // Return minimal defaults so the UI doesn't crash
    return ({
      storeName: { en: 'Mavren Shop', sv: 'Mavren Shop' },
      logoUrl: '',
      heroBackgroundColor: '#ffffff',
      primaryColor: '#000000'
    } as unknown) as StorefrontSettings;
  }

  return (settingsData.data || {}) as StorefrontSettings;
});
