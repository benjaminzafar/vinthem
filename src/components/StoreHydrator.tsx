"use client";

import { useEffect } from 'react';
import { useSettingsStore, StorefrontSettings } from '@/store/useSettingsStore';

interface StoreHydratorProps {
  settings: StorefrontSettings;
  supabaseConfig?: {
    url: string;
    anonKey: string;
  };
}

export default function StoreHydrator({ settings, supabaseConfig }: StoreHydratorProps) {
  const { setSettings, setSettingsLoaded } = useSettingsStore();

  useEffect(() => {
    if (settings) {
      setSettings(settings);
      setSettingsLoaded(true);
    }

    // Persist Supabase config to globalThis for the client-side singleton
    if (supabaseConfig?.url && supabaseConfig?.anonKey) {
      (globalThis as any).__supabase_url = supabaseConfig.url;
      (globalThis as any).__supabase_key = supabaseConfig.anonKey;
    }
  }, [settings, setSettings, setSettingsLoaded, supabaseConfig]);

  return null;
}
