"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, Layout, ImageIcon, AlignLeft, Info, Save, 
  Loader2, Sparkles, Upload, Mail, FileCode, Users, 
  ShoppingBag, ShoppingCart, Languages, LinkIcon, Plus, Trash2, Package 
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminHeader } from '../AdminHeader';
import { SettingCard } from './SettingCard';
import { LocalizedSettingInput } from './LocalizedSettingInput';
import { CredentialInput } from '../integrations/CredentialInput';
import { StorefrontSettings as StorefrontSettingsType, LocalizedString, useSettingsStore } from '@/store/useSettingsStore';
import { updateSettingsAction } from '@/app/actions/storefront';
import { genAI } from '@/lib/ai';

const CATEGORIES = [
  { id: 'branding', name: 'Identity & Brand', icon: Sparkles, color: 'text-zinc-900', bg: 'bg-zinc-50' },
  { id: 'navigation', name: 'Layout & Links', icon: Layout, color: 'text-zinc-900', bg: 'bg-zinc-50' },
  { id: 'homepage', name: 'Live Display', icon: ImageIcon, color: 'text-zinc-900', bg: 'bg-zinc-50' },
  { id: 'labels', name: 'System Labels', icon: AlignLeft, color: 'text-zinc-900', bg: 'bg-zinc-50' },
  { id: 'multilang', name: 'Globalization', icon: Languages, color: 'text-zinc-900', bg: 'bg-zinc-50' },
];

export function StorefrontContainer() {
  const { settings: initialSettings } = useSettingsStore();
  const [settings, setSettings] = useState<StorefrontSettingsType>(initialSettings);
  const [activeCategory, setActiveCategory] = useState('branding');
  const [isPending, startTransition] = useTransition();
  const [generating, setGenerating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  useEffect(() => {
    if (initialSettings && Object.keys(initialSettings).length > 0) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const handleUpdate = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings as any;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof StorefrontSettingsType) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading('Synchronizing asset to cloud...');
    try {
      const { uploadImageWithTimeout } = await import('@/lib/upload');
      const url = await uploadImageWithTimeout(file, `storefront/${Date.now()}_${file.name}`);
      handleUpdate(field as string, url);
      toast.success('Asset synchronized', { id: toastId });
    } catch (error: any) {
      toast.error('Sync failed', { id: toastId });
    }
  };

  const handleAIAutoComplete = async (field: keyof StorefrontSettingsType, label: string) => {
    setGenerating(true);
    const toastId = toast.loading(`Neuromorphic generation in progress for ${label}...`);
    try {
      const prompt = `Generate a creative and professional ${label} for a premium minimalist e-commerce store named "${settings.storeName.en}". Return ONLY the text content.`;
      const model = genAI.getGenerativeModel({ model: "llama-3.3-70b-versatile" });
      const aiResponse = await model.generateContent(prompt);
      const text = aiResponse.response.text()?.trim() || '';
      handleUpdate(`${field as string}.en`, text);
      toast.success('Content generated', { id: toastId });
    } catch (error) {
      toast.error('AI Logic Timeout', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleAITranslate = async (field: keyof StorefrontSettingsType, label: string) => {
    const value = settings[field] as LocalizedString;
    if (!value.en) {
      toast.error('Source text (EN) required for translation orchestration.');
      return;
    }
    setGenerating(true);
    const toastId = toast.loading(`Orchestrating translations for ${label}...`);
    try {
      const prompt = `Translate to: ${settings.languages.filter(l => l !== 'en').join(', ')}. Text: "${value.en}". Return ONLY a JSON object of translations.`;
      const model = genAI.getGenerativeModel({ 
        model: "llama-3.3-70b-versatile",
        generationConfig: { responseMimeType: "application/json" }
      });
      const aiResponse = await model.generateContent(prompt);
      const translations = JSON.parse(aiResponse.response.text() || '{}');
      handleUpdate(field as string, { ...value, ...translations });
      toast.success('Translations synchronized', { id: toastId });
    } catch (error) {
       toast.error('Translation logic failed', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    startTransition(async () => {
      const toastId = toast.loading('Synchronizing store configuration...');
      const result = await updateSettingsAction(settings);
      if (result.success) toast.success(result.message, { id: toastId });
      else toast.error(result.message, { id: toastId });
    });
  };

  return (
    <div className="space-y-4 pb-12">
      <AdminHeader 
        title="Storefront Settings"
        description="Configure your brand visual identity and structural navigation."
        primaryAction={{
          label: isPending ? "Syncing..." : "Publish Config",
          icon: isPending ? Loader2 : Save,
          onClick: handleSave
        }}
        secondaryActions={[
          { label: 'View Store', icon: Globe, onClick: () => window.open('/', '_blank') }
        ]}
      />

      {/* Category Tabs - Flat Style */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-100 mb-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 text-[12px] font-black transition-all whitespace-nowrap rounded-md uppercase tracking-widest ${activeCategory === cat.id ? `${cat.bg} text-zinc-900 border border-zinc-200/50` : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <cat.icon className="w-3.5 h-3.5" />
            {cat.name}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {activeCategory === 'branding' && (
            <motion.div key="branding" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
              <div className="grid grid-cols-1 gap-4">
                <SettingCard id="Identity" title="Brand Identity" icon={Sparkles} defaultExpanded>
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-32 h-32 rounded border border-zinc-100 bg-zinc-50 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:bg-zinc-100/50 transition-colors">
                      {settings.logoImage ? (
                        <img src={settings.logoImage} alt="Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-zinc-200" />
                      )}
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoImage')} className="absolute inset-0 opacity-0 cursor-pointer" title="Update Logo" />
                      <div className="absolute inset-0 bg-zinc-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="w-6 h-6 text-zinc-400" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <LocalizedSettingInput 
                        label="Store Name" 
                        value={settings.storeName} 
                        onChange={v => handleUpdate('storeName', v)}
                        languages={settings.languages}
                        onAITranslate={() => handleAITranslate('storeName', 'Store Name')}
                        onAIAutoComplete={() => handleAIAutoComplete('storeName', 'Store Name')}
                        isGenerating={generating}
                      />
                      <CredentialInput 
                        label="Logo Asset URL" 
                        value={settings.logoImage} 
                        onChange={v => handleUpdate('logoImage', v)} 
                        description="Direct cloud storage link"
                      />
                    </div>
                  </div>
                </SettingCard>

                <SettingCard id="SEO" title="Global SEO Strategy" icon={Globe}>
                    <LocalizedSettingInput 
                      label="Search Title" 
                      value={settings.seoTitle} 
                      onChange={v => handleUpdate('seoTitle', v)}
                      languages={settings.languages}
                      onAIAutoComplete={() => handleAIAutoComplete('seoTitle', 'SEO Title')}
                      onAITranslate={() => handleAITranslate('seoTitle', 'SEO Title')}
                      isGenerating={generating}
                    />
                  <LocalizedSettingInput 
                    label="Search Description" 
                    value={settings.seoDescription} 
                    onChange={v => handleUpdate('seoDescription', v)}
                    languages={settings.languages}
                    type="textarea"
                    onAIAutoComplete={() => handleAIAutoComplete('seoDescription', 'SEO Description')}
                    onAITranslate={() => handleAITranslate('seoDescription', 'SEO Description')}
                    isGenerating={generating}
                  />
                </SettingCard>

                <SettingCard id="Social" title="Social Connectivity" icon={LinkIcon}>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CredentialInput label="Instagram Handle" value={settings.socialInstagram} onChange={v => handleUpdate('socialInstagram', v)} placeholder="@nordic" />
                      <CredentialInput label="TikTok Profile" value={settings.socialTikTok} onChange={v => handleUpdate('socialTikTok', v)} placeholder="@nordic_shop" />
                      <CredentialInput label="Facebook Page" value={settings.socialFacebook} onChange={v => handleUpdate('socialFacebook', v)} />
                      <CredentialInput label="Twitter / X" value={settings.socialTwitter} onChange={v => handleUpdate('socialTwitter', v)} />
                   </div>
                </SettingCard>
              </div>
            </motion.div>
          )}

          {activeCategory === 'navigation' && (
            <motion.div key="navigation" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
              <div className="grid grid-cols-1 gap-4">
                <SettingCard id="Navbar" title="Primary Navigation" icon={Layout}>
                  <div className="space-y-6">
                    {settings.navbarLinks?.map((link, idx) => (
                      <div key={idx} className="p-4 bg-zinc-50 border-none rounded-md relative group space-y-4">
                        <button onClick={() => handleUpdate('navbarLinks', settings.navbarLinks.filter((_, i) => i !== idx))} className="absolute top-2 right-2 p-1.5 text-zinc-300 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <LocalizedSettingInput 
                          label={`Link #${idx + 1} Label`} 
                          value={link.label} 
                          onChange={v => {
                            const newLinks = [...settings.navbarLinks];
                            newLinks[idx].label = v;
                            handleUpdate('navbarLinks', newLinks);
                          }}
                          languages={settings.languages}
                          onAITranslate={() => handleAITranslate(`navbarLinks.${idx}.label` as any, 'Link Label')}
                          onAIAutoComplete={() => handleAIAutoComplete(`navbarLinks.${idx}.label` as any, 'Link Label')}
                          isGenerating={generating}
                        />
                        <CredentialInput label="Destination URL" value={link.href} onChange={v => {
                             const newLinks = [...settings.navbarLinks];
                             newLinks[idx].href = v;
                             handleUpdate('navbarLinks', newLinks);
                        }} placeholder="/products, /about, etc." />
                      </div>
                    ))}
                    <button onClick={() => handleUpdate('navbarLinks', [...settings.navbarLinks, { label: { en: 'New Link' }, href: '#' }])} className="w-full py-3 border border-dashed border-zinc-200 rounded-md text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2">
                       <Plus className="w-3.5 h-3.5" /> Add Navbar Junction
                    </button>
                  </div>
                </SettingCard>

                <SettingCard id="Footer" title="Structural Footer" icon={AlignLeft}>
                   <div className="space-y-8">
                      {settings.footerSections?.map((section, sIdx) => (
                        <div key={sIdx} className="p-6 bg-zinc-50 rounded-md space-y-6 relative group">
                           <button onClick={() => handleUpdate('footerSections', settings.footerSections.filter((_, i) => i !== sIdx))} className="absolute top-4 right-4 text-zinc-300 hover:text-rose-600">
                             <Trash2 className="w-4 h-4" />
                           </button>
                           <LocalizedSettingInput 
                             label={`Section ${sIdx + 1} Title`} 
                             value={section.title} 
                             onChange={v => {
                               const newSections = [...settings.footerSections];
                               newSections[sIdx].title = v;
                               handleUpdate('footerSections', newSections);
                             }}
                             languages={settings.languages}
                             onAITranslate={() => handleAITranslate(`footerSections.${sIdx}.title` as any, 'Section Title')}
                             onAIAutoComplete={() => handleAIAutoComplete(`footerSections.${sIdx}.title` as any, 'Section Title')}
                             isGenerating={generating}
                           />
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {section.links.map((link, lIdx) => (
                                <div key={lIdx} className="p-4 bg-white border border-zinc-100 rounded-sm space-y-4 relative">
                                   <button onClick={() => {
                                      const newSections = [...settings.footerSections];
                                      newSections[sIdx].links = section.links.filter((_, i) => i !== lIdx);
                                      handleUpdate('footerSections', newSections);
                                   }} className="absolute top-1 right-1 text-zinc-200 hover:text-rose-600 transition-colors">&times;</button>
                                   <LocalizedSettingInput 
                                      label={`Link Label`} 
                                      value={link.label} 
                                      onChange={v => {
                                        const newSections = [...settings.footerSections];
                                        newSections[sIdx].links[lIdx].label = v;
                                        handleUpdate('footerSections', newSections);
                                      }}
                                      languages={settings.languages}
                                      onAITranslate={() => handleAITranslate(`footerSections.${sIdx}.links.${lIdx}.label` as any, 'Link Label')}
                                      onAIAutoComplete={() => handleAIAutoComplete(`footerSections.${sIdx}.links.${lIdx}.label` as any, 'Link Label')}
                                      isGenerating={generating}
                                   />
                                   <input type="text" value={link.href} onChange={e => {
                                      const newSections = [...settings.footerSections];
                                      newSections[sIdx].links[lIdx].href = e.target.value;
                                      handleUpdate('footerSections', newSections);
                                   }} className="w-full bg-white border border-zinc-200 px-3 py-1.5 text-[12px] font-medium rounded-sm" placeholder="URL" />
                                </div>
                              ))}
                              <button onClick={() => {
                                 const newSections = [...settings.footerSections];
                                 newSections[sIdx].links.push({ label: { en: 'New Link' }, href: '#' });
                                 handleUpdate('footerSections', newSections);
                              }} className="py-2 border border-dashed border-zinc-200 rounded-sm text-[10px] font-bold text-zinc-400 hover:text-zinc-900 flex items-center justify-center">
                                 <Plus className="w-3 h-3 mr-1" /> Add Link
                              </button>
                           </div>
                        </div>
                      ))}
                      <button onClick={() => handleUpdate('footerSections', [...settings.footerSections, { title: { en: 'New Section' }, links: [] }])} className="w-full py-3 border border-dashed border-zinc-200 rounded-md text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-all flex items-center justify-center gap-2">
                        <Plus className="w-3.5 h-3.5" /> Append Footer Column
                      </button>
                   </div>
                </SettingCard>
              </div>
            </motion.div>
          )}

          {activeCategory === 'homepage' && (
            <motion.div key="homepage" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
              <div className="grid grid-cols-1 gap-4">
                <SettingCard id="Featured" title="Featured Collection UI" icon={Sparkles}>
                   <LocalizedSettingInput label="Hero Title" value={settings.featuredTitle} onChange={v => handleUpdate('featuredTitle', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('featuredTitle', 'Hero Title')} onAIAutoComplete={() => handleAIAutoComplete('featuredTitle', 'Hero Title')} isGenerating={generating} />
                   <LocalizedSettingInput label="Top Subtitle" value={settings.featuredTopSubtitle} onChange={v => handleUpdate('featuredTopSubtitle', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('featuredTopSubtitle', 'Top Subtitle')} onAIAutoComplete={() => handleAIAutoComplete('featuredTopSubtitle', 'Top Subtitle')} isGenerating={generating} />
                   <LocalizedSettingInput label="Hero Description" value={settings.featuredSubtitle} onChange={v => handleUpdate('featuredSubtitle', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('featuredSubtitle', 'Hero Description')} onAIAutoComplete={() => handleAIAutoComplete('featuredSubtitle', 'Hero Description')} isGenerating={generating} />
                </SettingCard>

                <SettingCard id="Future" title="Future Product Preview" icon={Users}>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <div className="aspect-[4/5] bg-zinc-50 border border-zinc-100 rounded-md relative group overflow-hidden">
                           {settings.futureImage1 ? (
                              <img src={settings.futureImage1} alt="Future product preview 1" className="w-full h-full object-cover" />
                           ) : <ImageIcon className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-200" />}
                           <input type="file" onChange={e => handleImageUpload(e, 'futureImage1')} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <LocalizedSettingInput label="Product 1 Title" value={settings.futureProduct1Title} onChange={v => handleUpdate('futureProduct1Title', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('futureProduct1Title', 'Product 1 Title')} onAIAutoComplete={() => handleAIAutoComplete('futureProduct1Title', 'Product 1 Title')} isGenerating={generating} />
                        <LocalizedSettingInput label="Availability Date" value={settings.futureProduct1Date} onChange={v => handleUpdate('futureProduct1Date', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('futureProduct1Date', 'Availability Date')} onAIAutoComplete={() => handleAIAutoComplete('futureProduct1Date', 'Availability Date')} isGenerating={generating} />
                     </div>
                     <div className="space-y-4">
                        <div className="aspect-[4/5] bg-zinc-50 border border-zinc-100 rounded-md relative group overflow-hidden">
                           {settings.futureImage2 ? (
                              <img src={settings.futureImage2} alt="Future product preview 2" className="w-full h-full object-cover" />
                           ) : <ImageIcon className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-200" />}
                           <input type="file" onChange={e => handleImageUpload(e, 'futureImage2')} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <LocalizedSettingInput label="Product 2 Title" value={settings.futureProduct2Title} onChange={v => handleUpdate('futureProduct2Title', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('futureProduct2Title', 'Product 2 Title')} onAIAutoComplete={() => handleAIAutoComplete('futureProduct2Title', 'Product 2 Title')} isGenerating={generating} />
                        <LocalizedSettingInput label="Availability Date" value={settings.futureProduct2Date} onChange={v => handleUpdate('futureProduct2Date', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('futureProduct2Date', 'Availability Date')} onAIAutoComplete={() => handleAIAutoComplete('futureProduct2Date', 'Availability Date')} isGenerating={generating} />
                     </div>
                   </div>
                </SettingCard>
              </div>
            </motion.div>
          )}

          {activeCategory === 'labels' && (
            <motion.div key="labels" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
              <div className="grid grid-cols-1 gap-4">
                <SettingCard id="LabelsCore" title="Core UI Labels" icon={AlignLeft}>
                   <div className="grid grid-cols-1 gap-8">
                      <LocalizedSettingInput label="Shop Now Button" value={settings.shopNowText} onChange={v => handleUpdate('shopNowText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('shopNowText', 'Shop Now Button')} onAIAutoComplete={() => handleAIAutoComplete('shopNowText', 'Shop Now Button')} isGenerating={generating} />
                      <LocalizedSettingInput label="View Detail Labels" value={settings.viewDetailsText} onChange={v => handleUpdate('viewDetailsText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('viewDetailsText', 'View Detail Labels')} onAIAutoComplete={() => handleAIAutoComplete('viewDetailsText', 'View Detail Labels')} isGenerating={generating} />
                      <LocalizedSettingInput label="Add To Cart Button" value={settings.addToCartButtonText} onChange={v => handleUpdate('addToCartButtonText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('addToCartButtonText', 'Add To Cart Button')} onAIAutoComplete={() => handleAIAutoComplete('addToCartButtonText', 'Add To Cart Button')} isGenerating={generating} />
                      <LocalizedSettingInput label="In Stock Indicator" value={settings.inStockText} onChange={v => handleUpdate('inStockText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('inStockText', 'In Stock Indicator')} onAIAutoComplete={() => handleAIAutoComplete('inStockText', 'In Stock Indicator')} isGenerating={generating} />
                      <LocalizedSettingInput label="Out of Stock Indicator" value={settings.outOfStockText} onChange={v => handleUpdate('outOfStockText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('outOfStockText', 'Out of Stock Indicator')} onAIAutoComplete={() => handleAIAutoComplete('outOfStockText', 'Out of Stock Indicator')} isGenerating={generating} />
                   </div>
                </SettingCard>
                <SettingCard id="LabelsSearch" title="Search Experience Labels" icon={Globe}>
                   <div className="grid grid-cols-1 gap-8">
                      <LocalizedSettingInput label="Search Placeholder" value={settings.searchPlaceholder} onChange={v => handleUpdate('searchPlaceholder', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('searchPlaceholder', 'Search Placeholder')} onAIAutoComplete={() => handleAIAutoComplete('searchPlaceholder', 'Search Placeholder')} isGenerating={generating} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <LocalizedSettingInput label="Discover Collections Heading" value={settings.searchDiscoverCollectionsText} onChange={v => handleUpdate('searchDiscoverCollectionsText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('searchDiscoverCollectionsText', 'Discover Collections Heading')} onAIAutoComplete={() => handleAIAutoComplete('searchDiscoverCollectionsText', 'Discover Collections Heading')} isGenerating={generating} />
                        <LocalizedSettingInput label="Collections Results Heading" value={settings.searchCollectionsResultsText} onChange={v => handleUpdate('searchCollectionsResultsText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('searchCollectionsResultsText', 'Collections Results Heading')} onAIAutoComplete={() => handleAIAutoComplete('searchCollectionsResultsText', 'Collections Results Heading')} isGenerating={generating} />
                        <LocalizedSettingInput label="Products Results Heading" value={settings.searchProductsResultsText} onChange={v => handleUpdate('searchProductsResultsText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('searchProductsResultsText', 'Products Results Heading')} onAIAutoComplete={() => handleAIAutoComplete('searchProductsResultsText', 'Products Results Heading')} isGenerating={generating} />
                        <LocalizedSettingInput label="View All Results Label" value={settings.viewAllResultsText} onChange={v => handleUpdate('viewAllResultsText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('viewAllResultsText', 'View All Results Label')} onAIAutoComplete={() => handleAIAutoComplete('viewAllResultsText', 'View All Results Label')} isGenerating={generating} />
                      </div>
                      <LocalizedSettingInput label="No Search Results Message" value={settings.searchNoProductsResultsText} onChange={v => handleUpdate('searchNoProductsResultsText', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('searchNoProductsResultsText', 'No Search Results Message')} onAIAutoComplete={() => handleAIAutoComplete('searchNoProductsResultsText', 'No Search Results Message')} isGenerating={generating} />
                   </div>
                </SettingCard>
                <SettingCard id="LabelsCheckout" title="Checkout & Cart UX" icon={ShoppingCart}>
                   <div className="grid grid-cols-1 gap-8">
                      <LocalizedSettingInput label="Cart Header" value={settings.cartTitle} onChange={v => handleUpdate('cartTitle', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('cartTitle', 'Cart Header')} onAIAutoComplete={() => handleAIAutoComplete('cartTitle', 'Cart Header')} isGenerating={generating} />
                      <LocalizedSettingInput label="Empty Cart Message" value={settings.cartEmptyMessage} onChange={v => handleUpdate('cartEmptyMessage', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('cartEmptyMessage', 'Empty Cart Message')} onAIAutoComplete={() => handleAIAutoComplete('cartEmptyMessage', 'Empty Cart Message')} isGenerating={generating} />
                      <LocalizedSettingInput label="Order Summary Title" value={settings.orderSummaryText} onChange={v => handleUpdate('orderSummaryText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('orderSummaryText', 'Order Summary Title')} onAIAutoComplete={() => handleAIAutoComplete('orderSummaryText', 'Order Summary Title')} isGenerating={generating} />
                      <LocalizedSettingInput label="Checkout Button" value={settings.checkoutButtonText} onChange={v => handleUpdate('checkoutButtonText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('checkoutButtonText', 'Checkout Button')} onAIAutoComplete={() => handleAIAutoComplete('checkoutButtonText', 'Checkout Button')} isGenerating={generating} />
                   </div>
                </SettingCard>

                <SettingCard id="LabelsInventory" title="Product & Inventory Labels" icon={Package}>
                   <div className="grid grid-cols-1 gap-8">
                      <LocalizedSettingInput label="Pricing & Inventory Header" value={settings.inventoryTitleText} onChange={v => handleUpdate('inventoryTitleText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('inventoryTitleText', 'Inventory Title')} onAIAutoComplete={() => handleAIAutoComplete('inventoryTitleText', 'Inventory Title')} isGenerating={generating} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <LocalizedSettingInput label="Regular Price Label" value={settings.regularPriceText} onChange={v => handleUpdate('regularPriceText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('regularPriceText', 'Regular Price')} onAIAutoComplete={() => handleAIAutoComplete('regularPriceText', 'Regular Price')} isGenerating={generating} />
                        <LocalizedSettingInput label="Sale Price Label" value={settings.salePriceText} onChange={v => handleUpdate('salePriceText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('salePriceText', 'Sale Price')} onAIAutoComplete={() => handleAIAutoComplete('salePriceText', 'Sale Price')} isGenerating={generating} />
                        <LocalizedSettingInput label="SKU Code Label" value={settings.skuCodeText} onChange={v => handleUpdate('skuCodeText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('skuCodeText', 'SKU Code')} onAIAutoComplete={() => handleAIAutoComplete('skuCodeText', 'SKU Code')} isGenerating={generating} />
                        <LocalizedSettingInput label="Initial Stock Label" value={settings.initialStockText} onChange={v => handleUpdate('initialStockText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('initialStockText', 'Initial Stock')} onAIAutoComplete={() => handleAIAutoComplete('initialStockText', 'Initial Stock')} isGenerating={generating} />
                        <LocalizedSettingInput label="Weight Label" value={settings.weightKgText} onChange={v => handleUpdate('weightKgText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('weightKgText', 'Weight Label')} onAIAutoComplete={() => handleAIAutoComplete('weightKgText', 'Weight Label')} isGenerating={generating} />
                        <LocalizedSettingInput label="Shipping Class Label" value={settings.shippingClassText} onChange={v => handleUpdate('shippingClassText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('shippingClassText', 'Shipping Class')} onAIAutoComplete={() => handleAIAutoComplete('shippingClassText', 'Shipping Class')} isGenerating={generating} />
                      </div>
                   </div>
                </SettingCard>

                <SettingCard id="PrivacyConsent" title="Privacy, Consent & Auth" icon={FileCode}>
                  <div className="space-y-8">
                    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                      <label className="flex items-start justify-between gap-6">
                        <div className="space-y-1">
                          <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Google OAuth Button</p>
                          <p className="text-[12px] text-zinc-500">
                            Only enable this after Google provider is fully configured in Supabase Auth.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.googleAuthEnabled}
                          onChange={(event) => handleUpdate('googleAuthEnabled', event.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                        />
                      </label>
                    </div>

                    <LocalizedSettingInput label="Google Login Unavailable Message" value={settings.googleLoginUnavailableText} onChange={v => handleUpdate('googleLoginUnavailableText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('googleLoginUnavailableText', 'Google Login Unavailable Message')} isGenerating={generating} />
                    <LocalizedSettingInput label="Cookie Preferences Footer Button" value={settings.cookiePreferencesButtonText} onChange={v => handleUpdate('cookiePreferencesButtonText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('cookiePreferencesButtonText', 'Cookie Preferences Footer Button')} isGenerating={generating} />
                    <LocalizedSettingInput label="Unsubscribe Footer Link" value={settings.unsubscribeLinkText} onChange={v => handleUpdate('unsubscribeLinkText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('unsubscribeLinkText', 'Unsubscribe Footer Link')} isGenerating={generating} />
                    <LocalizedSettingInput label="Sign Up Terms Consent Prefix" value={settings.signUpTermsConsentText} onChange={v => handleUpdate('signUpTermsConsentText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('signUpTermsConsentText', 'Sign Up Terms Consent Prefix')} isGenerating={generating} />
                    <LocalizedSettingInput label="Sign Up Privacy Consent Prefix" value={settings.signUpPrivacyConsentText} onChange={v => handleUpdate('signUpPrivacyConsentText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('signUpPrivacyConsentText', 'Sign Up Privacy Consent Prefix')} isGenerating={generating} />
                    <LocalizedSettingInput label="Sign Up Marketing Consent Text" value={settings.signUpMarketingConsentText} onChange={v => handleUpdate('signUpMarketingConsentText', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('signUpMarketingConsentText', 'Sign Up Marketing Consent Text')} isGenerating={generating} />

                    <LocalizedSettingInput label="Consent Banner Eyebrow" value={settings.consentBannerEyebrowText} onChange={v => handleUpdate('consentBannerEyebrowText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentBannerEyebrowText', 'Consent Banner Eyebrow')} isGenerating={generating} />
                    <LocalizedSettingInput label="Consent Banner Title" value={settings.consentBannerTitleText} onChange={v => handleUpdate('consentBannerTitleText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentBannerTitleText', 'Consent Banner Title')} isGenerating={generating} />
                    <LocalizedSettingInput label="Consent Banner Description" value={settings.consentBannerDescriptionText} onChange={v => handleUpdate('consentBannerDescriptionText', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('consentBannerDescriptionText', 'Consent Banner Description')} isGenerating={generating} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <LocalizedSettingInput label="Consent Privacy Link Label" value={settings.consentPrivacyLinkText} onChange={v => handleUpdate('consentPrivacyLinkText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentPrivacyLinkText', 'Consent Privacy Link Label')} isGenerating={generating} />
                      <LocalizedSettingInput label="Consent Cookie Link Label" value={settings.consentCookieLinkText} onChange={v => handleUpdate('consentCookieLinkText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentCookieLinkText', 'Consent Cookie Link Label')} isGenerating={generating} />
                      <LocalizedSettingInput label="Consent Choose Settings Label" value={settings.consentChooseSettingsText} onChange={v => handleUpdate('consentChooseSettingsText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentChooseSettingsText', 'Consent Choose Settings Label')} isGenerating={generating} />
                      <LocalizedSettingInput label="Consent Accept All Label" value={settings.consentAcceptAllText} onChange={v => handleUpdate('consentAcceptAllText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentAcceptAllText', 'Consent Accept All Label')} isGenerating={generating} />
                      <LocalizedSettingInput label="Consent Essential Only Label" value={settings.consentEssentialOnlyText} onChange={v => handleUpdate('consentEssentialOnlyText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentEssentialOnlyText', 'Consent Essential Only Label')} isGenerating={generating} />
                      <LocalizedSettingInput label="Consent Modal Eyebrow" value={settings.consentModalEyebrowText} onChange={v => handleUpdate('consentModalEyebrowText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentModalEyebrowText', 'Consent Modal Eyebrow')} isGenerating={generating} />
                      <LocalizedSettingInput label="Consent Modal Title" value={settings.consentModalTitleText} onChange={v => handleUpdate('consentModalTitleText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentModalTitleText', 'Consent Modal Title')} isGenerating={generating} />
                      <LocalizedSettingInput label="Consent Close Label" value={settings.consentCloseText} onChange={v => handleUpdate('consentCloseText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentCloseText', 'Consent Close Label')} isGenerating={generating} />
                      <LocalizedSettingInput label="Consent Essential Title" value={settings.consentEssentialTitleText} onChange={v => handleUpdate('consentEssentialTitleText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentEssentialTitleText', 'Consent Essential Title')} isGenerating={generating} />
                      <LocalizedSettingInput label="Consent Always On Label" value={settings.consentAlwaysOnText} onChange={v => handleUpdate('consentAlwaysOnText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentAlwaysOnText', 'Consent Always On Label')} isGenerating={generating} />
                      <LocalizedSettingInput label="Consent Analytics Title" value={settings.consentAnalyticsTitleText} onChange={v => handleUpdate('consentAnalyticsTitleText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentAnalyticsTitleText', 'Consent Analytics Title')} isGenerating={generating} />
                      <LocalizedSettingInput label="Consent Marketing Title" value={settings.consentMarketingTitleText} onChange={v => handleUpdate('consentMarketingTitleText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentMarketingTitleText', 'Consent Marketing Title')} isGenerating={generating} />
                      <LocalizedSettingInput label="Consent Save Preferences Label" value={settings.consentSavePreferencesText} onChange={v => handleUpdate('consentSavePreferencesText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentSavePreferencesText', 'Consent Save Preferences Label')} isGenerating={generating} />
                      <LocalizedSettingInput label="Consent Reject Optional Label" value={settings.consentRejectOptionalText} onChange={v => handleUpdate('consentRejectOptionalText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentRejectOptionalText', 'Consent Reject Optional Label')} isGenerating={generating} />
                    </div>
                    <LocalizedSettingInput label="Consent Essential Description" value={settings.consentEssentialDescriptionText} onChange={v => handleUpdate('consentEssentialDescriptionText', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('consentEssentialDescriptionText', 'Consent Essential Description')} isGenerating={generating} />
                    <LocalizedSettingInput label="Consent Analytics Description" value={settings.consentAnalyticsDescriptionText} onChange={v => handleUpdate('consentAnalyticsDescriptionText', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('consentAnalyticsDescriptionText', 'Consent Analytics Description')} isGenerating={generating} />
                    <LocalizedSettingInput label="Consent Marketing Description" value={settings.consentMarketingDescriptionText} onChange={v => handleUpdate('consentMarketingDescriptionText', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('consentMarketingDescriptionText', 'Consent Marketing Description')} isGenerating={generating} />
                  </div>
                </SettingCard>

                <SettingCard id="PolicyPages" title="Policy Pages" icon={Mail}>
                  <div className="space-y-8">
                    <LocalizedSettingInput label="Privacy Policy Page Title" value={settings.privacyPolicyPageTitle} onChange={v => handleUpdate('privacyPolicyPageTitle', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('privacyPolicyPageTitle', 'Privacy Policy Page Title')} isGenerating={generating} />
                    <LocalizedSettingInput label="Privacy Policy Page Content (Markdown)" value={settings.privacyPolicyPageContent} onChange={v => handleUpdate('privacyPolicyPageContent', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('privacyPolicyPageContent', 'Privacy Policy Page Content')} isGenerating={generating} />
                    <LocalizedSettingInput label="Cookie Policy Page Title" value={settings.cookiePolicyPageTitle} onChange={v => handleUpdate('cookiePolicyPageTitle', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('cookiePolicyPageTitle', 'Cookie Policy Page Title')} isGenerating={generating} />
                    <LocalizedSettingInput label="Cookie Policy Page Content (Markdown)" value={settings.cookiePolicyPageContent} onChange={v => handleUpdate('cookiePolicyPageContent', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('cookiePolicyPageContent', 'Cookie Policy Page Content')} isGenerating={generating} />
                    <LocalizedSettingInput label="Terms Page Title" value={settings.termsOfServicePageTitle} onChange={v => handleUpdate('termsOfServicePageTitle', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('termsOfServicePageTitle', 'Terms Page Title')} isGenerating={generating} />
                    <LocalizedSettingInput label="Terms Page Content (Markdown)" value={settings.termsOfServicePageContent} onChange={v => handleUpdate('termsOfServicePageContent', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('termsOfServicePageContent', 'Terms Page Content')} isGenerating={generating} />
                  </div>
                </SettingCard>
              </div>
            </motion.div>
          )}

          {activeCategory === 'multilang' && (
            <motion.div key="multilang" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
               <div className="grid grid-cols-1 gap-4">
                  <SettingCard id="Languages" title="Active Markets & Languages" icon={Languages} defaultExpanded>
                     <div className="space-y-6">
                        <div className="flex flex-wrap gap-2">
                           {settings.languages.map(lang => (
                             <div key={lang} className="flex items-center gap-2 px-3 py-1 bg-zinc-900 text-white rounded text-[11px] font-bold uppercase tracking-widest">
                               {lang}
                               {lang !== 'en' && (
                                 <button onClick={() => handleUpdate('languages', settings.languages.filter(l => l !== lang))} className="text-zinc-400 hover:text-white transition-colors">&times;</button>
                               )}
                             </div>
                           ))}
                        </div>
                        <div className="flex items-center gap-3">
                           <input 
                              type="text" 
                              placeholder="Add lang (e.g. fr, de)" 
                              className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-sm text-[13px] font-medium focus:ring-1 focus:ring-zinc-900 focus:outline-none placeholder:text-zinc-300"
                              onKeyDown={(e) => {
                                 if (e.key === 'Enter') {
                                    const val = (e.target as HTMLInputElement).value.trim().toLowerCase();
                                    if (val && !settings.languages.includes(val)) {
                                       handleUpdate('languages', [...settings.languages, val]);
                                       (e.target as HTMLInputElement).value = '';
                                    }
                                 }
                              }}
                           />
                           <p className="text-[11px] text-zinc-400 font-medium italic">Press Enter to synchronize new locale</p>
                        </div>
                     </div>
                  </SettingCard>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trust Message - Flat Design */}
      <div className="flex items-center gap-3 p-4 bg-zinc-50 border-none rounded-md mt-4">
         <div className="p-2 bg-white border border-zinc-100 rounded-md">
            <Globe className="w-5 h-5 text-indigo-600" />
         </div>
         <div className="flex-1">
            <p className="text-[11px] font-bold text-zinc-900 uppercase tracking-widest leading-none">Global Synchronization</p>
            <p className="text-[11px] text-zinc-500 font-medium mt-1">Updates to these settings are pushed in real-time to the public storefront Neural Cache. Languages are synced across all active market segments.</p>
         </div>
      </div>
    </div>
  );
}
