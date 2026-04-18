export type SupportedCurrency =
  | 'SEK'
  | 'EUR'
  | 'DKK'
  | 'NOK'
  | 'ISK'
  | 'USD'
  | 'GBP'
  | 'CHF'
  | 'CAD'
  | 'AUD'
  | 'JPY';

export interface MarketConfig {
  locale: string;
  language: string;
  country: string;
  currency: SupportedCurrency;
}

export type StripeCheckoutLocale =
  | 'auto'
  | 'en'
  | 'sv'
  | 'fi'
  | 'da'
  | 'nb'
  | 'de'
  | 'fr'
  | 'nl'
  | 'it'
  | 'es'
  | 'pt'
  | 'pl'
  | 'cs'
  | 'ja';

const DEFAULT_LANGUAGE_LOCALES: Record<string, string> = {
  sv: 'sv-SE',
  fi: 'fi-FI',
  da: 'da-DK',
  nb: 'nb-NO',
  nn: 'nn-NO',
  is: 'is-IS',
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
  nl: 'nl-NL',
  it: 'it-IT',
  es: 'es-ES',
  pt: 'pt-PT',
  pl: 'pl-PL',
  cs: 'cs-CZ',
  ja: 'ja-JP',
};

const REGION_CURRENCIES: Record<string, SupportedCurrency> = {
  SE: 'SEK',
  FI: 'EUR',
  DK: 'DKK',
  NO: 'NOK',
  IS: 'ISK',
  US: 'USD',
  GB: 'GBP',
  IE: 'EUR',
  DE: 'EUR',
  FR: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  PT: 'EUR',
  AT: 'EUR',
  LU: 'EUR',
  CH: 'CHF',
  CA: 'CAD',
  AU: 'AUD',
  JP: 'JPY',
};

export const ALLOWED_SHIPPING_COUNTRIES = ['SE', 'FI', 'DK', 'NO', 'IS'] as const;

function normalizeLocale(input?: string): string {
  if (!input) {
    return DEFAULT_LANGUAGE_LOCALES.en;
  }

  return input.replace('_', '-');
}

export function resolveMarket(inputLocale?: string): MarketConfig {
  const normalized = normalizeLocale(inputLocale);
  const [rawLanguage, rawRegion] = normalized.split('-');
  const language = rawLanguage.toLowerCase();

  if (rawRegion) {
    const country = rawRegion.toUpperCase();
    return {
      locale: `${language}-${country}`,
      language,
      country,
      currency: REGION_CURRENCIES[country] ?? 'EUR',
    };
  }

  const fallbackLocale = DEFAULT_LANGUAGE_LOCALES[language] ?? `${language}-US`;
  const [fallbackLanguage, fallbackCountry] = fallbackLocale.split('-');

  return {
    locale: `${fallbackLanguage.toLowerCase()}-${fallbackCountry.toUpperCase()}`,
    language: fallbackLanguage.toLowerCase(),
    country: fallbackCountry.toUpperCase(),
    currency: REGION_CURRENCIES[fallbackCountry.toUpperCase()] ?? 'USD',
  };
}

export function resolveStripeCheckoutLocale(inputLocale?: string): StripeCheckoutLocale {
  const { language } = resolveMarket(inputLocale);
  const supportedLocales = new Set<StripeCheckoutLocale>([
    'en',
    'sv',
    'fi',
    'da',
    'nb',
    'de',
    'fr',
    'nl',
    'it',
    'es',
    'pt',
    'pl',
    'cs',
    'ja',
  ]);

  return supportedLocales.has(language as StripeCheckoutLocale)
    ? (language as StripeCheckoutLocale)
    : 'auto';
}
