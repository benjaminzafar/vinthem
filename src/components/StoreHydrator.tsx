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

    if (supabaseConfig?.url && supabaseConfig?.anonKey) {
      const g = globalThis as any;
      
      // Update the global variables
      g.__supabase_url = supabaseConfig.url;
      g.__supabase_key = supabaseConfig.anonKey;

      // Force cleanup of the old client if it exists
      if (g.__supabase_client && g.__supabase_url_used?.includes('missing')) {
        g.__supabase_client = undefined;
      }
    }
  }, [settings, setSettings, setSettingsLoaded, supabaseConfig]);

  return null;
}
