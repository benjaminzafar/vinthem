import React from 'react';
import { Metadata } from 'next';
import { AuthClient } from './AuthClient';
import { getSettings } from '@/lib/data';
import type { StorefrontSettings } from '@/store/useSettingsStore';
import { getEnv } from '@/lib/env';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const settings = await getSettings();
  const storeName = settings?.storeName?.[lang] || settings?.storeName?.en || 'Vinthem';

  const titles = {
    en: 'Authentication',
    sv: 'Autentisering',
    fi: 'Tunnistautuminen',
    da: 'Autentificering'
  };

  const descriptions = {
    en: 'Sign in or create an account to manage your orders and profile.',
    sv: 'Logga in eller skapa ett konto för att hantera dina beställningar och din profil.',
    fi: 'Kirjaudu sisään tai luo tili hallinnoidaksesi tilauksiasi ja profiiliasi.',
    da: 'Log ind eller opret en konto for at administrere dine ordrer og din profil.'
  };

  return {
    title: `${titles[lang as keyof typeof titles] || titles.en} | ${storeName}`,
    description: descriptions[lang as keyof typeof descriptions] || descriptions.en,
  };
}

export default async function AuthPage() {
  const settings = (await getSettings()) as Partial<StorefrontSettings>;
  return (
    <AuthClient
      initialSettings={settings}
      supabaseConfig={{
        url: getEnv('SUPABASE_URL') || '',
        anonKey: getEnv('SUPABASE_PUBLISHABLE_KEY') || '',
      }}
    />
  );
}
