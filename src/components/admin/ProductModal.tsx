"use client";
import React, { useState, useEffect } from 'react';
import { Product } from '@/store/useCartStore';
import { Category } from '../../types';
import { X, DollarSign, Package, Palette, Languages, ChevronUp, ChevronDown, Sparkles, ImageIcon, Plus, Globe, ChevronRight } from 'lucide-react';
import { SearchableSelect } from '../SearchableSelect';
import { VariantEditor } from '../VariantEditor';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { genAI } from '@/lib/gemini';
import { MediaPickerModal } from './MediaPickerModal';
import { Images } from 'lucide-react';

import { StorefrontSettingsType, LocalizedString } from '@/types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  categories: Category[];
  settings: StorefrontSettingsType;
  onSuccess?: () => void;
}

export function ProductModal({ isOpen, onClose, product, categories, settings, onSuccess }: ProductModalProps) {
  const supabase = createClient();
  const [formData, setFormData] = useState<Partial<Product>>({
    title: '',
    description: '',
    price: 0,
    stock: 0,
    sku: '',
    imageUrl: '',
    categoryId: '',
    sizes: [],
    colors: [],
    tags: [],
    translations: {},
    variants: []
  });

  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const [activeTab, setActiveTab] = useState<'general' | 'inventory' | 'variants' | 'translations'>('general');
  const [aiChatInput, setAiChatInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData(product);
      } else {
        setFormData({
          title: '',
          description: '',
          price: 0,
          stock: 0,
          sku: '',
          imageUrl: '',
          categoryId: '',
          sizes: [],
          colors: [],
          tags: [],
          translations: {},
          variants: [],
          weight: 0,
          shippingClass: ''
        });
      }
      setActiveTab('general');
    }
  }, [isOpen, product]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading('Uploading image...');

    try {
      const { uploadImageWithTimeout } = await import('../../lib/upload');
      const url = await uploadImageWithTimeout(file, `products/${Date.now()}_${file.name}`);
      setFormData({ ...formData, imageUrl: url });
      toast.success('Image uploaded successfully', { id: toastId });
    } catch (error: unknown) {
      console.error("Upload error:", error);
      const msg = error instanceof Error ? error.message : 'Failed to upload image';
      toast.error(msg, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    const toastId = toast.loading(`Uploading ${files.length} images...`);

    try {
      const { uploadImageWithTimeout } = await import('../../lib/upload');
      const urls = await Promise.all(files.map(async (file) => {
        return await uploadImageWithTimeout(file, `products/gallery/${Date.now()}_${file.name}`);
      }));
      
      setFormData(prev => ({ 
        ...prev, 
        additionalImages: [...(prev.additionalImages || []), ...urls] 
      }));
      toast.success('Gallery images uploaded successfully', { id: toastId });
    } catch (error: unknown) {
      console.error("Gallery upload error:", error);
      const msg = error instanceof Error ? error.message : 'Failed to upload gallery images';
      toast.error(msg, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      additionalImages: prev.additionalImages?.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleAIAutoCompleteProduct = async () => {
    if (!formData.imageUrl) {
      toast.error('Please upload an image first.');
      return;
    }
    
    setGenerating(true);
    const toastId = toast.loading('Analyzing image and generating product details...');
    
    try {
      const prompt = `Analyze this product image and generate details for an e-commerce store.
      Return ONLY a JSON object with the following structure:
      {
        "title": "A catchy, descriptive title",
        "description": "A detailed, persuasive product description",
        "price": 199.99,
        "category": "Suggested category name",
        "colors": ["Color1", "Color2"],
        "sizes": ["S", "M", "L"]
      }`;

      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        }
      });
      
      const aiResponse = await model.generateContent([
        { text: prompt },
        { image_url: formData.imageUrl }
      ]);

      const result = JSON.parse(aiResponse.response.text());
      
      setFormData(prev => ({
        ...prev,
        title: result.title || prev.title,
        description: result.description || prev.description,
        price: result.price || prev.price,
        colors: result.colors || prev.colors,
        sizes: result.sizes || prev.sizes,
      }));
      
      toast.success('Product details generated!', { id: toastId });
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate details.', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleAITranslateProduct = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Please provide a title and description first.');
      return;
    }
    
    setGenerating(true);
    const toastId = toast.loading('Translating product details...');
    
    try {
      const genModel = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        }
      });

      const aiResponse = await genModel.generateContent(prompt);
      const translations = JSON.parse(aiResponse.response.text());
      
      setFormData(prev => ({
        ...prev,
        translations: {
          ...prev.translations,
          ...translations
        }
      }));
      
      const translatedLangs = Object.keys(translations).join(', ');
      toast.success(`Translations generated for: ${translatedLangs}!`, { id: toastId });
    } catch (error) {
      console.error('AI translation error:', error);
      toast.error('Failed to translate details.', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleAIChatAutoFill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatInput.trim()) return;

    setGenerating(true);
    const toastId = toast.loading('AI is drafting your product...');

    try {
      const prompt = `Convert this product description into structured data: "${aiChatInput}"
      Return ONLY a JSON object with this structure:
      {
        "title": "Short catchy title",
        "description": "Professional description",
        "price": 0.00,
        "stock": 0,
        "sku": "SKU-CODE",
        "tags": ["tag1", "tag2"],
        "colors": ["color1", "color2"],
        "sizes": ["size1", "size2"]
      }`;

      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const aiResponse = await model.generateContent(prompt);
      const result = JSON.parse(aiResponse.response.text());
      
      setFormData(prev => ({
        ...prev,
        title: result.title || prev.title,
        description: result.description || prev.description,
        price: result.price || prev.price,
        stock: result.stock || prev.stock,
        sku: result.sku || prev.sku,
        tags: result.tags || prev.tags,
        colors: result.colors || prev.colors,
        sizes: result.sizes || prev.sizes,
      }));

      setAiChatInput('');
      toast.success('Draft generated!', { id: toastId });
    } catch (error) {
      console.error('AI Chat error:', error);
      toast.error('Failed to generate draft.', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading(product ? 'Updating product...' : 'Adding product...');
    
    try {
      const productData = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        stock: Number(formData.stock),
        sku: formData.sku,
        image_url: formData.imageUrl,
        category_id: formData.categoryId || null,
        variants: formData.variants,
        translations: formData.translations,
        sizes: formData.sizes || [],
        colors: formData.colors || [],
        tags: formData.tags,
        is_featured: formData.isFeatured || false,
        is_new: formData.isNewArrival || false,
        is_sale: formData.isSale || false,
        sale_price: formData.discountPrice ? Number(formData.discountPrice) : 0,
        additional_images: formData.additionalImages || [],
        // Weight and shipping class can be added here if you run the repair script
        // weight: formData.weight || 0,
        // shipping_class: formData.shippingClass || ''
      };

      // Filter out null/undefined to avoid DB errors on missing columns if repair hasn't run yet
      const payload = Object.fromEntries(
        Object.entries(productData).filter(([_, v]) => v !== undefined)
      );

      if (product) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', product.id);
        if (error) throw error;
        toast.success('Product updated successfully', { id: toastId });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([payload]);
        if (error) throw error;
        toast.success('Product added successfully', { id: toastId });
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error("DEBUG: Error saving product:", error);
      let errorMsg = 'Failed to save product';
      
      if (error && typeof error === 'object') {
        // Better error extraction for Supabase/Turbopack
        const details = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
        console.error("DEBUG: Detailed error full report:", details);
        
        errorMsg = error.message || error.details || error.hint || 'Database Operation Failed';
        
        if (error.code) {
          errorMsg = `DB Error [${error.code}]: ${error.message}${error.details ? ` (${error.details})` : ''}`;
        }
      } else if (typeof error === 'string') {
        errorMsg = error;
      }
      
      toast.error(errorMsg, { id: toastId });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[4px] shadow-2xl border border-zinc-200 w-full max-w-[1000px] max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* Header - Clean & Sharp */}
        <div className="px-8 py-5 border-b border-zinc-200 flex justify-between items-center bg-white">
          <h3 className="text-[15px] font-black text-zinc-900 uppercase tracking-[0.25em]">
            {product ? 'Edit Product' : 'New Product'}
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 transition-colors bg-zinc-50 p-1.5 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form id="product-form" onSubmit={handleSave} className="p-8 space-y-8">
            
            {/* AI Smart Draft - Top Level */}
            <div className="p-5 bg-indigo-50/30 rounded-[6px] border border-indigo-100/50 flex flex-col sm:flex-row items-center gap-5">
              <div className="flex items-center gap-3 min-w-fit px-2">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span className="text-[11px] font-black text-indigo-900/70 uppercase tracking-[0.2em]">AI Designer</span>
              </div>
              <div className="flex-1 flex gap-3 w-full">
                <input 
                  type="text"
                  value={aiChatInput}
                  onChange={(e) => setAiChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAIChatAutoFill(e)}
                  placeholder="Describe your vision (e.g. minimalist leather sofa with walnut legs)..."
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
              
              {/* Left Column: Narrative & Data */}
              <div className="space-y-8">
                
                {/* Title */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-zinc-900/80 uppercase tracking-[0.25em]">Product Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Minimalist Oak Chair"
                    className="w-full h-12 bg-white border border-zinc-200 rounded-[4px] px-5 text-sm focus:outline-none focus:border-zinc-900 transition-all placeholder:text-zinc-400 hover:border-zinc-300"
                  />
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-zinc-900/80 uppercase tracking-[0.25em]">Description</label>
                  <textarea
                    required
                    style={{ minHeight: '160px' }}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your product in detail..."
                    className="w-full p-5 bg-white border border-zinc-200 rounded-[4px] text-sm leading-relaxed focus:outline-none focus:border-zinc-900 transition-all placeholder:text-zinc-400 resize-none hover:border-zinc-300"
                  />
                </div>

                {/* Vertical Tabs & Data Section */}
                <div className="space-y-6">
                  {/* Tabs Row */}
                  <div className="flex border-b border-zinc-100 overflow-x-auto [&::-webkit-scrollbar]:hidden gap-2">
                    {[
                      { id: 'general', label: 'General' },
                      { id: 'inventory', label: 'Inventory' },
                      { id: 'variants', label: 'Variants' },
                      { id: 'translations', label: 'Translation' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-6 pb-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border-b-2 ${
                          activeTab === tab.id
                            ? 'text-zinc-900 border-zinc-900'
                            : 'text-zinc-400 border-transparent hover:text-zinc-600'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content Area */}
                  <div className="min-h-[220px]">
                    {activeTab === 'general' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.2em]">Regular Price</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold text-[10px] tracking-widest">SEK</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              required
                              value={formData.price ?? ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                setFormData({ ...formData, price: val as any });
                              }}
                              className="w-full h-11 pl-14 pr-4 bg-white border border-zinc-300 rounded-[4px] text-sm focus:outline-none focus:border-zinc-900 transition-all font-bold"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.2em]">Sale Price</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold text-[10px] tracking-widest">SEK</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={formData.discountPrice ?? ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                setFormData({ ...formData, discountPrice: val as any, isSale: Number(val) > 0 });
                              }}
                              className="w-full h-11 pl-14 pr-4 bg-white border border-zinc-300 rounded-[4px] text-sm focus:outline-none focus:border-zinc-900 transition-all font-bold"
                            />
                          </div>
                        </div>
                        <div className="col-span-full space-y-2">
                          <label className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.2em]">Category</label>
                          <SearchableSelect
                            options={categories.map(cat => ({ value: cat.id!, label: cat.name }))}
                            value={formData.categoryId || ''}
                            onChange={(value) => setFormData({ ...formData, categoryId: value as string })}
                            placeholder="Select category..."
                          />
                        </div>
                        <div className="col-span-full flex flex-wrap gap-x-8 gap-y-4 pt-6">
                          {[
                            { id: 'isFeatured', label: 'Featured' },
                            { id: 'isNewArrival', label: 'New Arrival' },
                            { id: 'isBestSeller', label: 'Best Seller' },
                          ].map((flag) => (
                            <label key={flag.id} className="flex items-center gap-3 cursor-pointer group">
                              <div className="relative flex items-center">
                                <input 
                                  type="checkbox" 
                                  checked={!!formData[flag.id as keyof Product]}
                                  onChange={(e) => setFormData({ ...formData, [flag.id]: e.target.checked })}
                                  className="w-4 h-4 rounded-none border-zinc-300 text-zinc-900 focus:ring-0 focus:ring-offset-0 transition-all" 
                                />
                              </div>
                              <span className="text-[11px] font-black text-zinc-600 uppercase tracking-widest group-hover:text-zinc-950 transition-colors">{flag.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'inventory' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.2em]">Stock Quantity</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            required
                            value={formData.stock ?? ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setFormData({ ...formData, stock: val as any });
                            }}
                            className="w-full h-11 px-4 bg-white border border-zinc-300 rounded-[4px] text-sm focus:outline-none focus:border-zinc-900 transition-all font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.2em]">SKU Code</label>
                          <input
                            type="text"
                            value={formData.sku || ''}
                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            placeholder="e.g. OAK-CH-01"
                            className="w-full h-11 px-4 bg-white border border-zinc-300 rounded-[4px] text-sm focus:outline-none focus:border-zinc-900 transition-all placeholder:text-zinc-400"
                          />
                        </div>
                        <div className="col-span-full space-y-2">
                          <label className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.2em]">Tags</label>
                          <input
                            type="text"
                            value={formData.tags?.join(', ') || ''}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                            placeholder="Minimalist, Chair, Wood"
                            className="w-full h-11 px-4 bg-white border border-zinc-300 rounded-[4px] text-sm focus:outline-none focus:border-zinc-900 transition-all placeholder:text-zinc-400"
                          />
                        </div>
                      </div>
                    )}

                    {activeTab === 'variants' && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <VariantEditor formData={formData} setFormData={setFormData} />
                      </div>
                    )}

                    {activeTab === 'translations' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex gap-2 p-1 bg-zinc-50 rounded-[4px] w-fit">
                          {settings?.languages?.map((lang: string) => (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => setSelectedLang(lang)}
                              className={`px-4 py-1.5 rounded-[2px] text-[10px] font-black uppercase tracking-widest transition-all ${
                                selectedLang === lang 
                                  ? 'bg-zinc-900 text-white' 
                                  : 'text-zinc-400 hover:text-zinc-600'
                              }`}
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                        <div className="space-y-6">
                           <div className="space-y-2">
                             <label className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.2em]">Title ({selectedLang})</label>
                             <input
                               type="text"
                               value={formData.translations?.[selectedLang]?.title || ''}
                               onChange={(e) => setFormData({
                                 ...formData,
                                 translations: {
                                   ...formData.translations,
                                   [selectedLang]: { ...formData.translations?.[selectedLang], title: e.target.value, description: formData.translations?.[selectedLang]?.description || '' }
                                 }
                               })}
                               className="w-full h-11 px-4 bg-white border border-zinc-300 rounded-[4px] text-sm focus:outline-none focus:border-zinc-900"
                             />
                           </div>
                           <div className="space-y-2">
                             <label className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.2em]">Description ({selectedLang})</label>
                             <textarea
                               rows={4}
                               value={formData.translations?.[selectedLang]?.description || ''}
                               onChange={(e) => setFormData({
                                 ...formData,
                                 translations: {
                                   ...formData.translations,
                                   [selectedLang]: { ...formData.translations?.[selectedLang], description: e.target.value, title: formData.translations?.[selectedLang]?.title || '' }
                                 }
                               })}
                               className="w-full p-4 bg-white border border-zinc-300 rounded-[4px] text-sm resize-none focus:outline-none focus:border-zinc-900"
                             />
                           </div>
                           <button 
                            type="button"
                            onClick={handleAITranslateProduct}
                            disabled={generating}
                            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-indigo-700 hover:text-indigo-900 transition-all disabled:opacity-50"
                           >
                            <Sparkles className="w-4 h-4" />
                            Auto-Translate All
                           </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Media */}
              <div className="space-y-8">
                
                {/* Main Media */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black text-zinc-900/80 uppercase tracking-[0.25em]">Media Visual</label>
                    <button 
                      type="button"
                      onClick={handleAIAutoCompleteProduct}
                      disabled={generating}
                      className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50 flex items-center gap-2 border border-indigo-100"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Auto-Gen
                    </button>
                  </div>
                  
                  <div className="relative group w-full aspect-square bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-[4px] flex flex-col items-center justify-center transition-all hover:bg-white hover:border-zinc-900 overflow-hidden">
                    {formData.imageUrl ? (
                      <>
                        <img src={formData.imageUrl} alt="Product" className="w-full h-full object-cover" />
                        <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-[2px]">
                          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Replace Image</span>
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center text-center px-6">
                        <ImageIcon className="w-10 h-10 text-zinc-400 mb-4" />
                        <span className="text-[13px] font-black text-zinc-900 uppercase tracking-widest block mb-1">Upload main image</span>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">PNG, JPG up to 5MB</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Paste image URL..."
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="flex-1 h-11 bg-white border border-zinc-200 rounded-[4px] px-4 text-xs focus:outline-none focus:border-zinc-900 placeholder:text-zinc-400"
                    />
                    <button 
                      type="button"
                      onClick={() => setIsMediaPickerOpen(true)}
                      className="h-10 px-4 bg-zinc-100 border border-zinc-200 rounded-[4px] text-[11px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all text-zinc-700"
                    >
                      Library
                    </button>
                  </div>
                </div>

                {/* Gallery */}
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.2em]">Gallery</label>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Existing Gallery Images */}
                    {formData.additionalImages?.map((img, idx) => (
                      <div key={idx} className="relative aspect-square bg-zinc-50 border border-zinc-200 rounded-[4px] group overflow-hidden">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-white border border-zinc-100 text-zinc-400 hover:text-rose-500 rounded-[2px] opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Add More Slot */}
                    <label className="aspect-square bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-[4px] flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-zinc-100 hover:border-zinc-900 group/gall">
                      <Plus className="w-6 h-6 text-zinc-400 group-hover/gall:text-zinc-900 transition-colors" />
                      <input type="file" className="hidden" accept="image/*" multiple onChange={handleGalleryUpload} />
                    </label>

                    {/* Empty Slots to match design 3-col look */}
                    {[...Array(Math.max(0, 2 - (formData.additionalImages?.length || 0)))].map((_, i) => (
                      <div key={i} className="aspect-square bg-zinc-50/50 border border-zinc-100 rounded-[4px]" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer - Perfectly Balanced Actions */}
        <div className="px-10 py-5 border-t border-zinc-200 bg-zinc-50/30 flex justify-between items-center">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-2.5 text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] hover:text-zinc-900 hover:bg-white rounded-full transition-all border border-transparent hover:border-zinc-200"
          >
            Save as Draft
          </button>
          <div className="flex gap-4">
            <button
              type="submit"
              form="product-form"
              disabled={generating || uploading}
              className="bg-black text-white px-12 h-11 rounded-[4px] text-[11px] font-black uppercase tracking-[0.25em] hover:bg-zinc-800 transition-all disabled:opacity-50"
            >
              {product ? 'Update Product' : 'Publish Product'}
            </button>
          </div>
        </div>
      </div>

      <MediaPickerModal 
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(url) => setFormData({ ...formData, imageUrl: url })}
        title="Select Product Image"
      />
    </div>
  );
}
