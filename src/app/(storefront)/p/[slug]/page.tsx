import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import ReactMarkdown from 'react-markdown';
import { Home, ChevronRight } from 'lucide-react';
import { StaticPage } from '@/types';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: page } = await supabase
    .from('pages')
    .select('title')
    .eq('slug', slug)
    .single();

  if (!page) return { title: 'Page Not Found' };

  return {
    title: `${page.title['en'] || 'Page'} | Mavren Shop`,
  };
}

export default async function StaticPageDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch page data
  const { data: pageData, error } = await supabase
    .from('pages')
    .select('*, updatedAt:updated_at')
    .eq('slug', slug)
    .single();

  if (error || !pageData) {
    notFound();
  }

  const page = pageData as StaticPage;

  // Fetch settings for text labels
  const { data: settingsData } = await supabase
    .from('settings')
    .select('data')
    .eq('id', 'primary')
    .single();

  const settings = settingsData?.data || {};
  const lang = 'en'; // Default to en for server rendering, or handle via cookies if implemented

  return (
    <div className="bg-brand-bg min-h-screen pb-20 animate-in fade-in duration-700">
      {/* Breadcrumbs */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center space-x-2 text-sm text-brand-muted mb-8">
          <Link href="/" className="hover:text-brand-ink transition-colors flex items-center">
            <Home className="w-4 h-4 mr-1" /> {settings.homeBreadcrumbText?.[lang] || 'Home'}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-brand-ink font-medium">{page.title[lang] || page.title['en']}</span>
        </nav>

        <article className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-sm">
          <header className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-sans font-bold text-brand-ink mb-4">
              {page.title[lang] || page.title['en']}
            </h1>
            <div className="w-20 h-1 bg-brand-ink mx-auto mb-6"></div>
            <p className="text-sm text-brand-muted">
              {settings.lastUpdatedText?.[lang] || 'Last Updated'}: {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : ''}
            </p>
          </header>

          <div className="prose prose-lg prose-slate max-w-none prose-headings:font-sans prose-headings:text-brand-ink prose-a:text-brand-ink prose-img:rounded-2xl">
            <ReactMarkdown>{page.content[lang] || page.content['en']}</ReactMarkdown>
          </div>
        </article>
      </div>
    </div>
  );
}
