"use client";

import { useSyncExternalStore } from "react";
import { SimpleCookieBanner } from "@/components/SimpleCookieBanner";

function subscribe() {
  return () => undefined;
}

function getServerSnapshot() {
  return false;
}

function getClientSnapshot() {
  return true;
}

export function CookieBannerMount({ lang = "en" }: { lang?: string }) {
  const isMounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  if (!isMounted) {
    return null;
  }

  return <SimpleCookieBanner lang={lang} />;
}
