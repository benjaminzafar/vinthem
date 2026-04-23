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
  const storeDesc = localeDescriptions[lang as keyof typeof localeDescriptions] || localeDescriptions.en;

  return {
    title: {
      template: `%s | ${storeName}`,
      default: `${storeName} | ${lang === 'sv' ? 'Exklusiv skandinavisk design' : 'Premium Scandinavian Design'}`,
    },
    description: storeDesc,
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

const localeDescriptions = {
  en: "Handpicked premium Scandinavian interior design. Ethical, sustainable, and timeless pieces for your home.",
  sv: "Handplockad premium skandinavisk inredning. Etiska, hållbara och tidlösa möbler för ditt hem.",
  fi: "Käsin poimittua ensiluokkaista skandinaavista sisustusta. Eettisiä, kestäviä ja ajattomia esineitä kotiisi.",
  da: "Håndplukket premium skandinavisk indretning. Etiske, bæredygtige og tidløse genstande til dit hjem."
};

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
