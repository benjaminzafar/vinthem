"use client";

import { useEffect } from 'react';
import { StorefrontSettings, useSettingsStore } from '@/store/useSettingsStore';

interface StoreHydratorProps {
  settings: Partial<StorefrontSettings>;
}

export function StoreHydrator({ settings }: StoreHydratorProps) {
  const setSettings = useSettingsStore((state) => state.setSettings);
  const setSettingsLoaded = useSettingsStore((state) => state.setSettingsLoaded);

  useEffect(() => {
    setSettings(settings);
    setSettingsLoaded(true);
  }, [settings, setSettings, setSettingsLoaded]);

  return null;
}
