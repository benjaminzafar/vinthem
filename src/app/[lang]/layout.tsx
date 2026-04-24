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

  const storeName = settings?.storeName?.[lang] || settings?.storeName?.['en'] || 'Vinthem';
  const seoTitle = settings?.seoTitle?.[lang] || settings?.seoTitle?.['en'] || storeName;
  const seoDesc = settings?.seoDescription?.[lang] || settings?.seoDescription?.['en'] || "";

  // For Lighthouse 100 SEO: Canonical should be self-referential for localized pages
  const canonicalUrl = normalizeLocalizedPath(pathnameWithoutLocale, lang);

  return {
    title: {
      template: `%s | ${storeName}`,
      default: seoTitle,
    },
    description: seoDesc,
    alternates: {
      canonical: canonicalUrl,
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
