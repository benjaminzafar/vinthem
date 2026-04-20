import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, normalizeLocalizedPath } from '@/lib/i18n-routing';

// Static params generation is removed to support dynamic language additions from the database.
// This allows the storefront to scale without needing a manual code rebuild.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const headerStore = await headers();
  const pathnameWithoutLocale = headerStore.get('x-pathname-no-locale') || '/';

  return {
    alternates: {
      canonical: normalizeLocalizedPath(pathnameWithoutLocale, lang),
      languages: {
        ...Object.fromEntries(
          SUPPORTED_LANGUAGES.map((locale) => [locale, normalizeLocalizedPath(pathnameWithoutLocale, locale)]),
        ),
        'x-default': normalizeLocalizedPath(pathnameWithoutLocale, DEFAULT_LANGUAGE),
      },
    },
  };
}

export default async function LocalizedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Permissive check: If it reached here, isSupportedLanguage in middleware already validated the 2-letter pattern.

  return children;
}
