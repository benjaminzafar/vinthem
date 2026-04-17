"use client";

import { useEffect, useState } from "react";
import { SimpleCookieBanner } from "@/components/SimpleCookieBanner";

type CookieBannerCopy = {
  eyebrow: string;
  description: string;
  privacyLabel: string;
  cookieLabel: string;
  acceptAllLabel: string;
  essentialOnlyLabel: string;
};

export function CookieBannerMount({ copy }: { copy: CookieBannerCopy }) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof win.requestIdleCallback === "function") {
      const idleId = win.requestIdleCallback(() => setShouldRender(true), { timeout: 1500 });
      return () => {
        if (typeof win.cancelIdleCallback === "function") {
          win.cancelIdleCallback(idleId);
        }
      };
    }

    const timeoutId = window.setTimeout(() => setShouldRender(true), 1200);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!shouldRender) {
    return null;
  }

  return <SimpleCookieBanner copy={copy} />;
}
