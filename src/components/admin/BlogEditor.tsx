"use client";

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, ImageIcon, Languages, Save, Sparkles, User, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

import { saveBlogPostAction } from '@/app/actions/blog-posts';
import { MediaPickerModal } from '@/components/admin/MediaPickerModal';
import { useSettingsStore } from '@/store/useSettingsStore';
import { BlogPost } from '@/types';
import { genAI } from '@/lib/ai';
import { safeParseAiResponse } from '@/lib/json';
import { toMediaProxyUrl } from '@/lib/media';
import { isValidUrl } from '@/lib/utils';
import { AdminHeader } from '@/components/admin/AdminHeader';

type BlogEditorProps = {
  initialPost?: BlogPost | null;
};

type BlogDraft = {
  title: Record<string, string>;
  excerpt: Record<string, string>;
  content: Record<string, string>;
  imageUrl: string;
  author: string;
};

function buildEmptyLocalizedRecord(languages: string[]): Record<string, string> {
  return languages.reduce<Record<string, string>>((accumulator, language) => {
    accumulator[language] = '';
    return accumulator;
  }, {});
}

export function BlogEditor({ initialPost }: BlogEditorProps) {
  const router = useRouter();
  const { settings } = useSettingsStore();
  const languages = settings.languages || ['en', 'sv'];
  const [selectedLang, setSelectedLang] = useState(languages[0] || 'en');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [formData, setFormData] = useState<BlogDraft>({
    title: initialPost?.title ?? buildEmptyLocalizedRecord(languages),
    excerpt: initialPost?.excerpt ?? buildEmptyLocalizedRecord(languages),
    content: initialPost?.content ?? buildEmptyLocalizedRecord(languages),
    imageUrl: initialPost?.imageUrl ?? '',
    author: initialPost?.author ?? '',
  });

  const displayDate = useMemo(() => {
    if (!initialPost?.createdAt) {
      return 'New draft';
    }

    return new Date(initialPost.createdAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [initialPost?.createdAt]);

  const getAIErrorMessage = (error: unknown, fallback: string) => {
    const err = error as Error & { status?: number };
    if (err.status === 401 || err.status === 403) return 'Groq API key is missing or invalid in Integrations.';
    if (err.status === 429) return 'AI is temporarily busy. Please wait a few seconds and try again.';
    if (err.status === 500 || err.status === 503) return 'AI service is temporarily overloaded. Please retry in 1-2 minutes.';
    return err.message || fallback;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading('Uploading journal banner...');

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('path', `blogs/${Date.now()}_${file.name}`);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      });

      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      
      setFormData((current) => ({ ...current, imageUrl: url }));
      toast.success('Banner uploaded.', { id: toastId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed.';
      toast.error(message, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleAIAutoComplete = async () => {
    if (!formData.title.en.trim()) {
      toast.error('Add an English title first.');
      return;
    }

    setGenerating(true);
    const toastId = toast.loading('Drafting the journal article...');

    try {
      const prompt = `Generate a premium journal article for an ecommerce brand.
Return ONLY JSON matching:
{
  "excerpt": "short excerpt",
  "content": "full markdown article"
}
Title: "${formData.title.en}"`;

      const model = genAI.getGenerativeModel({
        model: 'llama-3.3-70b-versatile',
        promptProfile: 'blog',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const aiResponse = await model.generateContent(prompt);
      const result = safeParseAiResponse<{
        excerpt?: string;
        content?: string;
      }>(aiResponse.response.text(), {});

      setFormData((current) => ({
        ...current,
        excerpt: { ...current.excerpt, en: result.excerpt?.trim() ?? current.excerpt.en },
        content: { ...current.content, en: result.content?.trim() ?? current.content.en },
      }));
      toast.success('Article drafted.', { id: toastId });
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
    const toastId = toast.loading('Translating journal content...');

    try {
      const prompt = `Translate this article into: ${targetLanguages.join(', ')}.
Return ONLY JSON matching:
{
  "title": { "lang": "translated title" },
  "excerpt": { "lang": "translated excerpt" },
  "content": { "lang": "translated content" }
}
Title: "${formData.title.en}"
Excerpt: "${formData.excerpt.en}"
Content: "${formData.content.en}"`;

      const model = genAI.getGenerativeModel({
        model: 'llama-3.3-70b-versatile',
        promptProfile: 'blog',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const aiResponse = await model.generateContent(prompt);
      const result = safeParseAiResponse<{
        title?: Record<string, string>;
        excerpt?: Record<string, string>;
        content?: Record<string, string>;
      }>(aiResponse.response.text(), {});

      setFormData((current) => ({
        ...current,
        title: { ...current.title, ...(result.title ?? {}) },
        excerpt: { ...current.excerpt, ...(result.excerpt ?? {}) },
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
    const toastId = toast.loading(initialPost ? 'Saving article...' : 'Publishing article...');

    try {
      const result = await saveBlogPostAction({
        id: initialPost?.id,
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        imageUrl: formData.imageUrl,
        author: formData.author,
        languages,
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success(result.message, { id: toastId });
      router.push('/admin/blogs');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save article.';
      toast.error(message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <AdminHeader
        title={initialPost ? `Edit Article: ${formData.title.en || 'Untitled'}` : 'New Journal Entry'}
        description="Write editorial content, prepare localized copy, and manage the hero image in one place."
        primaryAction={{ label: saving ? 'Saving...' : 'Publish Article', icon: Save, onClick: handleSave, disabled: saving || uploading }}
        secondaryActions={[{ label: 'Back to Journal', icon: ArrowLeft, onClick: () => router.push('/admin/blogs') }]}
        statsLabel={displayDate}
      />

        <div className="flex flex-col items-start gap-5 rounded-[4px] border border-indigo-100 bg-indigo-50/30 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div className="shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-100 bg-white">
              <Sparkles className="h-5 w-5 animate-pulse text-indigo-600" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-900">Editorial Assistant</p>
            <p className="mt-1 text-sm text-indigo-700">Generate the article body from the title, then translate it across your active storefront languages.</p>
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

        <div className="grid grid-cols-1 gap-6 sm:gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <section className="rounded-[4px] border border-slate-200 bg-white">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-6 py-4">
                <Sparkles className="h-4 w-4 text-slate-500" />
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900">Article Details</h3>
              </div>
              <div className="space-y-6 p-5 sm:p-6">
                <div className="space-y-3">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Author</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(event) => setFormData((current) => ({ ...current, author: event.target.value }))}
                      className="h-12 w-full rounded-[4px] border border-slate-200 pl-11 pr-4 text-sm font-medium focus:border-slate-900 focus:outline-none"
                    />
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
                      }))
                    }
                    className="h-12 w-full rounded-[4px] border border-slate-200 px-4 text-sm font-medium focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Excerpt ({selectedLang})</label>
                  <textarea
                    rows={3}
                    value={formData.excerpt[selectedLang] ?? ''}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        excerpt: { ...current.excerpt, [selectedLang]: event.target.value },
                      }))
                    }
                    className="w-full rounded-[4px] border border-slate-200 p-4 text-sm leading-relaxed focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Content ({selectedLang})</label>
                  <textarea
                    rows={12}
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

          <div className="space-y-6">
            <section className="overflow-hidden rounded-[4px] border border-slate-200 bg-white">
              <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900">Hero Image</h3>
              </div>
              <div className="p-6">
                <div className="group relative mb-4 aspect-[4/3] cursor-pointer overflow-hidden rounded-[4px] border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-slate-900">
                  {isValidUrl(formData.imageUrl) ? (
                    <Image src={toMediaProxyUrl(formData.imageUrl)} alt="" fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Upload article banner</p>
                      </div>
                    </div>
                  )}
                  <label className="absolute inset-0 cursor-pointer">
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(event) => setFormData((current) => ({ ...current, imageUrl: event.target.value }))}
                    placeholder="Paste image URL..."
                    className="h-10 flex-1 rounded-[4px] border border-slate-200 px-3 text-[12px] focus:border-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="h-10 rounded-md border border-slate-200 bg-slate-50 px-4 text-[12px] font-medium"
                  >
                    Library
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>

      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(url) => {
          setFormData((current) => ({ ...current, imageUrl: url }));
          setIsMediaPickerOpen(false);
        }}
      />
    </div>
  );
}
