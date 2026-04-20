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
  if (!(slug in POLICY_MAP)) {
    return { page: null, settings: null as Partial<StorefrontSettings> | null };
  }

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

  if (!(slug in POLICY_MAP) || !settings) {
    return { page: null, settings: null as Partial<StorefrontSettings> | null };
  }

  const settingsBackedPage = buildPolicyFromSettings(slug as PolicySlug, settings);
  return {
    page: settingsBackedPage ?? page,
    settings,
  };
}

export async function getPolicyPageMetadata(slug: string) {
  const lang = await getServerLocale();
  const { page } = await getRenderablePolicyPage(slug);

  if (!page) {
    return { title: 'Page Not Found | Mavren Shop' };
  }

  return {
    title: `${getLocalizedValue(page.title, lang, 'Policy')} | Mavren Shop`,
  };
}

export async function renderPolicyPage(slug: string) {
  const lang = await getServerLocale();
  const { page, settings } = await getRenderablePolicyPage(slug);

  if (!page || !settings) {
    notFound();
  }

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

        <section className="border border-slate-300 bg-white">
          <div className="border-b border-slate-300 px-6 py-6 md:px-10 md:py-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-slate-300 bg-white">
                <PolicyIcon className="h-4 w-4 text-slate-900" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{presentation.eyebrow}</span>
            </div>

            <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {title}
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500">
              {presentation.lead}
            </p>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              <span>{updatedLabel}: <span className="text-slate-700">{updatedAt}</span></span>
              <span>Source: <span className="text-slate-700">Storefront Settings</span></span>
            </div>
          </div>

          <div className="px-6 py-8 md:px-10 md:py-10">
            <div className="prose prose-slate max-w-none prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 prose-h2:mt-10 prose-h2:border-t prose-h2:border-slate-200 prose-h2:pt-6 prose-h3:mt-8 prose-p:text-[15px] prose-p:leading-8 prose-p:text-slate-600 prose-li:text-[15px] prose-li:leading-8 prose-li:text-slate-600 prose-strong:text-slate-900 prose-a:font-semibold prose-a:text-slate-900 prose-a:underline prose-a:underline-offset-4 prose-ul:space-y-2 prose-ol:space-y-2">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
