"use client";
import { logger } from '@/lib/logger';

export type ConsentState = {
  analytics: boolean;
  marketing: boolean;
  essential: true;
  updatedAt: string;
};

export const CONSENT_STORAGE_KEY = "vinthem-consent";
export const CONSENT_COOKIE_NAME = "vinthem_consent";
export const OPEN_CONSENT_PREFERENCES_EVENT = "vinthem:open-consent-preferences";

export function createConsentState(overrides?: Partial<ConsentState>): ConsentState {
  return {
    analytics: false,
    marketing: false,
    essential: true,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function parseConsentValue(value: string | null | undefined): ConsentState | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<ConsentState>;
    if (typeof parsed.analytics !== "boolean" || typeof parsed.marketing !== "boolean") {
      return null;
    }

    return createConsentState({
      analytics: parsed.analytics,
      marketing: parsed.marketing,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    });
  } catch (error) {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      logger.warn("Invalid consent payload was ignored.", error);
    }
    return null;
  }
}

export function serializeConsentValue(consent: ConsentState): string {
  return JSON.stringify(consent);
}

export function readStoredConsent(): ConsentState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const localValue = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  const localConsent = parseConsentValue(localValue);
  if (localConsent) {
    return localConsent;
  }
  if (localValue) {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  }

  const cookieMatch = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${CONSENT_COOKIE_NAME}=`));

  const cookieValue = cookieMatch ? decodeURIComponent(cookieMatch.split("=")[1] ?? "") : null;
  const cookieConsent = parseConsentValue(cookieValue);
  if (!cookieConsent && cookieValue) {
    document.cookie = `${CONSENT_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  }

  return cookieConsent;
}

export function persistConsent(consent: ConsentState): void {
  if (typeof window === "undefined") {
    return;
  }

  const serialized = serializeConsentValue(consent);
  window.localStorage.setItem(CONSENT_STORAGE_KEY, serialized);
  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(serialized)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function clearConsentStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  document.cookie = `${CONSENT_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function hasAnalyticsConsent(): boolean {
  return readStoredConsent()?.analytics === true;
}

export function openConsentPreferences(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(OPEN_CONSENT_PREFERENCES_EVENT));
}

