"use client";

import { DEFAULT_LANGUAGE, extractLanguageFromPathname } from '@/lib/i18n-routing';

export function getClientLocale(pathname?: string): string {
  const pathnameLocale = pathname ? extractLanguageFromPathname(pathname) : null;
  if (pathnameLocale) {
    return pathnameLocale;
  }

  if (typeof document === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const localeCookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("NEXT_LOCALE="));

  return localeCookie ? decodeURIComponent(localeCookie.split("=")[1] ?? DEFAULT_LANGUAGE) : DEFAULT_LANGUAGE;
}

export function persistLocaleCookie(locale: string): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `NEXT_LOCALE=${encodeURIComponent(locale)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
