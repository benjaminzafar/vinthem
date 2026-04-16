"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import posthog from "posthog-js";
import {
  ConsentState,
  OPEN_CONSENT_PREFERENCES_EVENT,
  createConsentState,
  hasAnalyticsConsent,
  persistConsent,
  readStoredConsent,
} from "@/lib/consent";
import { normalizePostHogIngestionHost } from "@/lib/integrations";
import { useSettingsStore } from "@/store/useSettingsStore";

declare global {
  interface Window {
    clarity?: (...args: Array<string>) => void;
    __mavren_clarity_loaded?: boolean;
    __mavren_posthog_initialized?: boolean;
  }
}

type ConsentManagerProps = {
  apiKey?: string;
  host?: string;
  clarityId?: string;
  lang?: string;
};

const clarityCookieNames = ["_clck", "_clsk", "CLID", "ANONCHK", "MR", "MUID", "SM"];

function deleteCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${name}=; Path=/; Domain=.${window.location.hostname}; Max-Age=0; SameSite=Lax`;
}

function removeClarityArtifacts() {
  clarityCookieNames.forEach(deleteCookie);
  document.querySelectorAll('script[data-clarity-loader="true"]').forEach((node) => node.remove());
  delete window.clarity;
  window.__mavren_clarity_loaded = false;
}

function ensureClarityLoaded(clarityId: string) {
  if (!clarityId || typeof window === "undefined" || window.__mavren_clarity_loaded) {
    return;
  }

  window.clarity = window.clarity || ((...args: Array<string>) => {
    const queued = (window.clarity as unknown as { q?: Array<Array<string>> }).q ?? [];
    queued.push(args);
    (window.clarity as unknown as { q: Array<Array<string>> }).q = queued;
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${clarityId}`;
  script.dataset.clarityLoader = "true";
  document.head.appendChild(script);
  window.__mavren_clarity_loaded = true;
}

function syncAnalyticsTools(consent: ConsentState, apiKey?: string, host?: string, clarityId?: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (!consent.analytics) {
    if (window.__mavren_posthog_initialized) {
      posthog.opt_out_capturing();
      posthog.reset();
    }
    removeClarityArtifacts();
    return;
  }

  if (apiKey) {
    const apiHost = normalizePostHogIngestionHost(
      host || process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com"
    );

    if (!window.__mavren_posthog_initialized) {
      posthog.init(apiKey, {
        api_host: apiHost,
        person_profiles: "identified_only",
        capture_pageview: true,
        opt_out_capturing_by_default: true,
      });
      window.__mavren_posthog_initialized = true;
    }

    posthog.opt_in_capturing();
  }

  if (clarityId) {
    ensureClarityLoaded(clarityId);
  }
}

export function ConsentManager({ apiKey, host, clarityId, lang = "en" }: ConsentManagerProps) {
  const { settings } = useSettingsStore();
  const [consent, setConsent] = useState<ConsentState | null>(() => readStoredConsent());
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [draftAnalytics, setDraftAnalytics] = useState(() => readStoredConsent()?.analytics ?? false);
  const [draftMarketing, setDraftMarketing] = useState(() => readStoredConsent()?.marketing ?? false);

  useEffect(() => {
    const handleOpenPreferences = () => setIsPreferencesOpen(true);
    window.addEventListener(OPEN_CONSENT_PREFERENCES_EVENT, handleOpenPreferences);
    return () => window.removeEventListener(OPEN_CONSENT_PREFERENCES_EVENT, handleOpenPreferences);
  }, []);

  useEffect(() => {
    if (!consent) {
      if (hasAnalyticsConsent()) {
        posthog.opt_in_capturing();
      } else {
        posthog.opt_out_capturing();
      }
      return;
    }

    syncAnalyticsTools(consent, apiKey, host, clarityId);
  }, [apiKey, clarityId, consent, host]);

  const hasDecision = useMemo(() => consent !== null, [consent]);

  const saveConsent = (nextConsent: ConsentState) => {
    persistConsent(nextConsent);
    setConsent(nextConsent);
    setDraftAnalytics(nextConsent.analytics);
    setDraftMarketing(nextConsent.marketing);
    setIsPreferencesOpen(false);
  };

  const acceptAll = () => saveConsent(createConsentState({ analytics: true, marketing: true }));
  const rejectOptional = () => saveConsent(createConsentState({ analytics: false, marketing: false }));
  const savePreferences = () =>
    saveConsent(createConsentState({ analytics: draftAnalytics, marketing: draftMarketing }));

  return (
    <>
      {!hasDecision && (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-4xl rounded-[28px] border border-stone-200 bg-white/95 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-stone-500">
                {settings.consentBannerEyebrowText?.[lang] || "Privacy Controls"}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-900">
                {settings.consentBannerTitleText?.[lang] || "We only turn on analytics after you say yes."}
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {settings.consentBannerDescriptionText?.[lang] || "Essential cookies keep checkout and login secure. Optional analytics helps us improve the store with PostHog and Microsoft Clarity. You can change this any time from the footer."}
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-stone-600">
                <Link href="/p/privacy-policy" className="underline underline-offset-4">
                  {settings.consentPrivacyLinkText?.[lang] || "Privacy Policy"}
                </Link>
                <Link href="/p/cookie-policy" className="underline underline-offset-4">
                  {settings.consentCookieLinkText?.[lang] || "Cookie Policy"}
                </Link>
                <button type="button" onClick={() => setIsPreferencesOpen(true)} className="underline underline-offset-4">
                  {settings.consentChooseSettingsText?.[lang] || "Choose settings"}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:w-[260px]">
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                {settings.consentAcceptAllText?.[lang] || "Accept all"}
              </button>
              <button
                type="button"
                onClick={rejectOptional}
                className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-50"
              >
                {settings.consentEssentialOnlyText?.[lang] || "Essential only"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPreferencesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/35 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[32px] bg-white p-8 shadow-[0_28px_120px_rgba(15,23,42,0.2)]">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-stone-500">
                  {settings.consentModalEyebrowText?.[lang] || "Cookie Preferences"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-stone-900">
                  {settings.consentModalTitleText?.[lang] || "Choose what we can use."}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsPreferencesOpen(false)}
                className="rounded-full border border-stone-200 px-3 py-1 text-sm text-stone-500"
              >
                {settings.consentCloseText?.[lang] || "Close"}
              </button>
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="text-base font-semibold text-stone-900">
                      {settings.consentEssentialTitleText?.[lang] || "Essential cookies"}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {settings.consentEssentialDescriptionText?.[lang] || "Required for authentication, security, checkout, and basic storefront functionality."}
                    </p>
                  </div>
                  <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-white">
                    {settings.consentAlwaysOnText?.[lang] || "Always on"}
                  </span>
                </div>
              </div>

              <label className="flex cursor-pointer items-start justify-between gap-6 rounded-3xl border border-stone-200 p-5">
                <div>
                  <h3 className="text-base font-semibold text-stone-900">
                    {settings.consentAnalyticsTitleText?.[lang] || "Analytics"}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {settings.consentAnalyticsDescriptionText?.[lang] || "Helps us understand navigation, drop-offs, and performance with PostHog and Clarity."}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={draftAnalytics}
                  onChange={(event) => setDraftAnalytics(event.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                />
              </label>

              <label className="flex cursor-pointer items-start justify-between gap-6 rounded-3xl border border-stone-200 p-5">
                <div>
                  <h3 className="text-base font-semibold text-stone-900">
                    {settings.consentMarketingTitleText?.[lang] || "Marketing emails"}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {settings.consentMarketingDescriptionText?.[lang] || "Lets us remember that you want launch updates, product drops, and editorial emails."}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={draftMarketing}
                  onChange={(event) => setDraftMarketing(event.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                />
              </label>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={savePreferences}
                className="flex-1 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                {settings.consentSavePreferencesText?.[lang] || "Save preferences"}
              </button>
              <button
                type="button"
                onClick={rejectOptional}
                className="flex-1 rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-50"
              >
                {settings.consentRejectOptionalText?.[lang] || "Reject optional"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
