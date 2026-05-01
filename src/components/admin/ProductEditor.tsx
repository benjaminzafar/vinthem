"use client";
import { logger } from '@/lib/logger';
import React, { useState, useEffect } from 'react';
import { Product } from '@/store/useCartStore';
import { Category, StorefrontSettingsType } from '@/types';
import { X, Save, ArrowLeft, Sparkles, ImageIcon, Plus, Layout, Package, Tag, Globe, Truck, Languages, Wand2, Loader2 } from 'lucide-react';
import { SearchableSelect } from '../SearchableSelect';
import { VariantEditor } from '../VariantEditor';
import { toast } from 'sonner';
import { genAI } from '@/lib/ai';
import { MediaPickerModal } from './MediaPickerModal';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toMediaProxyUrl } from '@/lib/media';
import { isValidUrl } from '@/lib/utils';
import { normalizeProductOptions, inferOptionsFromLegacyArrays, normalizeGeneratedVariants, buildVariantsFromOptions } from '@/lib/product-variants';
import { safeParseAiResponse } from '@/lib/json';
import { parseCatalogPrompt } from '@/lib/product-import';
import { saveProductAction } from '@/app/actions/products';
import type { ProductVariantInput } from '@/app/actions/products';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { getAIErrorMessage } from '@/lib/ai-errors';

const STRIPE_TAX_CODE_OPTIONS = [
  { value: '', label: 'Auto from category' },
  { value: 'txcd_99999999', label: 'General tangible goods' },
  { value: 'txcd_10000000', label: 'Digital services' },
  { value: 'txcd_92010001', label: 'Shipping / delivery' },
];

interface ProductAIDraft {
  title?: string;
  description?: string;
  price?: number;
  stock?: number;
  sku?: string;
  weight?: number;
  tags?: string[];
  options?: Array<{ name: string; values: string[] }>;
  variants?: Array<{ options: Record<string, string>; price: number; stock: number; sku: string }>;
  colors?: string[]; // Legacy support for older prompts
  sizes?: string[];
  material?: string[];
}

interface ProductTranslationResult {
  [lang: string]: {
    title?: string;
    description?: string;
    options?: Array<{ name: string; values: string[] }>;
  };
}

interface ProductEditorProps {
  initialProduct?: Product | null;
  categories: Category[];
  settings: StorefrontSettingsType;
}

type ProductRecord = Product & {
  image_url?: string;
  additional_images?: string[];
  category_id?: string;
  is_featured?: boolean;
  is_new?: boolean;
  is_sale?: boolean;
  sale_price?: number;
  shipping_class?: string;
  stripe_tax_code?: string;
};

export function ProductEditor({ initialProduct, categories, settings }: ProductEditorProps) {
  const router = useRouter();
  const languages = settings.languages || ['sv'];
  const [formData, setFormData] = useState<Partial<Product>>({
    title: '',
    description: '',
    price: 0,
    stock: 0,
    sku: '',
    imageUrl: '',
    categoryId: '',
    options: [],
    tags: [],
    translations: {},
    variants: [],
    isFeatured: false,
    isNewArrival: false,
    isSale: false,
    discountPrice: 0,
    weight: 0,
    shippingClass: '',
    additionalImages: [],
    stripeTaxCode: ''
  });

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'main' | 'gallery'>('main');
  const [selectedLang, setSelectedLang] = useState('sv');
  const [aiChatInput, setAiChatInput] = useState('');

  const mapDbToForm = (p: ProductRecord): Partial<Product> => {
    if (!p) return {};
    return {
      ...p,
      imageUrl: p.image_url || p.imageUrl || '',
      additionalImages: p.additional_images || p.additionalImages || [],
      categoryId: p.category_id || p.categoryId || '',
      variants: (p.variants || []).map((v: any) => ({
        ...v,
        imageUrl: v.imageUrl || v.image_url || v.image || v.url || ''
      })),
      isFeatured: p.is_featured ?? p.isFeatured ?? false,
      isNewArrival: p.is_new ?? p.isNewArrival ?? false,
      isSale: p.is_sale ?? p.isSale ?? false,
      discountPrice: p.sale_price ?? p.discountPrice ?? 0,
      weight: p.weight ?? 0,
      shippingClass: p.shipping_class || p.shippingClass || '',
      stripeTaxCode: p.stripe_tax_code || p.stripeTaxCode || ''
    };
  };

  useEffect(() => {
    if (initialProduct && initialProduct.id !== formData.id) {
      setFormData(mapDbToForm(initialProduct));
    }
  }, [initialProduct, formData.id]);

  const handleSave = async (statusOverride?: 'published' | 'draft') => {
    if (!formData.title?.trim()) {
      toast.error('Product Title is required');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      toast.error('Valid Price is required');
      return;
    }

    setLoading(true);
    const currentStatus = statusOverride || (formData.status || 'published');
    const toastId = toast.loading(initialProduct ? 'Saving changes...' : 'Creating product...');

    try {
      const result = await saveProductAction({
        id: initialProduct?.id,
        title: formData.title || '',
        description: formData.description,
        price: Number(formData.price),
        stock: Number(formData.stock),
        sku: formData.sku,
        imageUrl: formData.imageUrl,
        categoryId: formData.categoryId,
        options: formData.options,
        variants: (formData.variants || []).map((variant) => ({
          options: variant.options || {},
          price: Number(variant.price || 0),
          stock: Number(variant.stock || 0),
          sku: variant.sku || '',
          imageUrl: variant.imageUrl || (variant as any).image_url || '',
        })) as ProductVariantInput[],
        translations: formData.translations,
        tags: formData.tags,
        isFeatured: formData.isFeatured,
        isNewArrival: formData.isNewArrival,
        isSale: formData.isSale,
        status: currentStatus,
        discountPrice: Number(formData.discountPrice),
        additionalImages: formData.additionalImages,
        weight: Number(formData.weight),
        shippingClass: formData.shippingClass,
        stripeTaxCode: formData.stripeTaxCode
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success(initialProduct ? 'Product updated' : 'Product created', { id: toastId });
      router.push('/admin/products');
      router.refresh();
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Save error:', err);
      toast.error(err.message || 'Failed to save', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleAIChatAutoFill = async () => {
    if (!aiChatInput.trim()) return;
    setGenerating(true);
    const toastId = toast.loading('AI is drafting your product...');

    try {
      const prompt = `Task: Convert the following product description into a highly detailed, professional JSON object for a shop system.
      Input Text: "${aiChatInput}"

      Extraction Rules:
      1. Map Swedish labels to fields:
         - 'Benämning' or 'Titel' -> title
         - 'Beskrivning' -> description (EXTREMELY IMPORTANT: Generate a detailed, persuasive 2-3 paragraph Swedish marketing description based on the attributes. Do NOT be brief.)
         - 'Artnr' or 'EAN-nr' -> sku
         - 'Pris' -> price
         - 'Antal' -> stock
         - 'Storlek' -> Attribute "Size"
         - 'Färg' -> Attribute "Color"
         - 'Material' -> Attribute "Material"
         - 'Vikt' -> weight (numeric kg)

      2. Variants & Exhaustive Extraction:
         - If the input text describes multiple items (e.g., "Item A" and "Item B" with different Artnr/SKUs), you MUST extract them ALL as distinct variants.
         - For every variant found, provide a dedicated object in the 'variants' array.
         - Ensure 'options' captures all unique values for Color, Size, and Material.

      Return ONLY this JSON structure:
      {
        "title": "Main Product Title",
        "description": "Long, detailed Swedish marketing description...",
        "price": number,
        "stock": number,
        "sku": "base-sku",
        "weight": number,
        "options": [{ "name": "string", "values": ["string"] }],
        "variants": [{ "options": { "AttributeName": "Value" }, "price": number, "stock": number, "sku": "string" }],
        "tags": ["string"]
      }`;

      const model = genAI.getGenerativeModel({
        promptProfile: 'product',
        generationConfig: { responseMimeType: 'application/json' }
      });
      const aiResponse = await model.generateContent(prompt);
      const result = safeParseAiResponse<ProductAIDraft>(aiResponse.response.text(), {});
      
      const normalizedOptions = normalizeProductOptions(result.options);
      const inferredOptions = normalizedOptions.length > 0 ? normalizedOptions : inferOptionsFromLegacyArrays({ 
        colors: result.colors, 
        sizes: result.sizes,
        material: result.material 
      });

      const finalVariants = normalizeGeneratedVariants(result.variants, result.price || formData.price || 0, result.sku || formData.sku || '');

      setFormData(prev => ({
        ...prev,
        title: result.title || prev.title,
        description: result.description || prev.description,
        price: Number(result.price) || prev.price,
        stock: Number(result.stock) || prev.stock,
        sku: result.sku || prev.sku,
        weight: Number(result.weight) || prev.weight,
        tags: Array.isArray(result.tags) ? result.tags : prev.tags,
        options: inferredOptions.length > 0 ? inferredOptions : prev.options,
        variants: finalVariants.length > 0 ? finalVariants : prev.variants,
      }));
      setAiChatInput('');
      toast.success('AI Draft Generated!', { id: toastId });
    } catch (error: unknown) {
      logger.error('AI Processing Error:', error);
      toast.error(getAIErrorMessage(error, 'AI draft generation failed.'), {
        id: toastId,
        duration: 5000
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleAITranslateProduct = async () => {
    if (!formData.title?.trim()) {
      toast.error('Product title is required for translation.');
      return;
    }
    const targetLangs = languages.filter(l => l !== 'en' && l !== 'sv');
    // We translate the Swedish title/description into all other languages,
    // and also the English title/description if present
    const allTargetLangs = languages.filter(l => l !== 'sv');
    if (allTargetLangs.length === 0) {
      toast.info('No extra languages configured.');
      return;
    }
    setGenerating(true);
    const toastId = toast.loading('AI translating product...');
    try {
      const prompt = `Translate the following product information into these languages: ${languages.join(', ')}.
Return ONLY a valid raw JSON object. No markdown backticks, no conversational text.
Schema: Each top-level key must be an ISO 639-1 language code, and each value an object with "title", "description", and an optional "options" array.
"options" should match the structure: [{"name": "Translated Attribute Name", "values": ["Translated Value 1", ...]}]

Example: { 
  "en": { "title": "...", "description": "...", "options": [{"name": "Color", "values": ["Red"]}] },
  "fi": { "title": "...", "description": "...", "options": [{"name": "Väri", "values": ["Punainen"]}] }
}

Product Title (Swedish): "${formData.title}"
Product Description (Swedish): "${formData.description || ''}"
Product Options: ${JSON.stringify(formData.options || [])}`;

      const model = genAI.getGenerativeModel({
        promptProfile: 'product',
        generationConfig: { responseMimeType: 'application/json' }
      });
      const aiResponse = await model.generateContent(prompt);
      const result = safeParseAiResponse<ProductTranslationResult>(aiResponse.response.text(), {});

      const newTranslations = { ...formData.translations };
      for (const lang of languages) {
        if (result[lang]) {
          newTranslations[lang] = {
            title: result[lang].title?.trim() || newTranslations[lang]?.title || '',
            description: result[lang].description?.trim() || newTranslations[lang]?.description || '',
            options: Array.isArray(result[lang].options) ? result[lang].options : (newTranslations[lang]?.options || [])
          };
          
          // If we are currently on the 'sv' tab or 'sv' is the target, 
          // we also update the primary fields if they were used for translation
          if (lang === 'sv') {
            setFormData(prev => ({
              ...prev,
              title: result[lang].title?.trim() || prev.title,
              description: result[lang].description?.trim() || prev.description,
              options: Array.isArray(result[lang].options) ? result[lang].options : prev.options
            }));
          }
        }
      }
      setFormData(prev => ({ ...prev, translations: newTranslations }));
      toast.success('Product translated to all languages', { id: toastId });
    } catch (error: unknown) {
      toast.error(getAIErrorMessage(error, 'AI translation failed.'), { id: toastId, duration: 5000 });
    } finally {
      setGenerating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading('Uploading main image...');
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('path', `products/${Date.now()}_${file.name}`);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
      toast.success('Main image updated', { id: toastId });
    } catch (err: unknown) {
      toast.error('Main image upload failed. Check server logs.', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const getLabel = (localized: Record<string, string> | undefined, fallback: string) => {
    if (!localized) return fallback;
    return localized[selectedLang] || localized.en || fallback;
  };

  return (
    <div className="space-y-6 pb-12">
      <AdminHeader
        title={initialProduct ? `Edit Product: ${formData.title || 'Untitled'}` : 'New Product'}
        description="Manage merchandising content, pricing, variants, tax handling, and storefront translations."
        primaryAction={{
          label: loading ? 'Publishing...' : 'Publish Product',
          icon: Save,
          onClick: () => void handleSave('published'),
          disabled: loading,
        }}
        secondaryActions={[
          {
            label: 'Save as Draft',
            icon: Save,
            onClick: () => void handleSave('draft'),
            disabled: loading,
          },
          {
            label: 'Back to Products',
            icon: ArrowLeft,
            onClick: () => router.push('/admin/products'),
          },
        ]}
        statsLabel={`${formData.status || 'draft'} mode`}
      />

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 sm:gap-8">
        {/* Main Content */}
        <div className="space-y-6">
          
          {/* AI Drafting Section */}
          <div className="bg-white border border-slate-200 rounded-none-[4px] p-5 sm:p-6">
             <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900">AI Product Assistant</h3>
             </div>
             <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  value={aiChatInput}
                  onChange={(e) => setAiChatInput(e.target.value)}
                  placeholder="Describe your product or paste raw supplier text here..."
                  className="w-full sm:flex-1 h-11 border border-slate-200 rounded-none-[4px] px-4 text-sm focus:outline-none focus:border-indigo-500"
                />
                <button 
                  onClick={handleAIChatAutoFill}
                  disabled={generating || !aiChatInput.trim()}
                  className="h-11 px-5 bg-indigo-600 text-white rounded-none-[4px] text-[12px] font-medium hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                >
                  {generating ? 'Processing...' : 'Auto-Draft'}
                  {!generating && <Wand2 className="w-4 h-4" />}
                </button>
             </div>
          </div>

          {/* General Information */}
          <section className="bg-white border border-slate-200 rounded-none-[4px]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Layout className="w-4 h-4 text-slate-500" />
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900">General Information</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Product Title</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full h-11 border border-slate-200 rounded-none-[4px] px-4 text-sm focus:border-slate-900 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Description</label>
                <textarea 
                  rows={8}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-4 border border-slate-200 rounded-none-[4px] text-sm focus:border-slate-900 transition-all resize-none leading-relaxed"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Category</label>
                    <SearchableSelect 
                      options={categories.map(c => ({ value: c.id!, label: c.name }))}
                      value={formData.categoryId || ''}
                      onChange={(val) => setFormData({...formData, categoryId: val as string})}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Tags</label>
                    <input 
                      type="text" 
                      value={formData.tags?.join(', ')}
                      onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})}
                      placeholder="Minimal, Wood, Premium"
                      className="w-full h-11 border border-slate-200 rounded-none-[4px] px-4 text-sm"
                    />
                 </div>
              </div>
            </div>
          </section>

          {/* Pricing & Inventory */}
          <section className="bg-white border border-slate-200 rounded-none-[4px]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-500" />
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900">{getLabel(settings.inventoryTitleText, "Pricing & Inventory")}</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                   <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{getLabel(settings.regularPriceText, "Regular Price (SEK)")}</label>
                   <input 
                     type="number"
                     value={formData.price || ''}
                     onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                     className="w-full h-11 border border-slate-200 rounded-none-[4px] px-4 text-sm font-medium"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{getLabel(settings.salePriceText, "Sale Price (SEK)")}</label>
                   <input 
                     type="number"
                     value={formData.discountPrice || ''}
                     onChange={(e) => setFormData({...formData, discountPrice: parseFloat(e.target.value) || 0, isSale: parseFloat(e.target.value) > 0})}
                     className="w-full h-11 border border-slate-200 rounded-none-[4px] px-4 text-sm font-medium text-rose-600"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{getLabel(settings.skuCodeText, "SKU Code")}</label>
                   <input 
                     type="text"
                     value={formData.sku || ''}
                     onChange={(e) => setFormData({...formData, sku: e.target.value})}
                     className="w-full h-11 border border-slate-200 rounded-none-[4px] px-4 text-sm"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{getLabel(settings.initialStockText, "Initial Stock")}</label>
                   <input 
                     type="number"
                     value={formData.stock || 0}
                     onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                     className="w-full h-11 border border-slate-200 rounded-none-[4px] px-4 text-sm font-medium"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{getLabel(settings.weightKgText, "Weight (kg)")}</label>
                   <input 
                     type="number"
                     value={formData.weight || 0}
                     onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value) || 0})}
                     className="w-full h-11 border border-slate-200 rounded-none-[4px] px-4 text-sm"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{getLabel(settings.shippingClassText, "Shipping Class")}</label>
                   <select 
                     value={formData.shippingClass || ''}
                     onChange={(e) => setFormData({...formData, shippingClass: e.target.value})}
                     className="w-full h-11 border border-slate-200 rounded-none-[4px] px-4 text-sm"
                   >
                     <option value="">Standard Shipping</option>
                     <option value="heavy">Heavy Items</option>
                     <option value="fragile">Fragile Box</option>
                     <option value="oversized">Oversized</option>
                   </select>
                </div>
              </div>
            </section>

          <section className="bg-white border border-slate-200 rounded-none-[4px]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-500" />
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900">Tax Configuration</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Stripe Tax Code</label>
                <select
                  value={formData.stripeTaxCode || ''}
                  onChange={(e) => setFormData({ ...formData, stripeTaxCode: e.target.value })}
                  className="w-full h-11 border border-slate-200 rounded-none-[4px] px-4 text-sm"
                >
                  {STRIPE_TAX_CODE_OPTIONS.map((option) => (
                    <option key={option.value || 'auto'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  Leave it on auto if you want checkout to infer the tax code from category and shipping class.
                </p>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Product prices stay in SEK inside the admin. Stripe Checkout handles currency presentation and tax automatically for supported markets during payment.
              </p>
            </div>
          </section>
  
          {/* Variants Management */}
          <section className="bg-white border border-slate-200 rounded-none-[4px] overflow-hidden shadow-none">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Tag className="w-4 h-4 text-slate-500" />
                   <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900">Advanced Variants</h3>
                </div>
             </div>
             <div className="p-6">
                <VariantEditor formData={formData} setFormData={setFormData} />
             </div>
          </section>

          {/* Multilingual Content */}
          <section className="bg-white border border-slate-200 rounded-none-[4px] overflow-hidden shadow-none">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <Globe className="w-4 h-4 text-slate-500" />
                 <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900">Translations</h3>
               </div>
               <button
                 onClick={handleAITranslateProduct}
                 disabled={generating || !formData.title?.trim()}
                 className="flex items-center gap-1.5 px-4 h-9 text-[12px] font-medium bg-indigo-600 text-white rounded-none hover:bg-indigo-700 transition-all disabled:opacity-50"
               >
                 {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                 AI Translate All
               </button>
             </div>
            <div className="p-6 space-y-6">
               <div className="flex gap-2 p-1 bg-slate-50 rounded-none w-fit">
                  {languages.map(lang => (
                    <button 
                      key={lang}
                      onClick={() => setSelectedLang(lang)}
                    className={`px-5 py-1.5 rounded-none-[2px] text-[11px] font-semibold uppercase tracking-[0.16em] transition-all ${selectedLang === lang ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                      {lang}
                    </button>
                  ))}
               </div>
               <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Translated Title ({selectedLang})</label>
                    <input 
                      type="text" 
                      value={formData.translations?.[selectedLang]?.title || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        translations: {
                          ...formData.translations,
                          [selectedLang]: { 
                            title: e.target.value, 
                            description: formData.translations?.[selectedLang]?.description || '' 
                          }
                        }
                      })}
                      className="w-full h-11 border border-slate-200 rounded-none-[4px] px-4 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Translated Description ({selectedLang})</label>
                    <textarea 
                      rows={4}
                      value={formData.translations?.[selectedLang]?.description || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        translations: {
                          ...formData.translations,
                          [selectedLang]: { 
                            description: e.target.value, 
                            title: formData.translations?.[selectedLang]?.title || '' 
                          }
                        }
                      })}
                      className="w-full p-4 border border-slate-200 rounded-none-[4px] text-sm resize-none"
                    />
                  </div>

                  {formData.translations?.[selectedLang]?.options && formData.translations[selectedLang].options!.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                       <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Translated Attributes ({selectedLang})</label>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {formData.translations[selectedLang].options!.map((option, optIdx) => (
                            <div key={`${selectedLang}-opt-${optIdx}`} className="space-y-2 p-3 bg-slate-50 rounded-none border border-slate-100">
                               <input 
                                 type="text"
                                 value={option.name}
                                 onChange={(e) => {
                                   const newOpts = [...(formData.translations?.[selectedLang]?.options || [])];
                                   newOpts[optIdx] = { ...newOpts[optIdx], name: e.target.value };
                                   setFormData({
                                     ...formData,
                                     translations: {
                                       ...formData.translations,
                                       [selectedLang]: { 
                                         title: formData.translations?.[selectedLang]?.title || '',
                                         description: formData.translations?.[selectedLang]?.description || '',
                                         ...formData.translations?.[selectedLang],
                                         options: newOpts 
                                       }
                                     }
                                   });
                                 }}
                                 className="w-full text-[11px] font-semibold uppercase tracking-[0.16em] bg-transparent border-none p-0 focus:ring-0 text-slate-900"
                                 placeholder="Attribute Name"
                               />
                               <div className="flex flex-wrap gap-1">
                                  {option.values.map((val, valIdx) => (
                                    <input 
                                      key={valIdx}
                                      type="text"
                                      value={val}
                                      onChange={(e) => {
                                        const newOpts = [...(formData.translations?.[selectedLang]?.options || [])];
                                        const newVals = [...newOpts[optIdx].values];
                                        newVals[valIdx] = e.target.value;
                                        newOpts[optIdx] = { ...newOpts[optIdx], values: newVals };
                                        setFormData({
                                          ...formData,
                                          translations: {
                                            ...formData.translations,
                                            [selectedLang]: { 
                                              title: formData.translations?.[selectedLang]?.title || '',
                                              description: formData.translations?.[selectedLang]?.description || '',
                                              ...formData.translations?.[selectedLang],
                                              options: newOpts 
                                            }
                                          }
                                        });
                                      }}
                                      className="text-[10px] px-2 py-1 bg-white border border-slate-200 rounded-none min-w-[60px]"
                                    />
                                  ))}
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
           
           {/* Main Media Visual */}
           <section className="bg-white border border-slate-200 rounded-none-[4px] overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900">Main Product Image</h3>
              </div>
              <div className="p-6 pt-2">
                <label className="relative aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-none-[4px] flex items-center justify-center overflow-hidden hover:border-slate-900 transition-all cursor-pointer group mb-4">

                   {isValidUrl(formData.imageUrl) ? (
                     <div className="relative w-full h-full">
                       <Image 
                         src={toMediaProxyUrl(formData.imageUrl)} 
                         alt="Main product asset" 
                         fill 
                         sizes="(max-width: 768px) 100vw, 400px" 
                         className="object-cover" 
                         onError={(e) => {
                           const target = e.target as HTMLImageElement;
                           target.style.display = 'none';
                           const parent = target.parentElement;
                           if (parent && !parent.querySelector('.broken-indicator')) {
                             const diag = document.createElement('div');
                             diag.className = 'broken-indicator absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-50 border-2 border-dashed border-slate-200 pointer-events-none';
                             diag.innerHTML = `
                               <svg class="w-6 h-6 text-slate-300 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><path d="m9 10 2 2 4-4"/><path d="M12 18v-4"/><path d="M12 8h.01"/></svg>
                               <p style="font-size: 8px; font-weight: 900; color: #64748b; text-transform: uppercase;">Image Private or Broken</p>
                               <p style="font-size: 7px; color: #94a3b8; margin-top: 4px;">Path: ${formData.imageUrl ? formData.imageUrl.slice(0, 30) : 'None'}...</p>
                             `;
                             parent.appendChild(diag);
                           }
                         }}
                       />
                     </div>
                   ) : (
                     <div className="text-center p-6">
                        <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Click to upload main image</p>
                     </div>
                   )}
                   <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all z-10 pointer-events-none">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white border-white border px-4 py-2">Change Image</span>
                   </div>
                </label>

                <div className="flex gap-2">
                   <input 
                     type="text" 
                     placeholder="Or paste image URL..."
                     value={formData.imageUrl}
                     onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                     className="flex-1 h-10 border border-slate-200 rounded-none-[4px] px-3 text-[12px]"
                   />
                   <button 
                     onClick={() => {
                        setMediaPickerTarget('main');
                        setIsMediaPickerOpen(true);
                     }}
                     className="h-10 px-4 bg-slate-50 border border-slate-200 rounded-none text-[12px] font-medium hover:border-slate-900 transition-all"
                   >
                     Library
                   </button>
                </div>
              </div>
           </section>

           {/* Organization & Visibility */}
           <section className="bg-white border border-slate-200 rounded-none-[4px] overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
               <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900">Optimization</h3>
             </div>
             <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                   <div className="space-y-0.5">
                     <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900">Featured Product</p>
                     <p className="text-[11px] text-slate-500">Show on homepage collections</p>
                   </div>
                   <input 
                    type="checkbox" 
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                    className="w-4 h-4 rounded-none border-slate-300 transition-all"
                   />
                </div>
                <div className="flex items-center justify-between">
                   <div className="space-y-0.5">
                     <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900">New Arrival Badge</p>
                     <p className="text-[11px] text-slate-500">Apply visual tag on storefront</p>
                   </div>
                   <input 
                    type="checkbox" 
                    checked={formData.isNewArrival}
                    onChange={(e) => setFormData({...formData, isNewArrival: e.target.checked})}
                    className="w-4 h-4 rounded-none border-slate-300 transition-all"
                   />
                </div>
             </div>
           </section>

           {/* Gallery Summary */}
           <section className="bg-white border border-slate-200 rounded-none-[4px] overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900">Product Gallery</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-4 gap-2 mb-4">
                   {formData.additionalImages?.map((url, idx) => (
                     <div key={idx} className="relative aspect-square bg-slate-50 border border-slate-100 rounded-none overflow-hidden group/img">
                        <Image 
                          src={toMediaProxyUrl(url)} 
                          alt={`Gallery asset ${idx + 2}`} 
                          fill 
                          sizes="120px" 
                          className="object-cover transition-transform group-hover/img:scale-110" 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.broken-indicator')) {
                              const diag = document.createElement('div');
                              diag.className = 'broken-indicator absolute inset-0 flex flex-col items-center justify-center text-center bg-slate-100';
                              diag.innerHTML = `
                                <svg class="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><path d="m9 10 2 2 4-4"/></svg>
                                <span style="font-size: 6px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-top: 2px;">Error</span>
                              `;
                              parent.appendChild(diag);
                            }
                          }}
                        />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData(prev => ({ 
                              ...prev, 
                              additionalImages: prev.additionalImages?.filter((_, i) => i !== idx) 
                            }));
                          }}
                          className="absolute top-1 right-1 bg-white/90 backdrop-blur-sm border border-slate-200 text-rose-600 rounded-none p-1 opacity-0 group-hover/img:opacity-100 hover:bg-rose-600 hover:text-white transition-all shadow-none z-20"
                          title="Remove Image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                   <label className="aspect-square border-2 border-dashed border-slate-200 rounded-none flex items-center justify-center hover:border-slate-400 transition-all cursor-pointer group">
                      <Plus className="w-4 h-4 text-slate-500 group-hover:text-slate-900" />
                      <input type="file" className="hidden" multiple accept="image/*" onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;
                        const toastId = toast.loading(`Targeting ${files.length} images for sequential secure upload...`);
                        try {
                          const urls: string[] = [];
                          for (const f of files) {
                            try {
                              const formDataUpload = new FormData();
                              formDataUpload.append('file', f);
                              formDataUpload.append('path', `gallery/${Date.now()}_${f.name}`);

                              const res = await fetch('/api/upload', {
                                method: 'POST',
                                body: formDataUpload,
                              });
                              const data = await res.json();
                              if (res.ok && data.url) {
                                urls.push(data.url);
                              } else {
                                logger.error(`Proxy upload failed for ${f.name}: ${data.error}`);
                              }
                            } catch (err) {
                              logger.error(`Individual proxy upload error for ${f.name}`, err);
                            }
                          }
                          if (urls.length > 0) {
                            setFormData(prev => ({ ...prev, additionalImages: [...(prev.additionalImages || []), ...urls] }));
                            toast.success(`Gallery synchronized (${urls.length} images added via secure proxy)`, { id: toastId });
                          } else {
                            toast.error('Gallery synchronization failed. Connection or R2 issue.', { id: toastId });
                          }
                        } catch (err) { toast.error('Gallery sequential logic failed', { id: toastId }); }
                      }} />
                   </label>
                   <button 
                      onClick={() => {
                        setMediaPickerTarget('gallery');
                        setIsMediaPickerOpen(true);
                      }}
                      className="aspect-square border-2 border-dashed border-slate-200 rounded-none flex flex-col items-center justify-center hover:border-slate-400 transition-all bg-slate-50 group"
                   >
                      <ImageIcon className="w-4 h-4 text-slate-500 group-hover:text-slate-900" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-1">Lib</span>
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
          if (mediaPickerTarget === 'main') {
            setFormData({ ...formData, imageUrl: url }); 
          } else {
            setFormData(prev => ({ 
              ...prev, 
              additionalImages: [...(prev.additionalImages || []), url] 
            }));
          }
          setIsMediaPickerOpen(false); 
        }}
      />
    </div>
  );
}
