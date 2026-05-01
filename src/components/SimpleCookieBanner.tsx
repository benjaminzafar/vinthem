"use client";

import Link from "next/link";
import { useState } from "react";
import { createConsentState, persistConsent, readStoredConsent } from "@/lib/consent";
import { usePathname } from "next/navigation";
import { getClientLocale } from "@/lib/locale";
import { localizeHref } from "@/lib/i18n-routing";

type CookieBannerCopy = {
  eyebrow: string;
  description: string;
  privacyLabel: string;
  cookieLabel: string;
  acceptAllLabel: string;
  essentialOnlyLabel: string;
};

export function SimpleCookieBanner({ copy }: { copy: CookieBannerCopy }) {
  const [visible, setVisible] = useState(() => readStoredConsent() === null);
  const pathname = usePathname();
  const lang = getClientLocale(pathname);

  if (!visible) {
    return null;
  }

  const acceptAll = () => {
    persistConsent(createConsentState({ analytics: true, marketing: true }));
    setVisible(false);
  };

  const essentialOnly = () => {
    persistConsent(createConsentState({ analytics: false, marketing: false }));
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-3xl rounded-none border border-stone-200 bg-white px-5 py-4 shadow-none-[0_18px_60px_rgba(15,23,42,0.12)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-stone-500">
        {copy.eyebrow}
      </p>
      <p className="mt-2 text-sm leading-6 text-stone-700">
        {copy.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-4 text-sm text-stone-600">
        <Link href={localizeHref(lang, "/p/privacy-policy")} className="underline underline-offset-4">
          {copy.privacyLabel}
        </Link>
        <Link href={localizeHref(lang, "/p/cookie-policy")} className="underline underline-offset-4">
          {copy.cookieLabel}
        </Link>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={acceptAll}
          className="rounded-none bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
        >
          {copy.acceptAllLabel}
        </button>
        <button
          type="button"
          onClick={essentialOnly}
          className="rounded-none border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-900"
        >
          {copy.essentialOnlyLabel}
        </button>
      </div>
    </div>
  );
}
