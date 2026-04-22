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
import { isValidUrl } from '@/lib/utils';

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Uploading journal banner...');

    try {
      const { uploadImageWithTimeout } = await import('@/lib/upload');
      const url = await uploadImageWithTimeout(file, `blogs/${Date.now()}_${file.name}`);
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
        generationConfig: { responseMimeType: 'application/json' },
      });

      const aiResponse = await model.generateContent(prompt);
      const result = JSON.parse(aiResponse.response.text() || '{}') as {
        excerpt?: string;
        content?: string;
      };

      setFormData((current) => ({
        ...current,
        excerpt: { ...current.excerpt, en: result.excerpt?.trim() ?? current.excerpt.en },
        content: { ...current.content, en: result.content?.trim() ?? current.content.en },
      }));
      toast.success('Article drafted.', { id: toastId });
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
        generationConfig: { responseMimeType: 'application/json' },
      });

      const aiResponse = await model.generateContent(prompt);
      const result = JSON.parse(aiResponse.response.text() || '{}') as {
        title?: Record<string, string>;
        excerpt?: Record<string, string>;
        content?: Record<string, string>;
      };

      setFormData((current) => ({
        ...current,
        title: { ...current.title, ...(result.title ?? {}) },
        excerpt: { ...current.excerpt, ...(result.excerpt ?? {}) },
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
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/blogs')}
              className="rounded-[4px] border border-slate-200 bg-white p-2.5 transition-all hover:border-slate-900"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </button>
            <div>
              <h1 className="mb-1.5 text-2xl font-black leading-none tracking-tight text-slate-900">
                {initialPost ? `Edit: ${formData.title.en || 'Journal Entry'}` : 'New Journal Entry'}
              </h1>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                <CalendarDays className="h-3 w-3" />
                {displayDate}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="flex h-11 items-center justify-center gap-2 rounded-[4px] bg-slate-900 px-8 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-slate-800 w-full md:w-auto"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Publish Article'}
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
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-900">Editorial Assistant</p>
            <p className="mt-1 text-sm text-indigo-700">Generate the article body from the title, then translate it across your active storefront languages.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={handleAIAutoComplete}
              disabled={generating}
              className="flex h-11 items-center justify-center gap-2 rounded-[4px] border border-indigo-100 bg-white px-5 text-[10px] font-black uppercase tracking-widest text-indigo-700 transition-all hover:bg-indigo-50 w-full sm:w-auto"
            >
              <Wand2 className="h-4 w-4" />
              Auto-Draft
            </button>
            <button
              type="button"
              onClick={handleAITranslate}
              disabled={generating}
              className="flex h-11 items-center justify-center gap-2 rounded-[4px] bg-indigo-600 px-5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-indigo-700 w-full sm:w-auto"
            >
              <Languages className="h-4 w-4" />
              Translate
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <section className="rounded-[4px] border border-slate-200 bg-white">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-6 py-4">
                <Sparkles className="h-4 w-4 text-slate-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Article Details</h3>
              </div>
              <div className="space-y-6 p-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Author</label>
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

                <div className="flex gap-2 border-b border-slate-100 pb-2">
                  {languages.map((language) => (
                    <button
                      key={language}
                      onClick={() => setSelectedLang(language)}
                      className={`text-[10px] font-black uppercase tracking-widest transition-all ${
                        selectedLang === language ? 'text-slate-900 underline underline-offset-4' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Title ({selectedLang})</label>
                  <input
                    type="text"
                    value={formData.title[selectedLang] ?? ''}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        title: { ...current.title, [selectedLang]: event.target.value },
                      }))
                    }
                    className="h-12 w-full rounded-[4px] border border-slate-200 px-4 text-sm font-bold focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Excerpt ({selectedLang})</label>
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Content ({selectedLang})</label>
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

          <div className="space-y-8">
            <section className="overflow-hidden rounded-[4px] border border-slate-200 bg-white">
              <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Hero Image</h3>
              </div>
              <div className="p-6">
                <div className="group relative mb-4 aspect-[4/3] cursor-pointer overflow-hidden rounded-[4px] border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-slate-900">
                  {isValidUrl(formData.imageUrl) ? (
                    <Image src={formData.imageUrl} alt="" fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload article banner</p>
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
                    className="h-10 flex-1 rounded-[4px] border border-slate-200 px-3 text-xs focus:border-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="h-10 rounded border border-slate-200 bg-slate-50 px-4 text-[10px] font-black uppercase tracking-widest"
                  >
                    Lib
                  </button>
                </div>
              </div>
            </section>
          </div>
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
