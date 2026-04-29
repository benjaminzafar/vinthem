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
      const g = globalThis as typeof globalThis & {
        __supabase_url?: string;
        __supabase_key?: string;
        __supabase_real_client?: unknown;
        __supabase_signature?: string;
      };
      
      // Update the global variables
      g.__supabase_url = supabaseConfig.url;
      g.__supabase_key = supabaseConfig.anonKey;

      // Force cleanup of the old lazy client if it was initialized before config landed
      if (g.__supabase_signature?.includes('missing')) {
        g.__supabase_real_client = undefined;
        g.__supabase_signature = undefined;
      }
    }
  }, [settings, setSettings, setSettingsLoaded, supabaseConfig]);

  return null;
}
