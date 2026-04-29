"use client";
import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Category, StorefrontSettingsType } from '@/types';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { 
  Sparkles, Image as ImageIcon, Layout,
  Wand2, Star, Loader2,
  ChevronRight, ArrowLeft, Save, Languages,
  Layers, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { genAI } from '@/lib/ai';
import { safeParseAiResponse } from '@/lib/json';
import { saveCategoryAction } from '@/app/actions/categories';
import { MediaPickerModal } from './MediaPickerModal';
import Image from 'next/image';
import { logger } from '@/lib/logger';
import { toMediaProxyUrl } from '@/lib/media';
import { isValidUrl } from '@/lib/utils';
import { getAIErrorMessage } from '@/lib/ai-errors';

interface CollectionEditorProps {
  initialCollection?: Category | null;
  categories?: Category[];
  settings: StorefrontSettingsType;
}

interface CollectionAIDraft {
  name?: string;
  slug?: string;
  description?: string;
}

interface CollectionTranslationResult {
  [lang: string]: {
    name?: string;
    description?: string;
  };
}

type CollectionEditorTab = 'hierarchy' | 'translations' | 'engagement';

function mapCollectionToForm(collection?: Category | null): Category {
  return {
    id: collection?.id,
    name: collection?.name || '',
    slug: collection?.slug || '',
    description: collection?.description || '',
    isFeatured: collection?.isFeatured ?? false,
    showInHero: collection?.showInHero ?? false,
    parentId: collection?.parentId || '',
    imageUrl: collection?.imageUrl || '',
    iconUrl: collection?.iconUrl || '',
    translations: collection?.translations || {},
  };
}

export function CollectionEditor({ initialCollection, categories: initialCategories = [], settings }: CollectionEditorProps) {
  const router = useRouter();
  const [loading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bannerLoadFailed, setBannerLoadFailed] = useState(false);
  
  const [formData, setFormData] = useState<Category>(mapCollectionToForm(initialCollection));

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [activeTab, setActiveTab] = useState<CollectionEditorTab>('hierarchy');
  const [selectedLang, setSelectedLang] = useState(settings.languages?.[0] || 'sv');
  const [aiChatInput, setAiChatInput] = useState('');
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Sync form data when initialCollection prop changes (e.g. navigation)
  useEffect(() => {
    if (initialCollection && initialCollection.id !== formData.id) {
      setFormData(mapCollectionToForm(initialCollection));
    }
  }, [initialCollection, formData.id]);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const bannerPreviewUrl = useMemo(() => {
    if (!formData.imageUrl?.trim()) {
      return '';
    }

    return toMediaProxyUrl(formData.imageUrl);
  }, [formData.imageUrl]);

  useEffect(() => {
    setBannerLoadFailed(false);
  }, [bannerPreviewUrl]);

  // Auto-generate slug from name for new collections
  useEffect(() => {
    if (!initialCollection && formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name, initialCollection]);

  const handleAIAutoCompleteCollection = async () => {
    if (!formData.imageUrl) {
      toast.error('Please upload a banner image first.');
      return;
    }
    setGenerating(true);
    const toastId = toast.loading('AI is analyzing the collection banner...');
    try {
      const response = await fetch(bannerPreviewUrl);
      if (!response.ok) {
        throw new Error('Collection banner could not be loaded for AI analysis.');
      }
      const blob = await response.blob();
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      });
      reader.readAsDataURL(blob);
      const base64Data = await base64Promise;

      const model = genAI.getGenerativeModel({ 
        promptProfile: 'collection',
        generationConfig: { responseMimeType: 'application/json' }
      });

      const aiResponse = await model.generateContent([
        { text: 'Analyze this collection banner image and generate a catchy, highly descriptive Swedish name and a persuasive, multi-paragraph Swedish marketing description for this product collection. Return ONLY a valid raw JSON object with "name", "slug" and "description" fields.' },
        { inlineData: { data: base64Data, mimeType: blob.type } }
      ]);

      const result = safeParseAiResponse<CollectionAIDraft>(aiResponse.response.text(), {});
      setFormData(prev => ({
        ...prev,
        name: result.name || prev.name,
        slug: result.slug || prev.slug,
        description: result.description || prev.description
      }));
      toast.success('AI Analysis complete!', { id: toastId });
    } catch (error: unknown) {
      logger.error('[CollectionEditor] AI image analysis failed:', error);
      toast.error(getAIErrorMessage(error, 'AI image analysis failed.'), { id: toastId, duration: 5000 });
    } finally {
      setGenerating(false);
    }
  };

  const handleAIChatAutoFill = async () => {
    if (!aiChatInput.trim()) return;

    setGenerating(true);
    const toastId = toast.loading('AI is drafting your collection...');

    try {
      const prompt = `Task: Convert this collection description into professional Swedish shop meta-data.
      Input: "${aiChatInput}"
      Return ONLY a JSON object with this structure:
      {
        "name": "Catchy Swedish Name",
        "slug": "url-friendly-slug",
        "description": "2-3 Paragraph detailed Swedish marketing description...",
      }`;

      const model = genAI.getGenerativeModel({ 
        promptProfile: 'collection',
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const aiResponse = await model.generateContent(prompt);
      const result = safeParseAiResponse<CollectionAIDraft>(aiResponse.response.text(), {});
      
      setFormData(prev => ({
        ...prev,
        name: result.name || prev.name,
        slug: result.slug || prev.slug,
        description: result.description || prev.description
      }));

      setAiChatInput('');
      toast.success('Collection draft generated!', { id: toastId });
    } catch (error: unknown) {
      logger.error('[CollectionEditor] AI draft generation failed:', error);
      toast.error(getAIErrorMessage(error, 'AI draft generation failed.'), { id: toastId, duration: 5000 });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (saving || uploading) return;
    setSaving(true);
    const toastId = toast.loading('Saving collection...');
    try {
      const result = await saveCategoryAction({ 
        id: formData.id, 
        name: formData.name, 
        slug: formData.slug,
        description: formData.description, 
        isFeatured: formData.isFeatured, 
        showInHero: formData.showInHero ?? false, 
        parentId: formData.parentId || null, 
        imageUrl: formData.imageUrl || null, 
        iconUrl: formData.iconUrl || null, 
        translations: formData.translations 
      });
      
      if (result.success) {
        toast.success(initialCollection ? 'Collection updated' : 'Collection published', { id: toastId });
        router.push('/admin/collections');
        router.refresh();
      } else throw new Error(result.error);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error('Save failed: ' + err.message, { 
        id: toastId,
        duration: 8000
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading('Uploading banner...');
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('path', `categories/${Date.now()}_${file.name}`);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      });

      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      
      setFormData(prev => ({ ...prev, imageUrl: url }));
      toast.success('Banner uploaded', { id: toastId });
    } catch (error: unknown) {
      const err = error as Error;
      toast.error('Upload failed: ' + err.message, { id: toastId });
    } finally {
      setUploading(false);
    }
  };


  const languages = Array.from(new Set((settings.languages || ['sv', 'en']).filter(Boolean)));

  const descendantIds = React.useMemo(() => {
    const descendants = new Set<string>();
    if (!formData.id) {
      return descendants;
    }

    const stack = categories.filter((category) => category.parentId === formData.id).map((category) => category.id).filter(Boolean) as string[];
    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (descendants.has(currentId)) {
        continue;
      }
      descendants.add(currentId);
      categories
        .filter((category) => category.parentId === currentId)
        .forEach((category) => {
          if (category.id) {
            stack.push(category.id);
          }
        });
    }

    return descendants;
  }, [categories, formData.id]);

  const handleAITranslateCollection = async () => {
    if (!formData.name?.trim()) {
      toast.error('Collection name is required for translation.');
      return;
    }
    const targetLangs = languages.filter((lang) => lang !== 'sv');
    if (targetLangs.length === 0) {
      toast.info('No target languages configured beyond Swedish.');
      return;
    }
    setGenerating(true);
    const toastId = toast.loading('AI translating collection...');
    try {
      const prompt = `Translate the following collection information into these languages: ${targetLangs.join(', ')}.
Return ONLY a valid raw JSON object. No markdown backticks, no conversational text.
Schema: Each top-level key must be an ISO 639-1 language code, and each value an object with "name" and "description" fields.
Example: { "en": { "name": "...", "description": "..." }, "fi": { "name": "...", "description": "..." } }

Collection Name (Swedish): "${formData.name}"
Collection Description (Swedish): "${formData.description || ''}"`;

      const model = genAI.getGenerativeModel({
        promptProfile: 'collection',
        generationConfig: { responseMimeType: 'application/json' }
      });
      const aiResponse = await model.generateContent(prompt);
      const result = safeParseAiResponse<CollectionTranslationResult>(aiResponse.response.text(), {});

      const newTranslations = { ...formData.translations };
      for (const lang of targetLangs) {
        if (result[lang]) {
          newTranslations[lang] = {
            name: result[lang].name?.trim() || newTranslations[lang]?.name || '',
            description: result[lang].description?.trim() || newTranslations[lang]?.description || ''
          };
        }
      }
      setFormData(prev => ({ ...prev, translations: newTranslations }));
      toast.success('Collection translated to all languages', { id: toastId });
    } catch (error: unknown) {
      toast.error(getAIErrorMessage(error, 'AI translation failed.'), { id: toastId, duration: 5000 });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <AdminHeader
        title={initialCollection ? `Edit Collection: ${formData.name || 'Untitled'}` : 'New Collection'}
        description="Manage collection structure, translation content, merchandising flags, and banner assets."
        primaryAction={{
          label: saving ? 'Saving...' : 'Save Collection',
          icon: Save,
          onClick: () => void handleSave(),
          disabled: saving || uploading,
        }}
        secondaryActions={[
          {
            label: 'Back to Collections',
            icon: ArrowLeft,
            onClick: () => router.push('/admin/collections'),
          },
        ]}
        statsLabel="Collection editor"
      />

        <div className="bg-white border border-slate-200 rounded-[4px] p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900">AI Collection Assistant</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              placeholder="Describe the collection mood, curation, or source text here..."
              value={aiChatInput}
              onChange={(e) => setAiChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleAIChatAutoFill();
                }
              }}
              className="w-full sm:flex-1 h-11 bg-white border border-slate-200 rounded-[4px] px-4 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all"
            />
            <button 
              onClick={() => void handleAIChatAutoFill()}
              disabled={generating || !aiChatInput.trim()}
              className="h-11 px-5 bg-indigo-600 text-white rounded-[4px] text-[12px] font-medium hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
            >
              {generating ? 'Processing...' : 'Auto-Draft'}
              {!generating && <Wand2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 sm:gap-8">
          {/* Main Column */}
          <div className="space-y-6">
            
            {/* General Info Section */}
            <section className="bg-white border border-slate-200 rounded-[4px]">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <Layout className="w-4 h-4 text-slate-500" />
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Collection Details</h3>
              </div>
              <div className="p-5 sm:p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.16em]">Collection Name (Swedish)</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Sommarkollektion 2024"
                      className="w-full h-12 bg-white border border-slate-200 rounded-[4px] px-4 text-sm font-medium focus:outline-none focus:border-slate-900 transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.16em]">URL Slug</label>
                    <input 
                      type="text" 
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      placeholder="e.g. sommarkollektion-2024"
                      className="w-full h-12 bg-white border border-slate-200 rounded-[4px] px-4 text-sm font-medium focus:outline-none focus:border-slate-900 transition-all font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.16em]">Parent Collection (Hierarchy)</label>
                  <div className="relative">
                    <select 
                      value={formData.parentId}
                      onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                      disabled={loading || categories.length === 0}
                      className="w-full h-12 bg-white border border-slate-200 rounded-[4px] px-4 pr-10 text-sm font-medium appearance-none outline-none focus:border-slate-900 disabled:opacity-50"
                    >
                      <option value="">{categories.length === 0 ? 'Loading collections...' : 'No Parent (Main Navigation Root)'}</option>
                      {categories.filter(c => c.id !== formData.id && !descendantIds.has(c.id || '')).map(c => (
                        <option key={c.id} value={c.id}>
                          Parent: {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  </div>
                  <p className="text-[11px] text-slate-400">Move this collection under another one to create a sub-menu structure.</p>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.16em]">Swedish Marketing Narrative</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={8}
                    placeholder="Describe the essence of this collection in Swedish..."
                    className="w-full bg-white border border-slate-200 rounded-[4px] p-5 text-sm font-medium leading-relaxed focus:outline-none focus:border-slate-900 transition-all resize-none"
                  />
                </div>
              </div>
            </section>

            {/* Hierarchy & Localisation Section */}
            <section className="bg-white border border-slate-200 rounded-[4px]">
              <div className="flex flex-wrap border-b border-slate-200 bg-slate-50">
                {[
                  { id: 'hierarchy', label: 'Organization' },
                  { id: 'translations', label: 'Localisation' },
                  { id: 'engagement', label: 'Promotion' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as CollectionEditorTab)}
                    className={`px-4 sm:px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] border-r border-b border-slate-200 transition-all ${
                      activeTab === tab.id ? 'bg-white text-slate-900' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="p-5 sm:p-6">
                {activeTab === 'hierarchy' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.16em] mb-2 flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5" />
                        Active Sub-collections
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {categories.filter(c => c.parentId === formData.id).length > 0 ? (
                          categories.filter(c => c.parentId === formData.id).map(c => (
                            <button 
                              key={c.id}
                              onClick={() => router.push(`/admin/collections/${c.id}`)}
                              className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between hover:border-slate-900 transition-all text-left"
                            >
                              <span className="text-xs font-bold text-slate-700">{c.name}</span>
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            </button>
                          ))
                        ) : (
                          <div className="col-span-full py-6 text-center border-2 border-dashed border-slate-100 rounded">
                            <p className="text-[11px] font-medium text-slate-400">This collection has no sub-items</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'translations' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-wrap gap-2 rounded bg-slate-50 p-1 w-fit">
                       {languages.map(lang => (
                         <button 
                           key={lang}
                           onClick={() => setSelectedLang(lang)}
                           className={`min-w-[52px] rounded-[2px] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-all ${selectedLang === lang ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`}
                         >
                           {lang}
                         </button>
                       ))}
                      </div>
                      <button
                        onClick={handleAITranslateCollection}
                        disabled={generating || !formData.name?.trim()}
                        className="flex h-10 items-center justify-center gap-1.5 px-4 text-[12px] font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all disabled:opacity-50 w-full lg:w-auto"
                      >
                        {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                        AI Translate All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-3">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.16em]">Translated Title ({selectedLang})</label>
                        <input 
                          type="text" 
                          value={formData.translations?.[selectedLang]?.name || ''}
                          onChange={(e) => setFormData({
                            ...formData, 
                            translations: { 
                              ...formData.translations, 
                              [selectedLang]: { 
                                name: e.target.value,
                                description: formData.translations?.[selectedLang]?.description || ''
                              } 
                            }
                          })}
                          className="w-full h-11 border border-slate-200 rounded-[4px] px-4 text-sm focus:outline-none focus:border-slate-900 transition-all"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.16em]">Translated Description ({selectedLang})</label>
                        <textarea 
                          rows={4}
                          value={formData.translations?.[selectedLang]?.description || ''}
                          onChange={(e) => setFormData({
                            ...formData, 
                            translations: { 
                              ...formData.translations, 
                              [selectedLang]: { 
                                name: formData.translations?.[selectedLang]?.name || formData.name || '',
                                description: e.target.value 
                              } 
                            }
                          })}
                          className="w-full border border-slate-200 rounded-[4px] p-4 text-sm resize-none focus:outline-none focus:border-slate-900 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'engagement' && (
                  <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-300">
                    <button 
                      onClick={() => setFormData({...formData, isFeatured: !formData.isFeatured})}
                      className={`h-12 px-5 border rounded-[4px] flex items-center justify-between transition-all ${formData.isFeatured ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-900'}`}
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">Featured on Homepage</span>
                      <Star className={`w-4 h-4 ${formData.isFeatured ? 'fill-current' : ''}`} />
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, showInHero: !formData.showInHero})}
                      className={`h-12 px-5 border rounded-[4px] flex items-center justify-between transition-all ${formData.showInHero ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-900'}`}
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">Display in Hero Section</span>
                      <Layout className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            
            {/* Banner Section */}
            <section className="bg-white border border-slate-200 rounded-[4px] overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Collection Banner</h3>
                <button 
                  onClick={handleAIAutoCompleteCollection}
                  disabled={generating || !bannerPreviewUrl}
                  className="px-3 h-8 bg-indigo-50 text-indigo-700 rounded-md text-[11px] font-medium hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                >
                  Analyze Image
                </button>
              </div>
              <div className="p-6">
                  <label className="group relative mb-4 aspect-[4/3] min-h-[220px] cursor-pointer overflow-hidden rounded-[4px] border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-slate-900 flex items-center justify-center">
                    {isValidUrl(bannerPreviewUrl) && !bannerLoadFailed ? (
                      <Image 
                        src={bannerPreviewUrl} 
                        alt="Collection banner preview"
                        fill 
                        sizes="(max-width: 768px) 100vw, 360px" 
                        className="object-cover" 
                        onError={() => setBannerLoadFailed(true)}
                      />
                    ) : (
                      <div className="text-center p-6">
                         <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                         <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 text-center">
                           {bannerLoadFailed ? 'Banner image is private or broken' : 'Standard Aspect 16:9 for Best Results'}
                         </p>
                         {bannerLoadFailed && formData.imageUrl ? (
                           <p className="mt-2 text-[11px] text-slate-400 break-all">{formData.imageUrl}</p>
                         ) : null}
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all z-10 pointer-events-none">
                       <span className="text-[11px] font-bold uppercase tracking-widest text-white border-white border px-4 py-2">Change Image</span>
                    </div>
                  </label>
                 <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="text" 
                      placeholder="Paste banner URL or storage key..."
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      className="flex-1 h-10 border border-slate-200 rounded-[4px] px-3 text-[12px] focus:outline-none focus:border-slate-900 transition-all"
                    />
                    <button 
                      onClick={() => setIsMediaPickerOpen(true)}
                      className="h-10 px-4 bg-slate-50 border border-slate-200 rounded-md text-[12px] font-medium hover:border-slate-900 transition-all"
                    >
                      Library
                    </button>
                 </div>
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-[4px] overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900">Optimization</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900">Featured Collection</p>
                    <p className="text-[11px] text-slate-500">Show this collection in high-visibility merchandising zones.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded-sm border-slate-300 transition-all"
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900">Hero Placement</p>
                    <p className="text-[11px] text-slate-500">Allow this collection to appear inside storefront hero surfaces.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(formData.showInHero)}
                    onChange={(e) => setFormData({ ...formData, showInHero: e.target.checked })}
                    className="w-4 h-4 rounded-sm border-slate-300 transition-all"
                  />
                </div>
              </div>
            </section>


          </div>
        </div>

      <MediaPickerModal 
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(url) => { 
          setFormData({ ...formData, imageUrl: url }); 
          setIsMediaPickerOpen(false); 
        }}
      />
    </div>
  );
}
