"use client";
import React, { useState, useEffect } from 'react';
import { X, Sparkles, Image as ImageIcon, Images, Search, ChevronRight, Layout, Settings, Globe, Trash2, Wand2, Star, Check, AlertCircle, DollarSign, Package, Palette, Languages, ChevronUp, ChevronDown, Plus, Loader2 } from 'lucide-react';
import { Category } from '@/types';
import { toast } from 'sonner';
import { CategoryDeleteModal } from './CategoryDeleteModal';
import { IconSelector } from './IconSelector';
import { IconRenderer } from './IconRenderer';
import { Product } from '@/store/useCartStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { genAI } from '@/lib/ai';
import { saveCategoryAction } from '@/app/actions/categories';
import { MediaPickerModal } from './admin/MediaPickerModal';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
  categories: Category[];
  products: Product[];
  onUpload: (file: File) => Promise<string | null>;
  onSaved?: () => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, category, categories, products, onUpload, onSaved }) => {
  const { settings } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<'general' | 'translations'>('general');
  const [selectedLang, setSelectedLang] = useState('en');
  
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [isFeatured, setIsFeatured] = useState(category?.isFeatured ?? false);
  const [showInHero, setShowInHero] = useState(category?.showInHero ?? false);
  const [parentId, setParentId] = useState(category?.parentId || '');
  const [imageUrl, setImageUrl] = useState(category?.imageUrl || '');
  const [iconUrl, setIconUrl] = useState(category?.iconUrl || '');
  const [translations, setTranslations] = useState(category?.translations || {});
  const [activeSubTab, setActiveSubTab] = useState<'hierarchy' | 'translations' | 'engagement'>('hierarchy');
  
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'image' | 'icon'>('image');
  const [aiChatInput, setAiChatInput] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(category?.name || '');
      setDescription(category?.description || '');
      setIsFeatured(category?.isFeatured ?? false);
      setShowInHero(category?.showInHero ?? false);
      setParentId(category?.parentId || '');
      setImageUrl(category?.imageUrl || '');
      setIconUrl(category?.iconUrl || '');
      setTranslations(category?.translations || {});
      setActiveTab('general');
    }
  }, [category, isOpen]);

  const handleAIAutoCompleteCategory = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!imageUrl) {
      toast.error('Please upload a banner image first.');
      return;
    }
    setGenerating(true);
    const toastId = toast.loading('AI is analyzing...');
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      });
      reader.readAsDataURL(blob);
      const base64Data = await base64Promise;

      const model = genAI.getGenerativeModel({ 
        model: 'llama-3.3-70b-versatile',
        generationConfig: {
          responseMimeType: 'application/json',
        }
      });

      const aiResponse = await model.generateContent([
        { text: 'Analyze this collection banner image and generate a catchy, descriptive title and a persuasive description for this product collection. Return ONLY JSON with "name" and "description" fields.' },
        { inlineData: { data: base64Data, mimeType: blob.type } }
      ]);

      const result = JSON.parse(aiResponse.response.text());
      setName(result.name || name);
      setDescription(result.description || description);
      toast.success('Generated successfully', { id: toastId });
    } catch (error: any) {
      console.error('AI Analysis error:', error);
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

      toast.error(`## Error Type\nConsole Error\n\n## Error Message\n[${timestamp}] AI Analysis failed. ${errorMessage}`, { 
        id: toastId, 
        duration: 8000 
      });
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
      const prompt = `Convert this collection description into structured data: "${aiChatInput}"
      Return ONLY a JSON object with this structure:
      {
        "name": "Collection Name",
        "description": "Engaging collection description",
        "slug": "collection-name"
      }`;

      const model = genAI.getGenerativeModel({ 
        model: 'llama-3.3-70b-versatile',
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const aiResponse = await model.generateContent(prompt);
      const result = JSON.parse(aiResponse.response.text());
      
      setName(result.name || name);
      setDescription(result.description || description);

      setAiChatInput('');
      toast.success('Collection draft generated!', { id: toastId });
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

      toast.error(`## Error Type\nConsole Error\n\n## Error Message\n[${timestamp}] AI Analysis failed. ${errorMessage}`, { 
        id: toastId, 
        duration: 8000 
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleAITranslate = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!name || !description) {
      toast.error('Details required');
      return;
    }
    setGenerating(true);
    const toastId = toast.loading('Translating...');
    try {
      const genModel = genAI.getGenerativeModel({ 
        model: 'llama-3.3-70b-versatile',
        generationConfig: {
          responseMimeType: 'application/json',
        }
      });

      const aiResponse = await genModel.generateContent(prompt);
      const translatedData = JSON.parse(aiResponse.response.text());
      setTranslations(prev => ({ ...prev, ...translatedData }));
      toast.success('Translations synced', { id: toastId });
    } catch (error: any) {
      toast.error('Translation failed', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading('Uploading banner...');
    try {
      const url = await onUpload(file);
      if (url) {
        setImageUrl(url);
        toast.success('Banner uploaded', { id: toastId });
      }
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message, { id: toastId });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading('Uploading icon...');
    try {
      const url = await onUpload(file);
      if (url) {
        setIconUrl(url);
        toast.success('Icon uploaded', { id: toastId });
      }
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message, { id: toastId });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || uploading) return;
    setSaving(true);
    try {
      const result = await saveCategoryAction({ 
        id: category?.id, name, description, isFeatured, showInHero, 
        parentId: parentId || null, imageUrl: imageUrl || null, 
        iconUrl: iconUrl || null, translations 
      });
      if (result.success) {
        toast.success('Saved');
        onSaved?.();
        onClose();
      } else throw new Error(result.error);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[4px] shadow-sm border border-zinc-200 w-full max-w-[900px] max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header - Sharp & Deep */}
        <div className="px-8 py-5 border-b border-zinc-200 flex justify-between items-center bg-white">
          <h3 className="text-[15px] font-black text-zinc-900 uppercase tracking-[0.25em]">
            {category ? 'Edit Collection' : 'New Collection'}
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 transition-colors bg-zinc-50 p-1.5 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form id="category-form" onSubmit={handleSave} className="p-8 space-y-8">
            
            {/* AI Smart Draft - Top Level */}
            <div className="p-5 bg-indigo-50/30 rounded-[6px] border border-indigo-100/50 flex flex-col sm:flex-row items-center gap-5">
              <div className="flex items-center gap-3 min-w-fit px-2">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span className="text-[11px] font-black text-indigo-900/70 uppercase tracking-[0.2em]">Collection Assistant</span>
              </div>
              <div className="flex-1 flex gap-3 w-full">
                <input 
                  type="text"
                  value={aiChatInput}
                  onChange={(e) => setAiChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAIChatAutoFill(e)}
                  placeholder="Describe collection (e.g. minimalist ceramics for modern homes)..."
                  className="flex-1 bg-white border border-zinc-200 rounded-[4px] px-5 h-11 text-sm focus:outline-none focus:border-indigo-500 transition-all font-medium placeholder:text-zinc-400 group-hover:border-zinc-300"
                />
                <button 
                  type="button"
                  onClick={handleAIChatAutoFill}
                  disabled={generating || !aiChatInput.trim()}
                  className="bg-black text-white px-8 h-11 rounded-[4px] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {generating ? 'Drafting...' : 'Generate'}
                  {!generating && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
              
              {/* Left Column: Narrative & Settings */}
              <div className="space-y-8">
                
                {/* Title */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-zinc-900/80 uppercase tracking-[0.25em]">Title</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Modern Ceramics"
                    className="w-full h-12 bg-white border border-zinc-200 rounded-[4px] px-5 text-sm focus:outline-none focus:border-zinc-900 transition-all placeholder:text-zinc-400 hover:border-zinc-300"
                  />
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-zinc-900/80 uppercase tracking-[0.25em]">Description</label>
                  <textarea
                    style={{ minHeight: '160px' }}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the essence of this collection..."
                    className="w-full p-5 bg-white border border-zinc-200 rounded-[4px] text-sm leading-relaxed focus:outline-none focus:border-zinc-900 transition-all resize-none placeholder:text-zinc-400 hover:border-zinc-300"
                  />
                </div>

                {/* Vertical Tabs & Data Section */}
                <div className="space-y-6">
                  {/* Tabs Row */}
                  <div className="flex border-b border-zinc-200 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                    {[
                      { id: 'hierarchy', label: 'Hierarchy' },
                      { id: 'translations', label: 'Translation' },
                      { id: 'engagement', label: 'Exposure' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveSubTab(tab.id as any)}
                        className={`px-6 pb-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border-b-2 ${
                          activeSubTab === tab.id
                            ? 'text-zinc-900 border-zinc-900'
                            : 'text-zinc-500 border-transparent hover:text-zinc-800'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content Area */}
                  <div className="min-h-[160px]">
                    {activeSubTab === 'hierarchy' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <label className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.2em]">Parent Collection</label>
                        <div className="relative">
                          <select 
                            value={parentId} 
                            onChange={e => setParentId(e.target.value)} 
                            className="w-full bg-white border border-zinc-300 rounded-[4px] px-4 h-11 text-sm font-bold text-zinc-900 appearance-none cursor-pointer outline-none focus:border-zinc-900 transition-all"
                          >
                            <option value="">Main Collection (Top Level)</option>
                            {categories.filter(c => c.id !== category?.id).map(c => <option key={c.id} value={c.id}>Sub-collection of {c.name}</option>)}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        </div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Choosing a parent will nest this collection within its navigation path.</p>
                      </div>
                    )}

                    {activeSubTab === 'translations' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                          <div className="flex gap-4">
                            <button type="button" onClick={() => setSelectedLang('en')} className={`text-[11px] font-black tracking-widest transition-colors ${selectedLang === 'en' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'}`}>EN</button>
                            {settings?.languages?.map((lang: string) => (
                              <button key={lang} type="button" onClick={() => setSelectedLang(lang)} className={`text-[11px] font-black tracking-widest transition-colors ${selectedLang === lang ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'}`}>{lang.toUpperCase()}</button>
                            ))}
                          </div>
                          <button 
                            type="button"
                            onClick={handleAITranslate}
                            disabled={generating}
                            className="text-[11px] font-black uppercase tracking-widest text-indigo-700 hover:text-indigo-900 transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Auto-Translate All
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-zinc-700 uppercase tracking-widest">Local Title ({selectedLang})</label>
                            <input
                              type="text"
                              value={translations[selectedLang]?.name || ''}
                              onChange={(e) => setTranslations({...translations,[selectedLang]: { ...translations[selectedLang], name: e.target.value }})}
                              className="w-full px-4 h-11 border border-zinc-300 rounded-[4px] focus:outline-none focus:border-zinc-900 text-sm font-medium placeholder:text-zinc-400"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-zinc-700 uppercase tracking-widest">Local Narrative ({selectedLang})</label>
                            <textarea
                              rows={3}
                              value={translations[selectedLang]?.description || ''}
                              onChange={(e) => setTranslations({...translations,[selectedLang]: { ...translations[selectedLang], description: e.target.value }})}
                              className="w-full p-4 border border-zinc-300 rounded-[4px] focus:outline-none focus:border-zinc-900 text-sm resize-none font-medium placeholder:text-zinc-400 leading-relaxed"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSubTab === 'engagement' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-4">
                          <label className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.2em]">Promotion</label>
                          <div className="flex flex-col gap-4">
                            <button 
                              type="button" 
                              onClick={() => setIsFeatured(!isFeatured)} 
                              className={`flex items-center justify-between px-6 h-12 rounded-[4px] border text-[11px] font-black uppercase tracking-widest transition-all ${isFeatured ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-300 text-zinc-600 hover:border-zinc-900'}`}
                            >
                              Featured Collection
                              {isFeatured ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setShowInHero(!showInHero)} 
                              className={`flex items-center justify-between px-6 h-12 rounded-[4px] border text-[11px] font-black uppercase tracking-widest transition-all ${showInHero ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-300 text-zinc-600 hover:border-zinc-900'}`}
                            >
                              Show in Hero Section
                              {showInHero ? <Check className="w-4 h-4" /> : <Layout className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Visuals */}
              <div className="space-y-8">
                
                {/* Banner Media */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black text-zinc-900/80 uppercase tracking-[0.25em]">Banner Image</label>
                    <button 
                      type="button"
                      onClick={handleAIAutoCompleteCategory}
                      disabled={generating || !imageUrl}
                      className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50 flex items-center gap-2 border border-indigo-100"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Analyze
                    </button>
                  </div>
                  
                  <div className="relative group w-full aspect-square bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-[4px] flex flex-col items-center justify-center transition-all hover:bg-white hover:border-zinc-900 overflow-hidden">
                    {imageUrl ? (
                      <>
                        <img src={imageUrl} alt="Banner" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px] gap-3">
                          <button 
                            type="button" 
                            onClick={() => { setPickerTarget('image'); setIsMediaPickerOpen(true); }}
                            className="px-6 py-2 bg-white text-zinc-900 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-all"
                          >
                            Browse Library
                          </button>
                          <label className="px-6 py-2 bg-zinc-900/50 text-white border border-white/30 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-zinc-900 transition-all cursor-pointer">
                            Upload New
                            <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                          </label>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-center px-6">
                        <ImageIcon className="w-10 h-10 text-zinc-400 mb-4" />
                        <span className="text-[13px] font-black text-zinc-900 uppercase tracking-widest block mb-1">Set Banner</span>
                        <div className="flex gap-3 mt-4">
                          <button 
                            type="button" 
                            onClick={() => { setPickerTarget('image'); setIsMediaPickerOpen(true); }}
                            className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
                          >
                            Library
                          </button>
                          <label className="px-4 py-2 bg-zinc-900 text-white rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all cursor-pointer">
                            Upload
                            <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                          </label>
                        </div>
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Banner URL..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="flex-1 h-11 bg-white border border-zinc-200 rounded-[4px] px-4 text-xs focus:outline-none focus:border-zinc-900 placeholder:text-zinc-400"
                    />
                    <button 
                      type="button"
                      onClick={() => { setPickerTarget('image'); setIsMediaPickerOpen(true); }}
                      className="h-11 px-4 bg-zinc-100 border border-zinc-200 rounded-[4px] text-[11px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all text-zinc-700"
                    >
                      Library
                    </button>
                  </div>
                </div>

                {/* Identity Icon */}
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.2em]">Icon Identity</label>
                  <div className="flex items-center gap-6 p-4 bg-zinc-50 border border-zinc-200 rounded-[4px]">
                    <div className="w-16 h-16 bg-white border border-zinc-200 rounded-[4px] flex items-center justify-center shrink-0 overflow-hidden relative group">
                      {iconUrl ? (
                         iconUrl.startsWith('icon:') ? (
                           <IconRenderer iconName={iconUrl} className="w-8 h-8 text-zinc-900" />
                         ) : (
                           <img src={iconUrl} alt="Icon" className="w-full h-full object-cover" />
                         )
                      ) : <Star className="w-6 h-6 text-zinc-200" />}
                      {iconUrl && (
                        <button 
                          type="button"
                          onClick={() => setIconUrl('')}
                          className="absolute -top-1 -right-1 bg-white border border-zinc-200 text-zinc-400 hover:text-rose-500 rounded p-1 opacity-0 group-hover:opacity-100 transition-all font-bold"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <button 
                        type="button" 
                        onClick={() => setIsIconSelectorOpen(true)}
                        className="h-9 px-4 border border-zinc-300 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:border-zinc-900 transition-all"
                      >
                        Browse Vector
                      </button>
                      <label className="h-9 px-4 bg-white border border-zinc-200 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all flex items-center justify-center cursor-pointer">
                        Direct Upload
                        <input type="file" className="hidden" onChange={handleIconUpload} accept="image/*" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer - Perfectly Balanced Actions */}
        <div className="px-10 py-5 border-t border-zinc-200 bg-zinc-50/30 flex justify-between items-center">
          <div className="flex gap-6">
            {category && (
              <button 
                type="button" 
                onClick={() => setIsDeleteModalOpen(true)} 
                className="px-4 py-2 text-[11px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 transition-all bg-rose-50 rounded-full border border-rose-100"
              >
                Archive
              </button>
            )}
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-2.5 text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] hover:text-zinc-900 hover:bg-white rounded-full transition-all border border-transparent hover:border-zinc-200"
            >
              Dismiss
            </button>
          </div>
          <button
            type="submit"
            form="category-form"
            disabled={saving || uploading}
            className="bg-black text-white px-12 h-11 rounded-[4px] text-[11px] font-black uppercase tracking-[0.25em] hover:bg-zinc-800 transition-all disabled:opacity-50"
          >
            {saving ? 'Processing...' : (category ? 'Save Changes' : 'Publish Collection')}
          </button>
        </div>
      </div>

      {/* Auxiliary Modals */}
      {category && (
        <CategoryDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          category={category}
          categories={categories}
          products={products}
          onDeleted={() => { onSaved?.(); onClose(); }}
        />
      )}
      {isIconSelectorOpen && (
        <IconSelector
          onSelect={(iconName) => setIconUrl(`icon:${iconName}`)}
          onClose={() => setIsIconSelectorOpen(false)}
        />
      )}
      <MediaPickerModal 
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(url) => {
          if (pickerTarget === 'image') setImageUrl(url);
          else setIconUrl(url);
        }}
        title={`Select Collection ${pickerTarget === 'image' ? 'Banner' : 'Icon'}`}
      />
    </div>
  );
};
