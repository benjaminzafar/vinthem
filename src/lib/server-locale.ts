import { cookies, headers } from 'next/headers';

import { DEFAULT_LANGUAGE, isSupportedLanguage } from '@/lib/i18n-routing';

export async function getServerLocale(): Promise<string> {
  const headerStore = await headers();
  const activeLocale = headerStore.get('x-active-locale');

  if (isSupportedLanguage(activeLocale)) {
    return activeLocale;
  }

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;

  if (isSupportedLanguage(cookieLocale)) {
    return cookieLocale;
  }

  return DEFAULT_LANGUAGE;
}
