"use client";

import { useMemo } from 'react';
import {
  StorefrontSettings,
  defaultSettings,
  useSettingsStore,
} from '@/store/useSettingsStore';

function mergeSettings(
  snapshot?: Partial<StorefrontSettings>,
  liveSettings?: StorefrontSettings,
): StorefrontSettings {
  return {
    ...defaultSettings,
    ...(snapshot ?? {}),
    ...(liveSettings ?? {}),
  };
}

export function useStorefrontSettings(snapshot?: Partial<StorefrontSettings>): StorefrontSettings {
  const settings = useSettingsStore((state) => state.settings);
  const settingsLoaded = useSettingsStore((state) => state.settingsLoaded);

  return useMemo(() => {
    if (!settingsLoaded && snapshot) {
      return mergeSettings(snapshot);
    }

    return mergeSettings(snapshot, settings);
  }, [settings, settingsLoaded, snapshot]);
}
