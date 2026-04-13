"use client";

import { useEffect, useRef } from 'react';
import { StorefrontSettings, useSettingsStore } from '@/store/useSettingsStore';

interface StoreHydratorProps {
  settings: Partial<StorefrontSettings>;
}

export function StoreHydrator({ settings }: StoreHydratorProps) {
  const setSettings = useSettingsStore((state) => state.setSettings);
  const setSettingsLoaded = useSettingsStore((state) => state.setSettingsLoaded);
  const initialized = useRef(false);

  if (!initialized.current) {
    setSettings(settings);
    setSettingsLoaded(true);
    initialized.current = true;
  }

  return null;
}
