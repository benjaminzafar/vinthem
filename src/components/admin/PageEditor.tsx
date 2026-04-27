"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileCode, Languages, Save, Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

import { savePageAction } from '@/app/actions/pages';
import { useSettingsStore } from '@/store/useSettingsStore';
import { StaticPage } from '@/types';
import { genAI } from '@/lib/ai';
import { slugify } from '@/lib/admin-content';

type PageEditorProps = {
  initialPage?: StaticPage | null;
};

type PageDraft = {
  title: Record<string, string>;
  slug: string;
  content: Record<string, string>;
};

function buildEmptyLocalizedRecord(languages: string[]): Record<string, string> {
  return languages.reduce<Record<string, string>>((accumulator, language) => {
    accumulator[language] = '';
    return accumulator;
  }, {});
}

export function PageEditor({ initialPage }: PageEditorProps) {
  const router = useRouter();
  const { settings } = useSettingsStore();
  const languages = settings.languages || ['en', 'sv'];
  const [selectedLang, setSelectedLang] = useState(languages[0] || 'en');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState<PageDraft>({
    title: initialPage?.title ?? buildEmptyLocalizedRecord(languages),
    slug: initialPage?.slug ?? '',
    content: initialPage?.content ?? buildEmptyLocalizedRecord(languages),
  });

  const handleAIAutoComplete = async () => {
    if (!formData.title.en.trim()) {
      toast.error('Add an English page title first.');
      return;
    }

    setGenerating(true);
    const toastId = toast.loading('Drafting page content...');

    try {
      const prompt = `Generate premium markdown content for an ecommerce static page titled "${formData.title.en}".
Return ONLY the markdown body.`;

      const model = genAI.getGenerativeModel({ model: 'llama-3.3-70b-versatile' });
      const aiResponse = await model.generateContent(prompt);

      setFormData((current) => ({
        ...current,
        content: { ...current.content, en: aiResponse.response.text().trim() },
      }));
      toast.success('Page drafted.', { id: toastId });
    } catch (error: unknown) {
      const status = typeof error === 'object' && error && 'status' in error ? (error as { status?: number }).status : undefined;
      const message = error instanceof Error ? error.message : 'AI generation failed.';

      if (status === 401 || status === 403) {
        toast.error('Action Required: Please set your Groq API Key in the Integrations Manager.', {
          id: toastId,
          duration: 6000,
        });
      } else {
        toast.error(message, { id: toastId, duration: 8000 });
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleAITranslate = async () => {
    if (!formData.title.en.trim() || !formData.content.en.trim()) {
      toast.error('Add English title and content first.');
      return;
    }

    const targetLanguages = languages.filter((language) => language !== 'en');
    if (targetLanguages.length === 0) {
      toast.info('No extra languages configured.');
      return;
    }

    setGenerating(true);
    const toastId = toast.loading('Translating page content...');

    try {
      const prompt = `Translate this static page into: ${targetLanguages.join(', ')}.
Return ONLY JSON matching:
{
  "title": { "lang": "translated title" },
  "content": { "lang": "translated markdown" }
}
Title: "${formData.title.en}"
Content: "${formData.content.en}"`;

      const model = genAI.getGenerativeModel({
        model: 'llama-3.3-70b-versatile',
        generationConfig: { responseMimeType: 'application/json' },
      });
      const aiResponse = await model.generateContent(prompt);
      const result = JSON.parse(aiResponse.response.text() || '{}') as {
        title?: Record<string, string>;
        content?: Record<string, string>;
      };

      setFormData((current) => ({
        ...current,
        title: { ...current.title, ...(result.title ?? {}) },
        content: { ...current.content, ...(result.content ?? {}) },
      }));
      toast.success('Translations updated.', { id: toastId });
    } catch (error: unknown) {
      const status = typeof error === 'object' && error && 'status' in error ? (error as { status?: number }).status : undefined;
      const message = error instanceof Error ? error.message : 'AI translation failed.';

      if (status === 401 || status === 403) {
        toast.error('Action Required: Please set your Groq API Key in the Integrations Manager.', {
          id: toastId,
          duration: 6000,
        });
      } else {
        toast.error(message, { id: toastId, duration: 8000 });
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const toastId = toast.loading(initialPage ? 'Saving page...' : 'Creating page...');

    try {
      const result = await savePageAction({
        id: initialPage?.id,
        title: formData.title,
        slug: formData.slug || slugify(formData.title.en),
        content: formData.content,
        languages,
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success(result.message, { id: toastId });
      router.push('/admin/pages');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save page.';
      toast.error(message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/pages')}
              className="rounded-[4px] border border-slate-200 bg-white p-2.5 transition-all hover:border-slate-900"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </button>
            <div>
              <h1 className="mb-1.5 text-[18px] font-bold leading-none tracking-tight text-slate-900">
                {initialPage ? `Edit: ${formData.title.en || 'Page'}` : 'New Page'}
              </h1>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                <FileCode className="h-3 w-3" />
                Static Page Editor
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex h-11 items-center justify-center gap-2 rounded-[4px] bg-slate-900 px-8 text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:bg-slate-800 w-full md:w-auto"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Publish Page'}
            </button>
          </div>
        </div>

        <div className="mb-10 flex flex-col items-center gap-6 rounded-[4px] border border-indigo-100 bg-indigo-50/30 p-6 md:flex-row">
          <div className="shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-100 bg-white">
              <Sparkles className="h-5 w-5 animate-pulse text-indigo-600" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-900">Page Assistant</p>
            <p className="mt-1 text-sm text-indigo-700">Draft a polished static page from the title, then localize it across active languages.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={handleAIAutoComplete}
              disabled={generating}
              className="flex h-11 items-center justify-center gap-2 rounded-[4px] border border-indigo-100 bg-white px-5 text-[11px] font-bold uppercase tracking-widest text-indigo-700 transition-all hover:bg-indigo-50 w-full sm:w-auto"
            >
              <Wand2 className="h-4 w-4" />
              Auto-Draft
            </button>
            <button
              type="button"
              onClick={handleAITranslate}
              disabled={generating}
              className="flex h-11 items-center justify-center gap-2 rounded-[4px] bg-indigo-600 px-5 text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:bg-indigo-700 w-full sm:w-auto"
            >
              <Languages className="h-4 w-4" />
              Translate
            </button>
          </div>
        </div>

        <section className="rounded-[4px] border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-6 py-4">
            <FileCode className="h-4 w-4 text-slate-500" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Page Content</h3>
          </div>
          <div className="space-y-6 p-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(event) => setFormData((current) => ({ ...current, slug: event.target.value }))}
                  placeholder="privacy-policy"
                  className="h-12 w-full rounded-[4px] border border-slate-200 px-4 font-mono text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div className="flex items-end">
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                  Live URL: `/p/{formData.slug || slugify(formData.title.en)}`
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-b border-slate-100 pb-2">
              {languages.map((language) => (
                <button
                  key={language}
                  onClick={() => setSelectedLang(language)}
                  className={`text-[11px] font-bold uppercase tracking-widest transition-all ${
                    selectedLang === language ? 'text-slate-900 underline underline-offset-4' : 'text-slate-500 hover:text-slate-600'
                  }`}
                >
                  {language}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Title ({selectedLang})</label>
              <input
                type="text"
                value={formData.title[selectedLang] ?? ''}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    title: { ...current.title, [selectedLang]: event.target.value },
                    slug: selectedLang === 'en' ? slugify(event.target.value) : current.slug,
                  }))
                }
                className="h-12 w-full rounded-[4px] border border-slate-200 px-4 text-sm font-bold focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Content ({selectedLang})</label>
              <textarea
                rows={16}
                value={formData.content[selectedLang] ?? ''}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    content: { ...current.content, [selectedLang]: event.target.value },
                  }))
                }
                className="w-full rounded-[4px] border border-slate-200 p-4 font-mono text-sm leading-relaxed focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
