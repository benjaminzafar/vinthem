/**
 * Official European locales for Mavren Shop.
 * This is the single source of truth for dynamic configurations (Brevo, CRM, etc.)
 */
export const SUPPORTED_LOCALES = ['en', 'sv', 'fi', 'da'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';
export const DEFAULT_LANGUAGE = DEFAULT_LOCALE;

/**
 * Normalizes a path to ensure consistent SEO canonical URLs.
 */
export function normalizeLocalizedPath(path: string, lang: string): string {
  const p = path || '/';
  const regex = new RegExp(`^/${lang}(/|$)`);
  const stripped = p.replace(regex, '/');
  const normalized = stripped.replace(/\/+$/, '') || '/';
  return lang === DEFAULT_LOCALE ? normalized : `/${lang}${normalized === '/' ? '' : normalized}`;
}

