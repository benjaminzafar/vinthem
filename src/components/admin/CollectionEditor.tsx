"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Category } from '@/types';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { 
  X, Sparkles, Image as ImageIcon, Layout, Settings, 
  Globe, Trash2, Wand2, Star, Check, Plus, Loader2,
  ChevronRight, ArrowLeft, Save, Languages, Search,
  Layers, ChevronDown, Pin
} from 'lucide-react';
import { toast } from 'sonner';
import { useSettingsStore } from '@/store/useSettingsStore';
import { genAI } from '@/lib/ai';
import { saveCategoryAction } from '@/app/actions/categories';
import { MediaPickerModal } from './MediaPickerModal';
import { IconSelector } from '../IconSelector';
import { IconRenderer } from '../IconRenderer';
import Image from 'next/image';

interface CollectionEditorProps {
  initialCollection?: Category | null;
}

export function CollectionEditor({ initialCollection }: CollectionEditorProps) {
  const router = useRouter();
  const { settings } = useSettingsStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<Category>({
    id: initialCollection?.id,
    name: initialCollection?.name || '',
    slug: initialCollection?.slug || '',
    description: initialCollection?.description || '',
    isFeatured: initialCollection?.isFeatured ?? false,
    showInHero: initialCollection?.showInHero ?? false,
    pinnedInSearch: initialCollection?.pinnedInSearch ?? false,
    parentId: initialCollection?.parentId || '',
    imageUrl: initialCollection?.imageUrl || '',
    iconUrl: initialCollection?.iconUrl || '',
    translations: initialCollection?.translations || {}
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'translations' | 'engagement'>('hierarchy');
  const [selectedLang, setSelectedLang] = useState('en');
  const [aiChatInput, setAiChatInput] = useState('');
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'image' | 'icon'>('image');

  // Fetch all categories for parent selector
  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('categories').select('*').order('name');
      if (data) {
        setCategories((data as any[]).map(c => ({
          id: c.id, name: c.name, parentId: c.parent_id
        })) as unknown as Category[]);
      }
    };
    fetchCategories();
  }, []);

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
      const response = await fetch(formData.imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      });
      reader.readAsDataURL(blob);
      const base64Data = await base64Promise;

      const model = genAI.getGenerativeModel({ 
        model: 'llama-3.3-70b-versatile',
        generationConfig: { responseMimeType: 'application/json' }
      });

      const aiResponse = await model.generateContent([
        { text: 'Analyze this collection banner image and generate a catchy, highly descriptive Swedish name and a persuasive, multi-paragraph Swedish marketing description for this product collection. Return ONLY JSON with "name", "slug" and "description" fields.' },
        { inlineData: { data: base64Data, mimeType: blob.type } }
      ]);

      const result = JSON.parse(aiResponse.response.text());
      setFormData(prev => ({
        ...prev,
        name: result.name || prev.name,
        slug: result.slug || prev.slug,
        description: result.description || prev.description
      }));
      toast.success('AI Analysis complete!', { id: toastId });
    } catch (error: any) {
      console.error('AI error:', error);
      const timestamp = new Date().toLocaleTimeString('sv-SE', { hour12: false });
      const errorMessage = error?.message || '';
      const status = error?.status;

      if (status === 401 || status === 403) {
        toast.error('Action Required: Please set your Groq API Key in the Integrations Manager.', { 
          id: toastId,
          duration: 6000
        });
        return;
      }

      let detailedMessage = '';
      if (status === 503 || errorMessage.toLowerCase().includes('overloaded') || errorMessage.toLowerCase().includes('congestion')) {
        detailedMessage = `## Error Type\nConsole Error\n\n## Error Message\n[${timestamp}] AI Service Congestion (503). Service is currently at maximum capacity. Please wait 5-10 minutes for regional demand to subside and try again.`;
      } else if (status === 429 || errorMessage.toLowerCase().includes('quota')) {
        detailedMessage = `## Error Type\nConsole Error\n\n## Error Message\n[${timestamp}] RATE LIMIT HIT (429) for llama-3.3-70b-versatile. You are sending requests too fast (RPM limit). Please wait 60 seconds and try again.`;
      } else {
        detailedMessage = `## Error Type\nConsole Error\n\n## Error Message\n[${timestamp}] AI Analysis failed. ${errorMessage}`;
      }

      toast.error(detailedMessage, { id: toastId, duration: 8000 });
    } finally {
      setGenerating(false);
    }
  };

  const handleAIChatAutoFill = async (e: React.FormEvent) => {
    e.preventDefault();
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
        model: 'llama-3.3-70b-versatile',
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const aiResponse = await model.generateContent(prompt);
      const result = JSON.parse(aiResponse.response.text());
      
      setFormData(prev => ({
        ...prev,
        name: result.name || prev.name,
        slug: result.slug || prev.slug,
        description: result.description || prev.description
      }));

      setAiChatInput('');
      toast.success('Collection draft generated!', { id: toastId });
    } catch (error: any) {
      console.error('AI Draft Error:', error);
      const timestamp = new Date().toLocaleTimeString('sv-SE', { hour12: false });
      const errorMessage = error?.message || '';
      const status = error?.status;

      if (status === 401 || status === 403) {
        toast.error('Action Required: Please set your Groq API Key in the Integrations Manager.', { 
          id: toastId,
          duration: 6000
        });
        return;
      }

      let detailedMessage = '';
      if (status === 503 || errorMessage.toLowerCase().includes('overloaded') || errorMessage.toLowerCase().includes('congestion')) {
        detailedMessage = `## Error Type\nConsole Error\n\n## Error Message\n[${timestamp}] AI Service Congestion (503). Service is currently at maximum capacity. Please wait 5-10 minutes for regional demand to subside and try again.`;
      } else if (status === 429 || errorMessage.toLowerCase().includes('quota')) {
        detailedMessage = `## Error Type\nConsole Error\n\n## Error Message\n[${timestamp}] RATE LIMIT HIT (429) for llama-3.3-70b-versatile. You are sending requests too fast (RPM limit). Please wait 60 seconds and try again.`;
      } else {
        detailedMessage = `## Error Type\nConsole Error\n\n## Error Message\n[${timestamp}] AI Draft failed. ${errorMessage}`;
      }

      toast.error(detailedMessage, { id: toastId, duration: 8000 });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
        pinnedInSearch: formData.pinnedInSearch ?? false,
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
    } catch (error: any) {
      toast.error('Save failed: ' + error.message, { 
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
      const { uploadImageWithTimeout } = await import('@/lib/upload');
      const url = await uploadImageWithTimeout(file, `categories/${Date.now()}_${file.name}`);
      setFormData(prev => ({ ...prev, imageUrl: url }));
      toast.success('Banner uploaded', { id: toastId });
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading('Uploading icon...');
    try {
      const { uploadImageWithTimeout } = await import('@/lib/upload');
      const url = await uploadImageWithTimeout(file, `categories/${Date.now()}_${file.name}`);
      setFormData(prev => ({ ...prev, iconUrl: url }));
      toast.success('Icon uploaded', { id: toastId });
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const languages = settings.languages || ['sv', 'en'];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin/collections')} className="p-2.5 bg-white border border-slate-200 hover:border-slate-900 rounded-[4px] transition-all">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1.5">
                {initialCollection ? `Edit: ${formData.name || 'Collection'}` : 'New Collection'}
              </h1>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                 <Layers className="w-3 h-3" />
                 Category Configuration
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSave}
              disabled={saving || uploading}
              className="px-8 h-11 bg-slate-900 text-white rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all group flex items-center gap-2"
            >
              <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
              {saving ? 'Processing...' : 'Publish Collection'}
            </button>
          </div>
        </div>

        {/* AI Smart Draft Card */}
        <div className="bg-indigo-50/30 border border-indigo-100 rounded-[4px] p-6 mb-10 flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-indigo-100">
               <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Collection Assistant</span>
               <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">Generative Metadata</span>
            </div>
          </div>
          <div className="flex-1 w-full flex gap-2">
            <input 
              type="text" 
              placeholder="Describe the collection vibe (e.g. minimalist autumn clothing collection)..."
              value={aiChatInput}
              onChange={(e) => setAiChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAIChatAutoFill(e)}
              className="flex-1 h-12 bg-white border border-indigo-100 rounded-[4px] px-5 text-sm font-medium focus:outline-none focus:border-indigo-400 transition-all placeholder:text-indigo-200"
            />
            <button 
              onClick={handleAIChatAutoFill}
              disabled={generating || !aiChatInput.trim()}
              className="bg-indigo-600 text-white px-8 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {generating ? 'Drafting...' : 'AI Draft'}
              {!generating && <Wand2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* Main Column */}
          <div className="space-y-8">
            
            {/* General Info Section */}
            <section className="bg-white border border-slate-200 rounded-[4px]">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <Layout className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Collection Details</h3>
              </div>
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Collection Name (Swedish)</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Sommarkollektion 2024"
                      className="w-full h-12 bg-white border border-slate-200 rounded-[4px] px-4 text-sm font-medium focus:outline-none focus:border-slate-900 transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">URL Slug</label>
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
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Swedish Marketing Narrative</label>
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
              <div className="flex border-b border-slate-200 bg-slate-50">
                {[
                  { id: 'hierarchy', label: 'Organization' },
                  { id: 'translations', label: 'Localisation' },
                  { id: 'engagement', label: 'Promotion' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest border-r border-slate-200 transition-all ${
                      activeTab === tab.id ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="p-8">
                {activeTab === 'hierarchy' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Parent Collection (Hierarchy)</label>
                      <div className="relative">
                        <select 
                          value={formData.parentId}
                          onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                          className="w-full h-12 bg-white border border-slate-200 rounded-[4px] px-4 text-sm font-bold appearance-none outline-none focus:border-slate-900"
                        >
                          <option value="">No Parent (Main Navigation Root)</option>
                          {categories.filter(c => c.id !== formData.id).map(c => <option key={c.id} value={c.id}>Sub-collection of {c.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'translations' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="flex gap-4 border-b border-slate-100 pb-2">
                       {languages.map(lang => (
                         <button 
                           key={lang}
                           onClick={() => setSelectedLang(lang)}
                           className={`text-[10px] font-black uppercase tracking-widest transition-all ${selectedLang === lang ? 'text-slate-900 underline underline-offset-4' : 'text-slate-400 hover:text-slate-600'}`}
                         >
                           {lang}
                         </button>
                       ))}
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Local Title ({selectedLang})</label>
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
                          className="w-full h-11 border border-slate-200 rounded-[4px] px-4 text-sm"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Local Description ({selectedLang})</label>
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
                          className="w-full border border-slate-200 rounded-[4px] p-4 text-sm resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'engagement' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                    <button 
                      onClick={() => setFormData({...formData, isFeatured: !formData.isFeatured})}
                      className={`h-14 px-6 border rounded-[4px] flex items-center justify-between transition-all ${formData.isFeatured ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-900'}`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">Featured on Homepage</span>
                      <Star className={`w-4 h-4 ${formData.isFeatured ? 'fill-current' : ''}`} />
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, showInHero: !formData.showInHero})}
                      className={`h-14 px-6 border rounded-[4px] flex items-center justify-between transition-all ${formData.showInHero ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-900'}`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">Display in Hero Section</span>
                      <Layout className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, pinnedInSearch: !formData.pinnedInSearch})}
                      className={`h-14 px-6 border rounded-[4px] flex items-center justify-between transition-all ${formData.pinnedInSearch ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-900'}`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">Pin to Search Popup</span>
                      <Pin className={`w-4 h-4 ${formData.pinnedInSearch ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            
            {/* Banner Section */}
            <section className="bg-white border border-slate-200 rounded-[4px] overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Collection Banner</h3>
                <button 
                  onClick={handleAIAutoCompleteCollection}
                  disabled={generating || !formData.imageUrl}
                  className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                >
                  Analyze Image
                </button>
              </div>
              <div className="p-6">
                 <div className="relative aspect-[16/9] bg-slate-50 border-2 border-dashed border-slate-200 rounded-[4px] flex items-center justify-center overflow-hidden hover:border-slate-900 transition-all cursor-pointer group mb-4">
                    {formData.imageUrl ? (
                      <Image src={formData.imageUrl} alt="" fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
                    ) : (
                      <div className="text-center p-6">
                         <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                         <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Standard Aspect 16:9 for Best Results</p>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                       <span className="text-[10px] font-black uppercase tracking-widest text-white border-white border px-4 py-2">Change Image</span>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Or paste banner URL..."
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      className="flex-1 h-10 border border-slate-200 rounded-[4px] px-3 text-xs"
                    />
                    <button 
                      onClick={() => { setPickerTarget('image'); setIsMediaPickerOpen(true); }}
                      className="h-10 px-4 bg-slate-50 border border-slate-200 rounded text-[10px] font-black uppercase tracking-widest"
                    >
                      Lib
                    </button>
                 </div>
              </div>
            </section>

            {/* Icon Section */}
            <section className="bg-white border border-slate-200 rounded-[4px] overflow-hidden text-slate-900">
               <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Icon Identity</h3>
               </div>
               <div className="p-6">
                  <div className="flex items-center gap-6 p-4 bg-slate-50 border border-slate-200 rounded-[4px]">
                    <div className="w-16 h-16 bg-white border border-slate-200 rounded-[4px] flex items-center justify-center shrink-0 overflow-hidden relative group">
                      {formData.iconUrl ? (
                         formData.iconUrl.startsWith('icon:') ? (
                           <IconRenderer iconName={formData.iconUrl} className="w-8 h-8 text-slate-900" />
                         ) : (
                           <Image src={formData.iconUrl} alt="Icon" fill sizes="64px" className="object-cover" />
                         )
                      ) : <Star className="w-6 h-6 text-slate-200" />}
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <button 
                        type="button" 
                        onClick={() => setIsIconSelectorOpen(true)}
                        className="h-9 px-4 border border-slate-300 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:border-slate-900 transition-all"
                      >
                        Vectors
                      </button>
                      <label className="h-9 px-4 bg-white border border-slate-200 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center cursor-pointer">
                        Custom
                        <input type="file" className="hidden" onChange={handleIconUpload} accept="image/*" />
                      </label>
                    </div>
                  </div>
               </div>
            </section>
          </div>
        </div>
      </div>

      <MediaPickerModal 
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(url) => { setFormData({ ...formData, imageUrl: url }); setIsMediaPickerOpen(false); }}
      />
      {isIconSelectorOpen && (
        <IconSelector
          onSelect={(iconName) => setFormData({ ...formData, iconUrl: `icon:${iconName}` })}
          onClose={() => setIsIconSelectorOpen(false)}
        />
      )}
    </div>
  );
}
