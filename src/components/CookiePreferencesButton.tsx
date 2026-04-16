"use client";

import { openConsentPreferences } from "@/lib/consent";

export function CookiePreferencesButton({ label = "Cookie Preferences" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={openConsentPreferences}
      className="hover:text-brand-ink transition-colors"
    >
      {label}
    </button>
  );
}
