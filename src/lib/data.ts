import { cache } from 'react';
import { createAdminClient } from '@/utils/supabase/server';
import type { StorefrontSettings } from '@/store/useSettingsStore';
import { maybeDecryptStoredValue } from './integrations';

export const getSettings = cache(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret = process.env.ENCRYPTION_SECRET;

  console.log('--- DEBUG: CONNECTION CHECK ---');
  console.log('URL Present:', !!url);
  console.log('Public Key Present:', !!key);
  console.log('Admin Key Present:', !!adminKey);
  console.log('Encryption Secret Present:', !!secret);
  
  if (!url || url.includes('missing') || !adminKey) {
    console.error('CRITICAL: Supabase connection variables are missing in this environment.');
    return {
      storeName: { en: 'Vinthem (Fallback)', sv: 'Vinthem (Fallback)' },
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

    if (error) {
      console.error('Supabase Query Error:', error.message);
      return {
        storeName: { en: 'Vinthem (Query Error)', sv: 'Vinthem (Query Error)' },
        logoUrl: '',
        heroBackgroundColor: '#ffffff',
        primaryColor: '#000000',
      } as any;
    }

    if (!settingsData) {
      console.warn('No settings found in database for ID "primary".');
      return {
        storeName: { en: 'Vinthem (No Data)', sv: 'Vinthem (No Data)' },
        logoUrl: '',
        heroBackgroundColor: '#ffffff',
        primaryColor: '#000000',
      } as any;
    }

    const settings = settingsData.data as StorefrontSettings;
    return settings;
  } catch (e: any) {
    console.error('Connection Crash:', e.message);
    return {
      storeName: { en: 'Vinthem (Crash)', sv: 'Vinthem (Crash)' },
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
