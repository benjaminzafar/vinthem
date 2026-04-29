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
import { safeParseAiResponse } from '@/lib/json';
import { AdminHeader } from '@/components/admin/AdminHeader';

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

  const getAIErrorMessage = (error: unknown, fallback: string) => {
    const err = error as Error & { status?: number };
    if (err.status === 401 || err.status === 403) return 'Groq API key is missing or invalid in Integrations.';
    if (err.status === 429) return 'AI is temporarily busy. Please wait a few seconds and try again.';
    if (err.status === 500 || err.status === 503) return 'AI service is temporarily overloaded. Please retry in 1-2 minutes.';
    return err.message || fallback;
  };

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

      const model = genAI.getGenerativeModel({ model: 'llama-3.3-70b-versatile', promptProfile: 'page' });
      const aiResponse = await model.generateContent(prompt);

      setFormData((current) => ({
        ...current,
        content: { ...current.content, en: aiResponse.response.text().trim() },
      }));
      toast.success('Page drafted.', { id: toastId });
    } catch (error: unknown) {
      toast.error(getAIErrorMessage(error, 'AI generation failed.'), { id: toastId, duration: 5000 });
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
        promptProfile: 'page',
        generationConfig: { responseMimeType: 'application/json' },
      });
      const aiResponse = await model.generateContent(prompt);
      const result = safeParseAiResponse<{
        title?: Record<string, string>;
        content?: Record<string, string>;
      }>(aiResponse.response.text(), {});

      setFormData((current) => ({
        ...current,
        title: { ...current.title, ...(result.title ?? {}) },
        content: { ...current.content, ...(result.content ?? {}) },
      }));
      toast.success('Translations updated.', { id: toastId });
    } catch (error: unknown) {
      toast.error(getAIErrorMessage(error, 'AI translation failed.'), { id: toastId, duration: 5000 });
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
    <div className="space-y-6 pb-12">
      <AdminHeader
        title={initialPage ? `Edit Page: ${formData.title.en || 'Untitled'}` : 'New Page'}
        description="Compose policy and support pages, then localize them across active storefront languages."
        primaryAction={{ label: saving ? 'Saving...' : 'Publish Page', icon: Save, onClick: handleSave, disabled: saving }}
        secondaryActions={[{ label: 'Back to Pages', icon: ArrowLeft, onClick: () => router.push('/admin/pages') }]}
        statsLabel="static page editor"
      />

        <div className="flex flex-col items-start gap-5 rounded-[4px] border border-indigo-100 bg-indigo-50/30 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div className="shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-100 bg-white">
              <Sparkles className="h-5 w-5 animate-pulse text-indigo-600" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-900">Page Assistant</p>
            <p className="mt-1 text-sm text-indigo-700">Draft a polished static page from the title, then localize it across active languages.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={handleAIAutoComplete}
              disabled={generating}
              className="flex h-11 items-center justify-center gap-2 rounded-[4px] border border-indigo-100 bg-white px-5 text-[12px] font-medium text-indigo-700 transition-all hover:bg-indigo-50 w-full sm:w-auto"
            >
              <Wand2 className="h-4 w-4" />
              Auto-Draft
            </button>
            <button
              type="button"
              onClick={handleAITranslate}
              disabled={generating}
              className="flex h-11 items-center justify-center gap-2 rounded-[4px] bg-indigo-600 px-5 text-[12px] font-medium text-white transition-all hover:bg-indigo-700 w-full sm:w-auto"
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
          <div className="space-y-6 p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(event) => setFormData((current) => ({ ...current, slug: event.target.value }))}
                  placeholder="privacy-policy"
                  className="h-12 w-full rounded-[4px] border border-slate-200 px-4 font-mono text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div className="flex items-end">
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 px-4 py-3 text-[12px] font-medium text-slate-500">
                  Live URL: `/p/{formData.slug || slugify(formData.title.en)}`
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-2">
              {languages.map((language) => (
                <button
                  key={language}
                  onClick={() => setSelectedLang(language)}
                  className={`min-w-[52px] rounded-md px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-all ${
                    selectedLang === language ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  {language}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Title ({selectedLang})</label>
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
                className="h-12 w-full rounded-[4px] border border-slate-200 px-4 text-sm font-medium focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Content ({selectedLang})</label>
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
  );
}
