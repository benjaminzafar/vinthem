import React from 'react';
import { Metadata } from 'next';
import { AuthClient } from './AuthClient';
import { createClient } from '@/utils/supabase/server';
import { getSettings } from '@/lib/data';
import type { StorefrontSettings } from '@/store/useSettingsStore';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data: settingsData } = await supabase
    .from('settings')
    .select('data')
    .eq('id', 'primary')
    .single();

  const settings = settingsData?.data || {};
  const storeName = settings.storeName?.en || 'Vinthem';

  return {
    title: `Authentication | ${storeName}`,
    description: 'Sign in or create an account to manage your orders and profile.',
  };
}

export default async function AuthPage() {
  const settings = (await getSettings()) as Partial<StorefrontSettings>;
  return <AuthClient initialSettings={settings} />;
}
