import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { getSettings } from '@/lib/data';
import { normalizeLocalizedPath, DEFAULT_LANGUAGE } from '@/lib/locales';


export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const settings = await getSettings();
  const activeLocales = settings?.languages || ['en', 'sv', 'fi', 'da'];
  
  const headerStore = await headers();
  const pathnameWithoutLocale = headerStore.get('x-pathname-no-locale') || '/';

  return {
    alternates: {
      canonical: normalizeLocalizedPath(pathnameWithoutLocale, lang),
      languages: {
        ...Object.fromEntries(
          activeLocales.map((locale) => [locale, normalizeLocalizedPath(pathnameWithoutLocale, locale)]),
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
