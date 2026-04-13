"use client";
import React, { useState, useEffect } from 'react';
import { Product } from '@/store/useCartStore';
import { Category } from '../../types';
import { X, DollarSign, Package, Palette, Languages, ChevronUp, ChevronDown, Sparkles, ImageIcon, Plus, Globe } from 'lucide-react';
import { SearchableSelect } from '../SearchableSelect';
import { VariantEditor } from '../VariantEditor';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { getAI } from '@/lib/gemini';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  categories: Category[];
  settings: any;
}

export function ProductModal({ isOpen, onClose, product, categories, settings }: ProductModalProps) {
  const supabase = createClient();
  const [formData, setFormData] = useState<Partial<Product>>({
    title: '',
    description: '',
    price: 0,
    stock: 0,
    sku: '',
    imageUrl: '',
    category: '',
    categoryId: '',
    sizes: [],
    colors: [],
    tags: [],
    translations: {},
    variants: []
  });

  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const [activeTab, setActiveTab] = useState<'general' | 'inventory' | 'variants' | 'translations'>('general');

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
          category: '',
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
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || 'Failed to upload image', { id: toastId });
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
    } catch (error: any) {
      console.error("Gallery upload error:", error);
      toast.error(error.message || 'Failed to upload gallery images', { id: toastId });
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
      const ai = getAI();
      
      const response = await fetch(formData.imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64data = reader.result as string;
          resolve(base64data.split(',')[1]);
        };
      });
      reader.readAsDataURL(blob);
      const base64Data = await base64Promise;

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

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: [
          { text: prompt },
          { inlineData: { data: base64Data, mimeType: blob.type } }
        ],
        config: {
          responseMimeType: 'application/json',
        }
      });

      const result = JSON.parse(aiResponse.text);
      
      setFormData(prev => ({
        ...prev,
        title: result.title || prev.title,
        description: result.description || prev.description,
        price: result.price || prev.price,
        colors: result.colors || prev.colors,
        sizes: result.sizes || prev.sizes,
        category: result.category || prev.category,
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
      const ai = getAI();
      const languagesToTranslate = settings?.languages || [];
      
      if (!languagesToTranslate || languagesToTranslate.length === 0) {
        toast.success('No languages configured to translate to.', { id: toastId });
        setGenerating(false);
        return;
      }

      const prompt = `Translate the following product details into these languages: ${languagesToTranslate.join(', ')}.
      Title: ${formData.title}
      Description: ${formData.description}
      
      Return ONLY a JSON object where keys are language codes and values are objects with 'title' and 'description'.`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const translations = JSON.parse(aiResponse.text);
      
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
        category_id: formData.categoryId,
        category_name: formData.category,
        variants: formData.variants,
        translations: formData.translations,
        sizes: formData.sizes,
        colors: formData.colors,
        tags: formData.tags,
        is_featured: formData.isFeatured || false,
        is_new_arrival: formData.isNewArrival || false,
        is_best_seller: formData.isBestSeller || false,
        is_coming_soon: formData.isComingSoon || false,
        is_sale: formData.isSale || false,
        discount_price: formData.discountPrice ? Number(formData.discountPrice) : 0,
        additional_images: formData.additionalImages || [],
        weight: formData.weight || 0,
        shipping_class: formData.shippingClass || ''
      };

      if (product) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);
        if (error) throw error;
        toast.success('Product updated successfully', { id: toastId });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        if (error) throw error;
        toast.success('Product added successfully', { id: toastId });
      }
      onClose();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error(error.message || 'Failed to save product', { id: toastId });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-gray-200/60 shadow-xl w-full max-w-[860px] max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-3 py-2 h-[52px] border-b border-zinc-200 bg-zinc-50/50">
          <h3 className="text-[16px] font-semibold text-zinc-900 tracking-tight">
            {product ? 'Edit Product' : 'Add New Product'}
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors h-[36px] w-[36px] flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-zinc-50/30">
          <form id="product-form" onSubmit={handleSave} className="px-4 py-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Title & Description */}
                <div className="pb-6 border-b border-gray-200/60 last:border-0 space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Product Title</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Minimalist Oak Chair"
                      className="w-full px-4 h-[44px] bg-white border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900 transition-all text-sm placeholder:text-zinc-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center gap-4 mb-2">
                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Description</label>
                    </div>
                    <textarea
                      required
                      style={{ minHeight: '160px' }}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your product in detail..."
                      className="w-full p-4 bg-white border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900 transition-all text-sm leading-relaxed placeholder:text-zinc-400 resize-none"
                    />
                  </div>
                </div>

                {/* Product Data Box */}
                <div className="border border-zinc-200 rounded-md overflow-hidden flex flex-col bg-white">
                  {/* Horizontal Tabs */}
                  <div className="w-full bg-zinc-50/50 border-b border-zinc-200 flex flex-row overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="flex flex-col sm:flex-row w-full">
                      {[
                        { id: 'general', label: 'General', icon: DollarSign },
                        { id: 'inventory', label: 'Inventory', icon: Package },
                        { id: 'variants', label: 'Variants', icon: Palette },
                        { id: 'translations', label: 'Translations', icon: Languages },
                      ].map((tab) => (
                        <React.Fragment key={tab.id}>
                          {/* Mobile Accordion Header */}
                          <button
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`sm:hidden w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-all border-b border-zinc-200 last:border-0 ${
                              activeTab === tab.id
                                ? 'bg-zinc-100 text-zinc-900'
                                : 'bg-white text-zinc-600 hover:bg-zinc-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <tab.icon className="w-4 h-4 stroke-[1.5]" />
                              {tab.label}
                            </div>
                            {activeTab === tab.id ? <ChevronUp className="w-4 h-4 stroke-[1.5]" /> : <ChevronDown className="w-4 h-4 stroke-[1.5]" />}
                          </button>

                          {/* Desktop Tab */}
                          <button
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`hidden sm:flex flex-1 items-center justify-center gap-2 px-4 h-[44px] text-sm transition-all ${
                              activeTab === tab.id
                                ? 'text-zinc-900 border-b-2 border-zinc-900 font-medium'
                                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 font-normal'
                            }`}
                          >
                            <tab.icon className="w-3.5 h-3.5 stroke-[1.5]" />
                            {tab.label}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="p-4 sm:p-6 min-h-[400px]">
                    {activeTab === 'general' && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-zinc-900 mb-4">Pricing</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Regular Price</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-medium text-sm">SEK</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                required
                                value={formData.price ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9.]/g, '');
                                  setFormData({ ...formData, price: val as any });
                                }}
                                className="w-full pl-12 pr-4 h-[44px] bg-white border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900 transition-all text-sm"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Sale Price</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400 font-medium text-sm">SEK</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={formData.discountPrice ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9.]/g, '');
                                  setFormData({ ...formData, discountPrice: val as any, isSale: Number(val) > 0 });
                                }}
                                className="w-full pl-12 pr-4 h-[44px] bg-white border border-zinc-200 rounded-md focus:ring-2 focus:ring-rose-500 transition-all text-sm text-rose-600"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'inventory' && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-zinc-900 mb-4">Inventory</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Stock Quantity</label>
                            <div className="relative">
                              <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                              <input
                                type="text"
                                inputMode="numeric"
                                required
                                value={formData.stock ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, '');
                                  setFormData({ ...formData, stock: val as any });
                                }}
                                className="w-full pl-12 pr-4 h-[44px] bg-white border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900 transition-all text-sm"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">SKU</label>
                            <input
                              type="text"
                              value={formData.sku || ''}
                              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                              placeholder="e.g. NORD-1002"
                              className="w-full px-4 h-[44px] bg-white border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900 transition-all text-sm placeholder:text-zinc-400"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'variants' && (
                      <div className="space-y-4">
                        <VariantEditor formData={formData} setFormData={setFormData} />
                      </div>
                    )}

                    {activeTab === 'translations' && (
                      <div className="space-y-6">
                        <div className="bg-indigo-50 rounded-md p-4 border border-indigo-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <h4 className="text-indigo-900 font-bold tracking-tight text-sm">Multi-language Support</h4>
                            <p className="text-indigo-600/80 text-xs mt-1">Translate your product for global reach</p>
                          </div>
                          <button 
                            type="button"
                            onClick={handleAITranslateProduct}
                            disabled={generating || !formData.title || !formData.description}
                            className="w-full sm:w-auto flex items-center justify-center bg-white text-zinc-900 hover:bg-zinc-50 border border-zinc-200 px-4 h-[44px] text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                          >
                            <Globe className="w-4 h-4 mr-2" />
                            Translate All
                          </button>
                        </div>

                        <div className="flex gap-2 p-1 bg-zinc-100 rounded-md w-fit overflow-x-auto max-w-full">
                          {settings?.languages?.map((lang: string) => (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => setSelectedLang(lang)}
                              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all ${
                                selectedLang === lang 
                                  ? 'bg-white text-zinc-900 shadow-sm' 
                                  : 'text-zinc-500 hover:text-zinc-700'
                              }`}
                            >
                              {lang}
                            </button>
                          ))}
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Translated Title ({selectedLang.toUpperCase()})</label>
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
                              className="w-full px-4 h-[44px] bg-white border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900 transition-all text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Translated Description ({selectedLang.toUpperCase()})</label>
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
                              className="w-full p-4 bg-white border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900 transition-all text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Publish Box */}
                <div className="pb-6 border-b border-gray-200/60 last:border-0 space-y-4">
                  <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider pb-2 border-b border-zinc-100">Publish</h4>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {[
                      { id: 'isFeatured', label: 'Featured' },
                      { id: 'isNewArrival', label: 'New Arrival' },
                      { id: 'isBestSeller', label: 'Best Seller' },
                      { id: 'isComingSoon', label: 'Coming Soon' },
                    ].map((flag) => (
                      <label key={flag.id} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={(formData as any)[flag.id]}
                          onChange={(e) => setFormData({ ...formData, [flag.id]: e.target.checked })}
                          className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" 
                        />
                        <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900">{flag.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Categories & Tags */}
                <div className="pb-6 border-b border-gray-200/60 last:border-0 space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Product Category</h4>
                    <SearchableSelect
                      options={categories.map(cat => ({ value: cat.id!, label: cat.name }))}
                      value={formData.categoryId || ''}
                      onChange={(value) => {
                        const cat = categories.find(c => c.id === value);
                        setFormData({ ...formData, categoryId: value as string, category: cat ? cat.name : '' });
                      }}
                      placeholder="Select category..."
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Product Tags</h4>
                    <input
                      type="text"
                      value={formData.tags?.join(', ') || ''}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      className="w-full px-4 h-[44px] bg-white border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900 transition-all text-sm"
                      placeholder="Tag1, Tag2, Tag3"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Product Image */}
                <div className="pb-6 border-b border-gray-200/60 last:border-0 space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Product Image</h4>
                    <button 
                      type="button"
                      onClick={handleAIAutoCompleteProduct}
                      disabled={generating || !formData.imageUrl}
                      className="gap-2 p-1.5 w-full sm:w-auto flex items-center justify-center bg-white text-zinc-900 hover:bg-zinc-50 border border-zinc-200 px-4 h-[44px] text-sm font-medium rounded-md transition-colors"
                      title="AI Auto-Fill"
                    >
                      <Sparkles className="w-4 h-4" />
                      AI Auto-Fill
                    </button>
                  </div>
                  
                  <div className="relative group w-full aspect-square rounded-md overflow-hidden border border-dashed border-zinc-300 bg-zinc-50 hover:bg-zinc-100 transition-colors">
                    {formData.imageUrl ? (
                      <>
                        <img src={formData.imageUrl} alt="Product" className="w-full h-full object-cover" />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                          <span className="bg-black/50 text-white px-3 py-1 rounded text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">Change Image</span>
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                        </label>
                      </>
                    ) : (
                      <label className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 cursor-pointer">
                        <ImageIcon className="w-8 h-8 mb-2" />
                        <span className="text-xs font-medium">Set product image</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                      </label>
                    )}
                  </div>
                  <input 
                    type="text" 
                    placeholder="Or paste image URL..."
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-4 h-[44px] bg-white border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900 transition-all"
                  />
                </div>

                {/* Product Gallery */}
                <div className="pb-6 border-b border-gray-200/60 last:border-0 space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Product Gallery</h4>
                    <label className="p-1.5 bg-white text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors cursor-pointer flex items-center justify-center h-[44px] w-[44px]" title="Add Gallery Images">
                      <Plus className="w-4 h-4" />
                      <input type="file" className="hidden" accept="image/*" multiple onChange={handleGalleryUpload} disabled={uploading} />
                    </label>
                  </div>
                  
                  {formData.additionalImages && formData.additionalImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {formData.additionalImages.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-md overflow-hidden border border-zinc-200">
                          <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-white/90 text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full py-8 border border-dashed border-zinc-300 rounded-md flex flex-col items-center justify-center text-zinc-400 bg-zinc-50">
                      <ImageIcon className="w-6 h-6 mb-2 opacity-50" />
                      <p className="text-xs font-medium text-center px-4">Add product gallery images</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-zinc-200 flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 flex items-center justify-center bg-white text-zinc-900 hover:bg-zinc-50 border border-zinc-200 px-6 h-[44px] text-sm font-medium rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="product-form"
                disabled={generating}
                className="flex-1 flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-6 h-[44px] text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {product ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
