export const SUPPORTED_LANGUAGES = ['en', 'sv', 'fi', 'da', 'de', 'no', 'nb', 'nn', 'is'] as string[];
export const DEFAULT_LANGUAGE = 'en';

export type SupportedLanguage = string;

const INTERNAL_PATH_PREFIXES_TO_SKIP = ['/api', '/admin'];
const COUNTRY_TO_LANGUAGE: Partial<Record<string, SupportedLanguage>> = {
  SE: 'sv',
  FI: 'fi',
  DK: 'da',
  AX: 'sv',
  GL: 'da',
  FO: 'da',
};

const SEARCH_BOT_USER_AGENT_PATTERN = /bot|crawler|spider|bingpreview|slurp|duckduckbot|baiduspider|yandex|facebookexternalhit|linkedinbot|embedly|quora link preview|whatsapp|telegrambot/i;

export function isSupportedLanguage(value: string | null | undefined): value is string {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return SUPPORTED_LANGUAGES.includes(normalized);
}

export function extractLanguageFromPathname(pathname: string): SupportedLanguage | null {
  const [firstSegment] = pathname.split('/').filter(Boolean);
  return isSupportedLanguage(firstSegment) ? firstSegment : null;
}

export function stripLanguageFromPathname(pathname: string): string {
  const locale = extractLanguageFromPathname(pathname);
  if (!locale) {
    return pathname || '/';
  }

  const nextPath = pathname.slice(locale.length + 1);
  return nextPath.startsWith('/') ? nextPath : nextPath ? `/${nextPath}` : '/';
}

export function normalizeLocalizedPath(pathname: string, locale: string): string {
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const strippedPath = stripLanguageFromPathname(cleanPath);
  const safeLocale = isSupportedLanguage(locale) ? locale : DEFAULT_LANGUAGE;

  if (strippedPath === '/') {
    return `/${safeLocale}`;
  }

  return `/${safeLocale}${strippedPath}`;
}

export function localizeHref(locale: string, href: string): string {
  if (!href) {
    return '/';
  }

  if (/^(https?:|mailto:|tel:|#)/i.test(href)) {
    return href;
  }

  const normalizedHref = href.startsWith('/') ? href : `/${href}`;

  if (
    INTERNAL_PATH_PREFIXES_TO_SKIP.some((prefix) => normalizedHref.startsWith(prefix))
    || normalizedHref.startsWith('/auth/callback')
  ) {
    return normalizedHref;
  }

  return normalizeLocalizedPath(normalizedHref, locale);
}

export function resolveLanguageFromCountry(countryCode?: string | null): SupportedLanguage | null {
  if (!countryCode) {
    return null;
  }

  return COUNTRY_TO_LANGUAGE[countryCode.toUpperCase()] ?? null;
}

export function isSearchEngineBot(userAgent?: string | null): boolean {
  return SEARCH_BOT_USER_AGENT_PATTERN.test(userAgent ?? '');
}

export function resolvePreferredLanguage(
  pathname: string,
  localeCookie?: string | null,
  countryCode?: string | null,
  acceptLanguageHeader?: string | null,
): SupportedLanguage {
  const pathnameLocale = extractLanguageFromPathname(pathname);
  if (pathnameLocale) {
    return pathnameLocale;
  }

  if (isSupportedLanguage(localeCookie)) {
    return localeCookie;
  }

  const languageFromCountry = resolveLanguageFromCountry(countryCode);
  if (languageFromCountry) {
    return languageFromCountry;
  }

  const acceptedLanguages = (acceptLanguageHeader ?? '')
    .split(',')
    .map((entry) => entry.trim().split(';')[0]?.toLowerCase())
    .filter(Boolean);

  for (const entry of acceptedLanguages) {
    const [baseLanguage] = entry.split('-');
    if (isSupportedLanguage(baseLanguage)) {
      return baseLanguage;
    }
  }

  return DEFAULT_LANGUAGE;
}
