"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { createClient } from '@/utils/supabase/client';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import { ChevronRight, Home, Loader2 } from 'lucide-react';
import { StaticPage } from '@/types';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function StaticPageDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<StaticPage | null>(null);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettingsStore();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const supabase = createClient();

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('pages')
          .select('*, updatedAt:updated_at')
          .eq('slug', slug)
          .single();

        if (error) throw error;
        setPage(data as StaticPage);
      } catch (error) {
        console.error("Error fetching page:", error);
        setPage(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-ink mb-4" />
        <p className="text-brand-muted font-medium">{settings.loadingPageText?.[lang]}</p>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl font-sans font-bold text-brand-ink mb-4">{settings.pageNotFoundTitleText?.[lang]}</h1>
        <p className="text-brand-muted mb-8 max-w-md">
          {settings.pageNotFoundDescriptionText?.[lang]}
        </p>
        <Link 
          href="/" 
          className="bg-brand-ink text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
        >
          {settings.returnHomeButtonText?.[lang]}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-brand-bg min-h-screen pb-20">
      {/* Breadcrumbs */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center space-x-2 text-sm text-brand-muted mb-8">
          <Link href="/" className="hover:text-brand-ink transition-colors flex items-center">
            <Home className="w-4 h-4 mr-1" /> {settings.homeBreadcrumbText?.[lang]}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-brand-ink font-medium">{page.title[lang] || page.title['en']}</span>
        </nav>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100"
        >
          <header className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-sans font-bold text-brand-ink mb-4">
              {page.title[lang] || page.title['en']}
            </h1>
            <div className="w-20 h-1 bg-brand-ink mx-auto mb-6"></div>
            <p className="text-sm text-brand-muted">
              {settings.lastUpdatedText?.[lang]}: {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString(lang === 'sv' ? 'sv-SE' : lang) : ''}
            </p>
          </header>

          <div className="prose prose-lg prose-slate max-w-none prose-headings:font-sans prose-headings:text-brand-ink prose-a:text-brand-ink prose-img:rounded-2xl">
            <ReactMarkdown>{page.content[lang] || page.content['en']}</ReactMarkdown>
          </div>
        </motion.article>
      </div>
    </div>
  );
}
