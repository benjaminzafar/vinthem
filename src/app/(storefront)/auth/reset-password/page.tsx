import React from 'react';
import { Metadata } from 'next';
import { ResetPasswordClient } from './ResetPasswordClient';
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
    title: `Reset Password | ${storeName}`,
    description: 'Create a new secure password for your account.',
  };
}

export default async function ResetPasswordPage() {
  const settings = (await getSettings()) as Partial<StorefrontSettings>;
  return <ResetPasswordClient initialSettings={settings} />;
}
