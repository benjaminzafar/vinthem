import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { Home, ChevronRight, Shield, Cookie, Scale, FileText } from 'lucide-react';

import { createClient } from '@/utils/supabase/server';
import { getSettings } from '@/lib/data';
import { defaultPolicyContent } from '@/lib/policy-defaults';
import { StaticPage } from '@/types';
import type { StorefrontSettings } from '@/store/useSettingsStore';
import { getServerLocale } from '@/lib/server-locale';
import { localizeHref } from '@/lib/i18n-routing';

type StaticPageRecord = StaticPage & {
  updatedAt?: string;
};

type PolicySlug = 'privacy-policy' | 'cookie-policy' | 'terms-of-service';

type PolicySettingsMap = {
  title: keyof StorefrontSettings;
  content: keyof StorefrontSettings;
};

const POLICY_MAP: Record<PolicySlug, PolicySettingsMap> = {
  'privacy-policy': {
    title: 'privacyPolicyPageTitle',
    content: 'privacyPolicyPageContent',
  },
  'cookie-policy': {
    title: 'cookiePolicyPageTitle',
    content: 'cookiePolicyPageContent',
  },
  'terms-of-service': {
    title: 'termsOfServicePageTitle',
    content: 'termsOfServicePageContent',
  },
};

function getPolicyPresentation(slug: string) {
  if (slug === 'privacy-policy') {
    return {
      icon: Shield,
      eyebrow: 'Privacy Policy',
      lead: 'Customer data, account information, checkout records, and support activity are handled under this privacy framework.',
      summary: 'Data handling',
    };
  }

  if (slug === 'cookie-policy') {
    return {
      icon: Cookie,
      eyebrow: 'Cookie Policy',
      lead: 'Essential cookies keep the storefront stable, while optional analytics only activate after consent is given.',
      summary: 'Consent controls',
    };
  }

  if (slug === 'terms-of-service') {
    return {
      icon: Scale,
      eyebrow: 'Terms of Service',
      lead: 'These terms define store usage, account expectations, order handling, and the relationship between customer and storefront.',
      summary: 'Store rules',
    };
  }

  return {
    icon: FileText,
    eyebrow: 'Store Policy',
    lead: 'Important store information and customer-facing policy content.',
    summary: 'Policy content',
  };
}

function getLocalizedValue(
  value: Record<string, string> | undefined,
  lang: string,
  fallback: string
) {
  if (!value) {
    return fallback;
  }

  return value[lang] || value.en || fallback;
}

async function getPolicyPageSource(slug: string) {
  const supabase = await createClient();
  const settings = {
    ...defaultPolicyContent,
    ...((await getSettings()) as Partial<StorefrontSettings>),
  } as Partial<StorefrontSettings>;

  const { data: pageData } = await supabase
    .from('pages')
    .select('*, updatedAt:updated_at')
    .eq('slug', slug)
    .maybeSingle();

  const page = pageData as StaticPageRecord | null;
  return { page, settings };
}

function buildPolicyFromSettings(
  slug: PolicySlug,
  settings: Partial<StorefrontSettings>
): StaticPageRecord | null {
  const config = POLICY_MAP[slug];
  const title = settings[config.title] as Record<string, string> | undefined;
  const content = settings[config.content] as Record<string, string> | undefined;

  if (!title || !content) {
    return null;
  }

  return {
    slug,
    title,
    content,
    updatedAt: new Date().toISOString(),
  };
}

async function getRenderablePolicyPage(slug: string) {
  const { page, settings } = await getPolicyPageSource(slug);

  if (!settings) {
    return { page: null, settings: null };
  }

  // If it's a core policy, check if we should prefer settings-backed content
  if (slug in POLICY_MAP) {
    const settingsBackedPage = buildPolicyFromSettings(slug as PolicySlug, settings);
    return {
      page: settingsBackedPage ?? page,
      settings,
    };
  }

  // For custom slugs, return the page from database
  return {
    page,
    settings,
  };
}

export async function getPolicyPageMetadata(slug: string) {
  const lang = await getServerLocale();
  const { page } = await getRenderablePolicyPage(slug);

  if (!page) {
    return { title: 'Page Not Found | Vinthem' };
  }

  return {
    title: `${getLocalizedValue(page.title, lang, 'Policy')} | Vinthem`,
  };
}

export async function renderPolicyPage(slug: string) {
  const lang = await getServerLocale();
  const { page, settings } = await getRenderablePolicyPage(slug);

  if (!page || !settings) {
    notFound();
  }

  const isCorePolicy = (slug === 'privacy-policy' || slug === 'cookie-policy' || slug === 'terms-of-service');
  const presentation = getPolicyPresentation(slug);
  const PolicyIcon = presentation.icon;
  const title = getLocalizedValue(page.title, lang, 'Policy');
  const content = getLocalizedValue(page.content, lang, '');
  const homeLabel = getLocalizedValue(settings.homeBreadcrumbText as Record<string, string> | undefined, lang, 'Home');
  const updatedLabel = getLocalizedValue(settings.lastUpdatedText as Record<string, string> | undefined, lang, 'Last Updated');
  const updatedAt = page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : 'Recently updated';

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
          <Link href={localizeHref(lang, '/')} className="inline-flex items-center gap-2 transition-colors hover:text-slate-900">
            <Home className="h-4 w-4" />
            {homeLabel}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-slate-900">{title}</span>
        </nav>

        <section className="border border-slate-300 bg-white shadow-none transition-all hover:shadow-none">
          <div className="border-b border-slate-300 px-6 py-8 md:px-10 md:py-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center border border-slate-300 bg-slate-50 text-slate-900">
                <PolicyIcon className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
                {isCorePolicy ? presentation.eyebrow : 'Information'}
              </span>
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              {title}
            </h1>

            {isCorePolicy && (
              <>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                  {presentation.lead}
                </p>

                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-bold uppercase tracking-widest text-slate-500/80">
                  <span>{updatedLabel}: <span className="text-slate-900">{updatedAt}</span></span>
                  <span>Source: <span className="text-slate-900">Storefront Settings</span></span>
                </div>
              </>
            )}
          </div>

          <div className="px-6 py-10 md:px-10 md:py-12">
            <div className="prose prose-slate max-w-none 
              prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 
              prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-t prose-h2:border-slate-100 prose-h2:pt-8
              prose-h3:mt-10 prose-h3:mb-4
              prose-p:text-[16px] prose-p:leading-8 prose-p:text-slate-600 prose-p:mb-6
              prose-li:text-[16px] prose-li:leading-8 prose-li:text-slate-600
              prose-strong:text-slate-900 prose-a:font-semibold prose-a:text-slate-900
              prose-img:rounded-none">
              <div className="whitespace-pre-wrap">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
