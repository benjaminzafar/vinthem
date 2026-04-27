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
    
    // Test connection with a simple count first
    const { count, error: testError } = await supabase
      .from('settings')
      .select('*', { count: 'exact', head: true });

    if (testError) {
      console.error('SUPABASE PERMISSION ERROR:', testError.message);
      return {
        storeName: { en: `Vinthem (Auth Error: ${testError.code})`, sv: `Vinthem (Auth Error: ${testError.code})` },
        logoUrl: '',
        heroBackgroundColor: '#ffffff',
        primaryColor: '#000000',
      } as any;
    }

    const { data: settingsData, error } = await supabase
      .from('settings')
      .select('data')
      .eq('id', 'primary')
      .maybeSingle();

    if (error) {
      return {
        storeName: { en: `Vinthem (Query Error: ${error.code})`, sv: `Vinthem (Query Error: ${error.code})` },
        logoUrl: '',
        heroBackgroundColor: '#ffffff',
        primaryColor: '#000000',
      } as any;
    }

    if (!settingsData) {
      return {
        storeName: { en: 'Vinthem (No primary row)', sv: 'Vinthem (No primary row)' },
        logoUrl: '',
        heroBackgroundColor: '#ffffff',
        primaryColor: '#000000',
      } as any;
    }

    return settingsData.data as StorefrontSettings;
  } catch (e: any) {
    return {
      storeName: { en: `Vinthem (System Crash: ${e.message})`, sv: `Vinthem (System Crash: ${e.message})` },
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
