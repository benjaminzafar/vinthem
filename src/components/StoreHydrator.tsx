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
    const applySupabaseConfig = (config: { url: string; anonKey: string }) => {
      if (!config.url || !config.anonKey) {
        return;
      }

      const g = globalThis as typeof globalThis & {
        __supabase_url?: string;
        __supabase_key?: string;
        __supabase_real_client?: unknown;
        __supabase_signature?: string;
      };

      g.__supabase_url = config.url;
      g.__supabase_key = config.anonKey;

      if (g.__supabase_signature?.includes('missing')) {
        g.__supabase_real_client = undefined;
        g.__supabase_signature = undefined;
      }

      window.dispatchEvent(new Event('supabase-config-ready'));
    };

    if (settings) {
      setSettings(settings);
      setSettingsLoaded(true);
    }

    if (supabaseConfig?.url && supabaseConfig?.anonKey) {
      applySupabaseConfig(supabaseConfig);
      return;
    }

    let cancelled = false;

    const hydrateRuntimeSupabaseConfig = async () => {
      try {
        const response = await fetch('/api/supabase-config', {
          cache: 'no-store',
          credentials: 'same-origin',
        });

        if (!response.ok) {
          return;
        }

        const config = await response.json() as { url?: string; anonKey?: string };
        if (!cancelled && config.url && config.anonKey) {
          applySupabaseConfig({ url: config.url, anonKey: config.anonKey });
        }
      } catch {
        // Runtime auth bootstrap will stay on the existing path and surface its own failures if config is still unavailable.
      }
    };

    void hydrateRuntimeSupabaseConfig();

    return () => {
      cancelled = true;
    };
  }, [settings, setSettings, setSettingsLoaded, supabaseConfig]);

  return null;
}
