"use client";

import React, { useState, useEffect, useTransition, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, Layout, ImageIcon, AlignLeft, Info, Save, 
  Loader2, Sparkles, Upload, Mail, FileCode, Users, 
  ShoppingBag, ShoppingCart, Languages, LinkIcon, Plus, Trash2, Package, Layers, Clock, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminHeader } from '../AdminHeader';
import { SettingCard } from './SettingCard';
import { LocalizedSettingInput } from './LocalizedSettingInput';
import { CredentialInput } from '../integrations/CredentialInput';
import { StorefrontSettings as StorefrontSettingsType, LocalizedString, useSettingsStore } from '@/store/useSettingsStore';
import { updateSettingsAction } from '@/app/actions/storefront';
import { genAI } from '@/lib/ai';
import { extractFirstJsonObject } from '@/lib/json';
import Image from 'next/image';
import { toMediaProxyUrl } from '@/lib/media';
import { isValidUrl } from '@/lib/utils';
import { SearchableSelect } from '@/components/SearchableSelect';
import { createClient } from '@/utils/supabase/client';
import { Category } from '@/types';
import { logger } from '@/lib/logger';
import { getAIErrorMessage, isTransientAIError } from '@/lib/ai-errors';

const CATEGORIES = [
  { id: 'branding', name: 'Identity & Brand', icon: Sparkles, color: 'text-zinc-900', bg: 'bg-zinc-50' },
  { id: 'navigation', name: 'Layout & Links', icon: Layout, color: 'text-zinc-900', bg: 'bg-zinc-50' },
  { id: 'homepage', name: 'Live Display', icon: ImageIcon, color: 'text-zinc-900', bg: 'bg-zinc-50' },
  { id: 'labels', name: 'System Labels', icon: AlignLeft, color: 'text-zinc-900', bg: 'bg-zinc-50' },
  { id: 'multilang', name: 'Globalization', icon: Languages, color: 'text-zinc-900', bg: 'bg-zinc-50' },
];

const SHIPPING_COUNTRY_PRESETS: Array<{ code: string; name: LocalizedString }> = [
  { code: 'SE', name: { en: 'Sweden', sv: 'Sverige', fi: 'Ruotsi', da: 'Sverige', de: 'Schweden' } },
  { code: 'NO', name: { en: 'Norway', sv: 'Norge', fi: 'Norja', da: 'Norge', de: 'Norwegen' } },
  { code: 'DK', name: { en: 'Denmark', sv: 'Danmark', fi: 'Tanska', da: 'Danmark', de: 'Dänemark' } },
  { code: 'FI', name: { en: 'Finland', sv: 'Finland', fi: 'Suomi', da: 'Finland', de: 'Finnland' } },
  { code: 'DE', name: { en: 'Germany', sv: 'Tyskland', fi: 'Saksa', da: 'Tyskland', de: 'Deutschland' } },
  { code: 'NL', name: { en: 'Netherlands', sv: 'Nederländerna', fi: 'Alankomaat', da: 'Nederlandene', de: 'Niederlande' } },
  { code: 'BE', name: { en: 'Belgium', sv: 'Belgien', fi: 'Belgia', da: 'Belgien', de: 'Belgien' } },
  { code: 'FR', name: { en: 'France', sv: 'Frankrike', fi: 'Ranska', da: 'Frankrig', de: 'Frankreich' } },
  { code: 'ES', name: { en: 'Spain', sv: 'Spanien', fi: 'Espanja', da: 'Spanien', de: 'Spanien' } },
  { code: 'IT', name: { en: 'Italy', sv: 'Italien', fi: 'Italia', da: 'Italien', de: 'Italien' } },
  { code: 'AT', name: { en: 'Austria', sv: 'Österrike', fi: 'Itävalta', da: 'Østrig', de: 'Österreich' } },
  { code: 'CH', name: { en: 'Switzerland', sv: 'Schweiz', fi: 'Sveitsi', da: 'Schweiz', de: 'Schweiz' } },
  { code: 'GB', name: { en: 'United Kingdom', sv: 'Storbritannien', fi: 'Yhdistynyt kuningaskunta', da: 'Storbritannien', de: 'Vereinigtes Königreich' } },
  { code: 'IE', name: { en: 'Ireland', sv: 'Irland', fi: 'Irlanti', da: 'Irland', de: 'Irland' } },
  { code: 'PL', name: { en: 'Poland', sv: 'Polen', fi: 'Puola', da: 'Polen', de: 'Polen' } },
  { code: 'PT', name: { en: 'Portugal', sv: 'Portugal', fi: 'Portugali', da: 'Portugal', de: 'Portugal' } },
  { code: 'US', name: { en: 'United States', sv: 'USA', fi: 'Yhdysvallat', da: 'USA', de: 'Vereinigte Staaten' } },
  { code: 'CA', name: { en: 'Canada', sv: 'Kanada', fi: 'Kanada', da: 'Canada', de: 'Kanada' } },
];

function buildShippingCountryEntry(input: string, languages: string[]) {
  const normalized = input.trim();
  if (!normalized) {
    return null;
  }

  const lower = normalized.toLowerCase();
  const preset = SHIPPING_COUNTRY_PRESETS.find((country) =>
    country.code.toLowerCase() === lower ||
    Object.values(country.name).some((label) => label.toLowerCase() === lower)
  );

  if (preset) {
    const localizedName = languages.reduce<LocalizedString>((acc, lang) => {
      acc[lang] = preset.name[lang] || preset.name.en || normalized;
      return acc;
    }, {});

    return {
      code: preset.code,
      name: localizedName,
    };
  }

  const code = normalized.length === 2 ? normalized.toUpperCase() : normalized.slice(0, 2).toUpperCase();
  const fallbackName = languages.reduce<LocalizedString>((acc, lang) => {
    acc[lang] = normalized;
    return acc;
  }, {});

  return {
    code,
    name: fallbackName,
  };
}

export function StorefrontContainer() {
  const initialSettings = useSettingsStore((state) => state.settings);
  const setStoreSettings = useSettingsStore((state) => state.setSettings);
  const settingsLoaded = useSettingsStore((state) => state.settingsLoaded);
  const setSettingsLoaded = useSettingsStore((state) => state.setSettingsLoaded);
  const [settings, setSettings] = useState<StorefrontSettingsType>(initialSettings);
  const [activeCategory, setActiveCategory] = useState('branding');
  const [isPending, startTransition] = useTransition();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [supabase] = useState(() => createClient());
  const [shippingCountryDraft, setShippingCountryDraft] = useState('');

  const shippingCountrySuggestions = useMemo(
    () => SHIPPING_COUNTRY_PRESETS.map((country) => `${country.name.en} (${country.code})`),
    [],
  );

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (data && !error) {
        setCategories(data.map(c => ({
          ...c,
          parentId: c.parent_id,
          imageUrl: c.image_url,
          iconUrl: c.icon_url,
          isFeatured: c.is_featured,
          showInHero: c.show_in_hero,
          pinnedInSearch: c.pinned_in_search
        })));
      }
    }
    fetchCategories();
  }, [supabase]);

  // Hydrate local state from store when settings are loaded
  useEffect(() => {
    if (settingsLoaded && !hasHydrated) {
      setSettings(initialSettings);
      setHasHydrated(true);
    }
  }, [initialSettings, settingsLoaded, hasHydrated]);

  const handleUpdate = (path: string, value: string | string[] | LocalizedString | boolean | Record<string, unknown> | unknown[]) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings as Record<string, unknown>;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]] as Record<string, unknown>;
      }
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof StorefrontSettingsType) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(field as string);
    const toastId = toast.loading('Synchronizing asset to cloud...');
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('path', `storefront/${Date.now()}_${file.name}`);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      });

      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();

      handleUpdate(field as string, url);
      toast.success('Asset synchronized', { id: toastId });
    } catch (error: unknown) {
      const err = error as Error;
      toast.error('Sync failed: ' + err.message, { id: toastId });
    } finally {
      setUploadingImage(null);
    }
  };

  /**
   * Core AI translation for any LocalizedString value.
   * Returns the merged LocalizedString or null on failure.
   */
  const translateLocalizedString = useCallback(async (
    sourceValue: LocalizedString,
    label: string,
    toastId: string | number
  ): Promise<LocalizedString | null> => {
    const targetLangs = settings.languages.filter(l => l !== 'en');
    if (targetLangs.length === 0) {
      toast.info('No extra languages configured.', { id: toastId });
      return null;
    }
    const sourceText = sourceValue.en;
    if (!sourceText) {
      toast.error('Source text (EN) required for translation.', { id: toastId });
      return null;
    }

    // Capture the current state of the field before AI call to ensure we don't lose user edits made during the wait
    const currentFieldState = { ...sourceValue };

    // Standardize language codes for AI (e.g. CH -> zh)
    const LANGUAGE_ALIASES: Record<string, string> = {
      'ch': 'zh',
      'cn': 'zh',
      'jp': 'ja',
      'kr': 'ko',
      'de': 'de', // Standard
    };

    const aiTargetLangs = targetLangs.map(l => {
      const normalized = l.toLowerCase();
      return LANGUAGE_ALIASES[normalized] || normalized;
    });

    const prompt = `Translate the following text into these languages: ${aiTargetLangs.join(', ')}.
Text Purpose: ${label} for a premium e-commerce store.
Return ONLY a valid raw JSON object. No conversational text, no markdown backticks.
Schema: Each key should be the exact ISO 639-1 code from the list above.

Example: { "de": "German text", "zh": "Chinese text" }

Text to translate: "${sourceText}"`;

    try {
      const model = genAI.getGenerativeModel({
        promptProfile: 'storefront',
        generationConfig: { temperature: 0.1 }
      });

      const aiResponse = await model.generateContent(prompt);
      let rawText = aiResponse.response.text() || '{}';
      
      // Robust Cleaning: Remove markdown blocks if AI ignored "raw" instruction
      if (rawText.includes('```')) {
        rawText = rawText.split('```')[1]?.replace(/^[a-z]+/, '') || rawText.replace(/```/g, '');
      }

      // Robust JSON extraction & Repair
      let parsed: Record<string, string> = {};
      try {
        const jsonStr = extractFirstJsonObject(rawText.trim()) || rawText.trim();
        parsed = JSON.parse(jsonStr);
      } catch (e) {
        logger.warn('[AI] JSON Parse failed, attempting fallback regex extraction.', e);
        // Fallback: Manually extract any "key": "value" pairs that look like languages
        targetLangs.forEach(lang => {
          const aiCode = LANGUAGE_ALIASES[lang.toLowerCase()] || lang.toLowerCase();
          const regex = new RegExp(`"${aiCode}"\\s*:\\s*"([^"]+)"`, 'i');
          const match = rawText.match(regex);
          if (match && match[1]) parsed[lang] = match[1];
        });
      }

      // Fuzzy Mapping & Validation
      const validated: Record<string, string> = { en: sourceText };
      targetLangs.forEach(originalCode => {
        const aiCode = LANGUAGE_ALIASES[originalCode.toLowerCase()] || originalCode.toLowerCase();
        
        // 1. Precise match on AI code
        if (parsed[aiCode]) {
          validated[originalCode] = parsed[aiCode];
        } 
        // 2. Precise match on original code
        else if (parsed[originalCode]) {
          validated[originalCode] = parsed[originalCode];
        }
        // 3. Case-insensitive fuzzy match
        else {
          const foundKey = Object.keys(parsed).find(k => 
            k.toLowerCase() === originalCode.toLowerCase() || 
            k.toLowerCase() === aiCode.toLowerCase()
          );
          if (foundKey) validated[originalCode] = parsed[foundKey];
        }
      });

      return { ...currentFieldState, ...validated };
    } catch (error) {
      if (isTransientAIError(error)) {
        logger.warn('[AI] translateLocalizedString temporary provider failure:', error);
      } else {
        logger.error('[AI] translateLocalizedString failed:', error);
      }
      throw error;
    }
  }, [settings.languages, genAI, settingsLoaded]);

  const handleAIAutoComplete = async (field: keyof StorefrontSettingsType, label: string) => {
    const actionId = `${field}-fill`;
    // handleAIAutoComplete logic
    setGeneratingId(actionId);
    const toastId = toast.loading(`Generating ${label}...`);
    try {
      const prompt = `Generate a creative and professional ${label} for a premium minimalist e-commerce store named "${settings.storeName?.en || 'Nordic'}". Return ONLY the text content, no quotes or formatting.`;
      const model = genAI.getGenerativeModel({ promptProfile: 'storefront' });
      const aiResponse = await model.generateContent(prompt);
      const text = aiResponse.response.text()?.trim() || '';
      
      if (!text) {
        toast.error('AI returned empty content.', { id: toastId });
        return;
      }
      
      // Write English value only for Auto-Fill (isolation)
      const currentValue = (settings[field] as LocalizedString) || {};
      const updatedValue: LocalizedString = { ...currentValue, en: text };
      handleUpdate(field as string, updatedValue);
      
      toast.success(`${label} generated (English)`, { id: toastId });
    } catch (error) {
      if (isTransientAIError(error)) {
        logger.warn('[AI] Auto-Fill temporary provider failure:', error);
      } else {
        logger.error('[AI] Auto-Fill failed:', error);
      }
      toast.error(getAIErrorMessage(error, 'AI generation failed'), { id: toastId });
    } finally {
      setGeneratingId(null);
    }
  };

  const handleAITranslate = async (field: keyof StorefrontSettingsType, label: string) => {
    const actionId = `${field}-translate`;
    // handleAITranslate logic
    const value = (settings[field] as LocalizedString) || {};
    
    if (!value.en) {
      toast.error('Explicit source text (EN) required before translation.');
      return;
    }

    setGeneratingId(actionId);
    const toastId = toast.loading(`Translating ${label} to all active languages...`);
    try {
      const translated = await translateLocalizedString(value, label, toastId);
      if (translated) {
        handleUpdate(field as string, translated);
        toast.success(`${label} localized for all configured markets`, { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    } catch (error) {
      if (isTransientAIError(error)) {
        logger.warn('[AI] Translation temporary provider failure:', error);
      } else {
        logger.error('[AI] Translation failed:', error);
      }
      toast.error(getAIErrorMessage(error, 'Localization failed'), { id: toastId });
    } finally {
      setGeneratingId(null);
    }
  };

  /**
   * Item-level translation for navbarLinks and footerSections.
   * Translates a specific LocalizedString value and writes it back via callback.
   */
  const handleItemTranslate = async (
    value: LocalizedString,
    label: string,
    onTranslated: (result: LocalizedString) => void,
    fieldId?: string
  ) => {
    const actionId = fieldId ? `${fieldId}-translate` : `${label}-translate`;
    if (!value.en) {
      toast.error('Source text (EN) required for translation.');
      return;
    }
    setGeneratingId(actionId);
    const toastId = toast.loading(`Translating ${label}...`);
    try {
      const translated = await translateLocalizedString(value, label, toastId);
      if (translated) {
        onTranslated(translated);
        toast.success(`${label} translations synchronized`, { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    } catch (error) {
      toast.error(getAIErrorMessage(error, 'Translation failed'), { id: toastId });
    } finally {
      setGeneratingId(null);
    }
  };

  const handleSave = async () => {
    startTransition(async () => {
      const toastId = toast.loading('Synchronizing store configuration...');
      const result = await updateSettingsAction(settings);

      if (result.success) {
        setStoreSettings(settings);
        setSettingsLoaded(true);
        toast.success(result.message, { id: toastId });
        return;
      }

      toast.error(result.message, { id: toastId });
    });
  };

  if (!settingsLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-zinc-900 animate-spin" />
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest animate-pulse">
          Hydrating Neural Storefront...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      <AdminHeader 
        title="Storefront Settings"
        description="Configure your brand visual identity and structural navigation."
        primaryAction={{
          label: isPending ? "Syncing..." : "Publish Config",
          icon: isPending ? Loader2 : Save,
          onClick: handleSave,
          disabled: !settingsLoaded
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
            className={`flex items-center gap-2 px-4 py-2 text-sm font-black transition-all whitespace-nowrap rounded-md uppercase tracking-widest ${activeCategory === cat.id ? `${cat.bg} text-zinc-900 border border-zinc-200/50` : 'text-zinc-500 hover:bg-zinc-100'}`}
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
                      {isValidUrl(settings.logoImage) ? (
                        <Image src={toMediaProxyUrl(settings.logoImage)} alt="Logo" fill sizes="128px" className="object-contain p-2" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-zinc-200" />
                      )}
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoImage')} className="absolute inset-0 opacity-0 cursor-pointer" title="Update Logo" />
                      <div className="absolute inset-0 bg-zinc-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <Upload className="w-6 h-6 text-zinc-500" />
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
                        isGenerating={generatingId === 'storeName-fill'}
                        isTranslating={generatingId === 'storeName-translate'}
                      />
                      <CredentialInput 
                        label="Logo Asset URL" 
                        value={settings.logoImage} 
                        onChange={v => handleUpdate('logoImage', v)} 
                        description="Direct cloud storage link"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-100 flex flex-col gap-6">
                    <LocalizedSettingInput 
                      label="Footer Description" 
                      value={settings.footerDescription} 
                      onChange={v => handleUpdate('footerDescription', v)}
                      languages={settings.languages}
                      type="textarea"
                      onAITranslate={() => handleAITranslate('footerDescription', 'Footer Description')}
                      onAIAutoComplete={() => handleAIAutoComplete('footerDescription', 'Footer Description')}
                      isGenerating={generatingId === 'footerDescription-fill'}
                      isTranslating={generatingId === 'footerDescription-translate'}
                    />
                    <LocalizedSettingInput 
                      label="Footer Copyright Text" 
                      value={settings.footerCopyright} 
                      onChange={v => handleUpdate('footerCopyright', v)}
                      languages={settings.languages}
                      onAITranslate={() => handleAITranslate('footerCopyright', 'Footer Copyright Text')}
                      onAIAutoComplete={() => handleAIAutoComplete('footerCopyright', 'Footer Copyright Text')}
                      isGenerating={generatingId === 'footerCopyright-fill'}
                      isTranslating={generatingId === 'footerCopyright-translate'}
                    />
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
                      isGenerating={generatingId === 'seoTitle-fill'}
                      isTranslating={generatingId === 'seoTitle-translate'}
                    />
                    <LocalizedSettingInput 
                      label="Search Description" 
                      value={settings.seoDescription} 
                      onChange={v => handleUpdate('seoDescription', v)}
                      languages={settings.languages}
                      type="textarea"
                      onAIAutoComplete={() => handleAIAutoComplete('seoDescription', 'SEO Description')}
                      onAITranslate={() => handleAITranslate('seoDescription', 'SEO Description')}
                      isGenerating={generatingId === 'seoDescription-fill'}
                      isTranslating={generatingId === 'seoDescription-translate'}
                    />
                    <LocalizedSettingInput 
                      label="Search Keywords" 
                      value={settings.seoKeywords} 
                      onChange={v => handleUpdate('seoKeywords', v)}
                      languages={settings.languages}
                      description="Comma-separated keywords for search engines"
                      onAITranslate={() => handleAITranslate('seoKeywords', 'SEO Keywords')}
                      onAIAutoComplete={() => handleAIAutoComplete('seoKeywords', 'SEO Keywords')}
                      isGenerating={generatingId === 'seoKeywords-fill'}
                      isTranslating={generatingId === 'seoKeywords-translate'}
                    />

                    <div className="pt-4 border-t border-zinc-100">
                      <label className="text-sm font-black text-zinc-500 uppercase tracking-widest leading-none block mb-3">
                        Social Share Asset (OG Image)
                      </label>
                      <div className="flex items-start gap-4">
                        <div className="relative w-40 aspect-video bg-zinc-50 border border-zinc-200 rounded overflow-hidden flex-shrink-0 group">
                           {settings.seoImage ? (
                             <Image src={settings.seoImage} alt="Social Share Preview" fill className="object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-zinc-300">
                               <ImageIcon className="w-8 h-8" />
                             </div>
                           )}
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <label className="cursor-pointer p-2 bg-white rounded-full text-zinc-900 shadow-xl scale-75 group-hover:scale-100 transition-transform">
                                <Plus className="w-4 h-4" />
                                <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'seoImage')} accept="image/*" />
                              </label>
                           </div>
                        </div>
                        <div className="flex-1 space-y-2">
                           <input 
                             type="text" 
                             value={settings.seoImage} 
                             onChange={e => handleUpdate('seoImage', e.target.value)}
                             className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 text-sm font-bold focus:ring-1 focus:ring-zinc-900 focus:outline-none rounded-sm"
                             placeholder="Asset URL (https://...)" 
                           />
                           <p className="text-xs text-zinc-500 font-medium italic leading-relaxed">
                             Recommended size: 1200x630. This image appears when you share the store link on WhatsApp, Telegram, or Facebook.
                           </p>
                        </div>
                      </div>
                    </div>
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
                          onAITranslate={() => handleItemTranslate(
                            link.label,
                            `Navbar Link #${idx + 1}`,
                            (result) => {
                              const newLinks = [...settings.navbarLinks];
                              newLinks[idx].label = result;
                              handleUpdate('navbarLinks', newLinks);
                            }
                          )}
                          isGenerating={generatingId === `Navbar Link #${idx + 1}-fill`}
                          isTranslating={generatingId === `Navbar Link #${idx + 1}-translate`}
                        />
                        <CredentialInput label="Destination URL" value={link.href} onChange={v => {
                             const newLinks = [...settings.navbarLinks];
                             newLinks[idx].href = v;
                             handleUpdate('navbarLinks', newLinks);
                        }} placeholder="/products, /about, etc." />
                      </div>
                    ))}
                    <button onClick={() => handleUpdate('navbarLinks', [...settings.navbarLinks, { label: { en: 'New Link' }, href: '#' }])} className="w-full py-3 border border-dashed border-zinc-200 rounded-md text-sm font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2">
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
                             onAITranslate={() => handleItemTranslate(
                               section.title,
                               `Footer Section ${sIdx + 1} Title`,
                               (result) => {
                                 const newSections = [...settings.footerSections];
                                 newSections[sIdx].title = result;
                                 handleUpdate('footerSections', newSections);
                               }
                             )}
                             isGenerating={generatingId === `Footer Section ${sIdx + 1} Title-fill`}
                             isTranslating={generatingId === `Footer Section ${sIdx + 1} Title-translate`}
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
                                      onAITranslate={() => handleItemTranslate(
                                        link.label,
                                        `Footer Link Label`,
                                        (result) => {
                                          const newSections = [...settings.footerSections];
                                          newSections[sIdx].links[lIdx].label = result;
                                          handleUpdate('footerSections', newSections);
                                        }
                                      )}
                                      isGenerating={generatingId === 'Footer Link Label-fill'}
                                      isTranslating={generatingId === 'Footer Link Label-translate'}
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
                              }} className="py-2 border border-dashed border-zinc-200 rounded-sm text-xs font-bold text-zinc-500 hover:text-zinc-900 flex items-center justify-center">
                                 <Plus className="w-3 h-3 mr-1" /> Add Link
                              </button>
                           </div>
                        </div>
                      ))}
                      <button onClick={() => handleUpdate('footerSections', [...settings.footerSections, { title: { en: 'New Section' }, links: [] }])} className="w-full py-3 border border-dashed border-zinc-200 rounded-md text-sm font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-all flex items-center justify-center gap-2">
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
                <SettingCard id="Hero" title="Hero / Header UI" icon={Sparkles} defaultExpanded>
                   <div className="space-y-6">
                    <LocalizedSettingInput 
                      label="Main Hero Title" 
                      value={settings.heroTitle} 
                      onChange={v => handleUpdate('heroTitle', v)} 
                      languages={settings.languages} 
                      onAITranslate={() => handleAITranslate('heroTitle', 'Hero Title')} 
                      onAIAutoComplete={() => handleAIAutoComplete('heroTitle', 'Hero Title')} 
                      isGenerating={generatingId === 'heroTitle-fill'} 
                      isTranslating={generatingId === 'heroTitle-translate'} 
                    />
                    <LocalizedSettingInput 
                      label="Hero Description" 
                      value={settings.heroSubtitle} 
                      onChange={v => handleUpdate('heroSubtitle', v)} 
                      languages={settings.languages} 
                      type="textarea"
                      onAITranslate={() => handleAITranslate('heroSubtitle', 'Hero Description')} 
                      onAIAutoComplete={() => handleAIAutoComplete('heroSubtitle', 'Hero Description')} 
                      isGenerating={generatingId === 'heroSubtitle-fill'} 
                      isTranslating={generatingId === 'heroSubtitle-translate'} 
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <LocalizedSettingInput 
                        label="Hero Button Label" 
                        value={settings.heroButtonText} 
                        onChange={v => handleUpdate('heroButtonText', v)} 
                        languages={settings.languages} 
                        onAITranslate={() => handleAITranslate('heroButtonText', 'Hero Button Label')} 
                        isGenerating={generatingId === 'heroButtonText-fill'} 
                        isTranslating={generatingId === 'heroButtonText-translate'} 
                      />
                      <CredentialInput 
                        label="Hero Button Link" 
                        value={settings.heroButtonLink} 
                        onChange={v => handleUpdate('heroButtonLink', v)} 
                        placeholder="/collections/all"
                      />
                    </div>
                   </div>
                </SettingCard>

                <SettingCard id="Collections" title="Top Collections Grid" icon={Layers}>
                   <div className="space-y-6">
                    <LocalizedSettingInput 
                      label="Collections Tagline" 
                      value={settings.collectionTopSubtitle} 
                      onChange={v => handleUpdate('collectionTopSubtitle', v)} 
                      languages={settings.languages} 
                      onAITranslate={() => handleAITranslate('collectionTopSubtitle', 'Collections Tagline')} 
                      onAIAutoComplete={() => handleAIAutoComplete('collectionTopSubtitle', 'Collections Tagline')} 
                      isGenerating={generatingId === 'collectionTopSubtitle-fill'} 
                      isTranslating={generatingId === 'collectionTopSubtitle-translate'} 
                    />
                    <LocalizedSettingInput 
                      label="Grid Main Heading" 
                      value={settings.collectionTitle} 
                      onChange={v => handleUpdate('collectionTitle', v)} 
                      languages={settings.languages} 
                      onAITranslate={() => handleAITranslate('collectionTitle', 'Grid Heading')} 
                      onAIAutoComplete={() => handleAIAutoComplete('collectionTitle', 'Grid Heading')} 
                      isGenerating={generatingId === 'collectionTitle-fill'} 
                      isTranslating={generatingId === 'collectionTitle-translate'} 
                    />
                    <LocalizedSettingInput 
                      label="Grid Description" 
                      value={settings.collectionSubtitle} 
                      onChange={v => handleUpdate('collectionSubtitle', v)} 
                      languages={settings.languages} 
                      type="textarea"
                      onAITranslate={() => handleAITranslate('collectionSubtitle', 'Grid Description')} 
                      onAIAutoComplete={() => handleAIAutoComplete('collectionSubtitle', 'Grid Description')} 
                      isGenerating={generatingId === 'collectionSubtitle-fill'} 
                      isTranslating={generatingId === 'collectionSubtitle-translate'} 
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <LocalizedSettingInput 
                        label="Overlay Button Label (Discover)" 
                        value={settings.shopNowText} 
                        onChange={v => handleUpdate('shopNowText', v)} 
                        languages={settings.languages} 
                        onAITranslate={() => handleAITranslate('shopNowText', 'Shop Now Label')} 
                        isGenerating={generatingId === 'shopNowText-fill'} 
                        isTranslating={generatingId === 'shopNowText-translate'} 
                      />
                      <LocalizedSettingInput 
                        label="Section View All Label" 
                        value={settings.viewAllText} 
                        onChange={v => handleUpdate('viewAllText', v)} 
                        languages={settings.languages} 
                        onAITranslate={() => handleAITranslate('viewAllText', 'View All Label')} 
                        isGenerating={generatingId === 'viewAllText-fill'} 
                        isTranslating={generatingId === 'viewAllText-translate'} 
                      />
                    </div>
                   </div>
                </SettingCard>

                <SettingCard id="Future" title="Future Product Preview" icon={Clock}>
                   <div className="space-y-6 mb-8 pb-8 border-b border-zinc-100">
                    <LocalizedSettingInput 
                      label="Future Section Title" 
                      value={settings.futureTitle} 
                      onChange={v => handleUpdate('futureTitle', v)} 
                      languages={settings.languages} 
                      onAITranslate={() => handleAITranslate('futureTitle', 'Future Section Title')} 
                      onAIAutoComplete={() => handleAIAutoComplete('futureTitle', 'Future Section Title')} 
                      isGenerating={generatingId === 'futureTitle-fill'} 
                      isTranslating={generatingId === 'futureTitle-translate'} 
                    />
                    <LocalizedSettingInput 
                      label="Future Section Description" 
                      value={settings.futureSubtitle} 
                      onChange={v => handleUpdate('futureSubtitle', v)} 
                      languages={settings.languages} 
                      onAITranslate={() => handleAITranslate('futureSubtitle', 'Future Section Description')} 
                      onAIAutoComplete={() => handleAIAutoComplete('futureSubtitle', 'Future Section Description')} 
                      isGenerating={generatingId === 'futureSubtitle-fill'} 
                      isTranslating={generatingId === 'futureSubtitle-translate'} 
                    />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <div className="aspect-[4/5] bg-zinc-50 border border-zinc-100 rounded-md relative group overflow-hidden">
                           {isValidUrl(settings.futureImage1) ? (
                              <Image src={settings.futureImage1} alt="Future product preview 1" fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
                           ) : <ImageIcon className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-200" />}
                           <input type="file" onChange={e => handleImageUpload(e, 'futureImage1')} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <LocalizedSettingInput label="Product 1 Title" value={settings.futureProduct1Title} onChange={v => handleUpdate('futureProduct1Title', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('futureProduct1Title', 'Product 1 Title')} onAIAutoComplete={() => handleAIAutoComplete('futureProduct1Title', 'Product 1 Title')} isGenerating={generatingId === 'futureProduct1Title-fill'} isTranslating={generatingId === 'futureProduct1Title-translate'} />
                        <LocalizedSettingInput label="Availability Date" value={settings.futureProduct1Date} onChange={v => handleUpdate('futureProduct1Date', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('futureProduct1Date', 'Availability Date')} onAIAutoComplete={() => handleAIAutoComplete('futureProduct1Date', 'Availability Date')} isGenerating={generatingId === 'futureProduct1Date-fill'} isTranslating={generatingId === 'futureProduct1Date-translate'} />
                     </div>
                     <div className="space-y-4">
                        <div className="aspect-[4/5] bg-zinc-50 border border-zinc-100 rounded-md relative group overflow-hidden">
                           {isValidUrl(settings.futureImage2) ? (
                              <Image src={settings.futureImage2} alt="Future product preview 2" fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
                           ) : <ImageIcon className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-200" />}
                           <input type="file" onChange={e => handleImageUpload(e, 'futureImage2')} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <LocalizedSettingInput label="Product 2 Title" value={settings.futureProduct2Title} onChange={v => handleUpdate('futureProduct2Title', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('futureProduct2Title', 'Product 2 Title')} onAIAutoComplete={() => handleAIAutoComplete('futureProduct2Title', 'Product 2 Title')} isGenerating={generatingId === 'futureProduct2Title-fill'} isTranslating={generatingId === 'futureProduct2Title-translate'} />
                        <LocalizedSettingInput label="Availability Date" value={settings.futureProduct2Date} onChange={v => handleUpdate('futureProduct2Date', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('futureProduct2Date', 'Availability Date')} onAIAutoComplete={() => handleAIAutoComplete('futureProduct2Date', 'Availability Date')} isGenerating={generatingId === 'futureProduct2Date-fill'} isTranslating={generatingId === 'futureProduct2Date-translate'} />
                     </div>
                   </div>
                   <div className="mt-8 pt-6 border-t border-zinc-100">
                      <LocalizedSettingInput 
                        label="View All Button Label" 
                        value={settings.futureViewAllText} 
                        onChange={v => handleUpdate('futureViewAllText', v)} 
                        languages={settings.languages} 
                        onAITranslate={() => handleAITranslate('futureViewAllText', 'Future View All Label')} 
                        isGenerating={generatingId === 'futureViewAllText-fill'} 
                        isTranslating={generatingId === 'futureViewAllText-translate'} 
                      />
                    </div>
                </SettingCard>

                <SettingCard id="Featured" title="Featured Collection Section" icon={Package}>
                   <div className="space-y-6">
                    <LocalizedSettingInput 
                      label="Featured Section Heading" 
                      value={settings.featuredTitle} 
                      onChange={v => handleUpdate('featuredTitle', v)} 
                      languages={settings.languages} 
                      onAITranslate={() => handleAITranslate('featuredTitle', 'Featured Heading')} 
                      onAIAutoComplete={() => handleAIAutoComplete('featuredTitle', 'Featured Heading')} 
                      isGenerating={generatingId === 'featuredTitle-fill'} 
                      isTranslating={generatingId === 'featuredTitle-translate'} 
                    />
                    <LocalizedSettingInput 
                      label="Featured Subtitle / Tagline" 
                      value={settings.featuredTopSubtitle} 
                      onChange={v => handleUpdate('featuredTopSubtitle', v)} 
                      languages={settings.languages} 
                      onAITranslate={() => handleAITranslate('featuredTopSubtitle', 'Featured Subtitle')} 
                      onAIAutoComplete={() => handleAIAutoComplete('featuredTopSubtitle', 'Featured Subtitle')} 
                      isGenerating={generatingId === 'featuredTopSubtitle-fill'} 
                      isTranslating={generatingId === 'featuredTopSubtitle-translate'} 
                    />
                    <LocalizedSettingInput 
                      label="Featured Section Description" 
                      value={settings.featuredSubtitle} 
                      onChange={v => handleUpdate('featuredSubtitle', v)} 
                      languages={settings.languages} 
                      type="textarea" 
                      onAITranslate={() => handleAITranslate('featuredSubtitle', 'Featured Description')} 
                      onAIAutoComplete={() => handleAIAutoComplete('featuredSubtitle', 'Featured Description')} 
                      isGenerating={generatingId === 'featuredSubtitle-fill'} 
                      isTranslating={generatingId === 'featuredSubtitle-translate'} 
                    />

                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Curated Category Showcase</label>
                      <p className="text-[12px] text-zinc-500 mb-4 font-medium italic">Select which category's items to showcase on the homepage. Defaults to all featured products if left unselected.</p>
                      <SearchableSelect 
                        options={[
                          { value: '', label: 'Showcase All Featured Products' },
                          ...categories.map(c => ({ 
                            value: (c.id as string), 
                            label: typeof c.name === 'string' ? c.name : (c.name as Record<string, string>)?.en || 'Untitled Category' 
                          }))
                        ]}
                        value={settings.featuredCategoryId || ''}
                        onChange={(v) => handleUpdate('featuredCategoryId', v as string)}
                        placeholder="Select showcase category..."
                      />
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
                      <LocalizedSettingInput label="Shop Now Button" value={settings.shopNowText} onChange={v => handleUpdate('shopNowText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('shopNowText', 'Shop Now Button')} onAIAutoComplete={() => handleAIAutoComplete('shopNowText', 'Shop Now Button')} isGenerating={generatingId === 'shopNowText-fill'} isTranslating={generatingId === 'shopNowText-translate'} />
                      <LocalizedSettingInput label="View Detail Labels" value={settings.viewDetailsText} onChange={v => handleUpdate('viewDetailsText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('viewDetailsText', 'View Detail Labels')} onAIAutoComplete={() => handleAIAutoComplete('viewDetailsText', 'View Detail Labels')} isGenerating={generatingId === 'viewDetailsText-fill'} isTranslating={generatingId === 'viewDetailsText-translate'} />
                      <LocalizedSettingInput label="Add To Cart Button" value={settings.addToCartButtonText} onChange={v => handleUpdate('addToCartButtonText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('addToCartButtonText', 'Add To Cart Button')} onAIAutoComplete={() => handleAIAutoComplete('addToCartButtonText', 'Add To Cart Button')} isGenerating={generatingId === 'addToCartButtonText-fill'} isTranslating={generatingId === 'addToCartButtonText-translate'} />
                      <LocalizedSettingInput label="In Stock Indicator" value={settings.inStockText} onChange={v => handleUpdate('inStockText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('inStockText', 'In Stock Indicator')} onAIAutoComplete={() => handleAIAutoComplete('inStockText', 'In Stock Indicator')} isGenerating={generatingId === 'inStockText-fill'} isTranslating={generatingId === 'inStockText-translate'} />
                      <LocalizedSettingInput label="Out of Stock Indicator" value={settings.outOfStockText} onChange={v => handleUpdate('outOfStockText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('outOfStockText', 'Out of Stock Indicator')} onAIAutoComplete={() => handleAIAutoComplete('outOfStockText', 'Out of Stock Indicator')} isGenerating={generatingId === 'outOfStockText-fill'} isTranslating={generatingId === 'outOfStockText-translate'} />
                   </div>
                </SettingCard>
                <SettingCard id="LabelsSearch" title="Search Experience Labels" icon={Globe}>
                   <div className="grid grid-cols-1 gap-8">
                      <LocalizedSettingInput label="Search Placeholder" value={settings.searchPlaceholder} onChange={v => handleUpdate('searchPlaceholder', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('searchPlaceholder', 'Search Placeholder')} onAIAutoComplete={() => handleAIAutoComplete('searchPlaceholder', 'Search Placeholder')} isGenerating={generatingId === 'searchPlaceholder-fill'} isTranslating={generatingId === 'searchPlaceholder-translate'} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <LocalizedSettingInput label="Discover Collections Heading" value={settings.searchDiscoverCollectionsText} onChange={v => handleUpdate('searchDiscoverCollectionsText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('searchDiscoverCollectionsText', 'Discover Collections Heading')} onAIAutoComplete={() => handleAIAutoComplete('searchDiscoverCollectionsText', 'Discover Collections Heading')} isGenerating={generatingId === 'searchDiscoverCollectionsText-fill'} isTranslating={generatingId === 'searchDiscoverCollectionsText-translate'} />
                        <LocalizedSettingInput label="Collections Results Heading" value={settings.searchCollectionsResultsText} onChange={v => handleUpdate('searchCollectionsResultsText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('searchCollectionsResultsText', 'Collections Results Heading')} onAIAutoComplete={() => handleAIAutoComplete('searchCollectionsResultsText', 'Collections Results Heading')} isGenerating={generatingId === 'searchCollectionsResultsText-fill'} isTranslating={generatingId === 'searchCollectionsResultsText-translate'} />
                        <LocalizedSettingInput label="Products Results Heading" value={settings.searchProductsResultsText} onChange={v => handleUpdate('searchProductsResultsText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('searchProductsResultsText', 'Products Results Heading')} onAIAutoComplete={() => handleAIAutoComplete('searchProductsResultsText', 'Products Results Heading')} isGenerating={generatingId === 'searchProductsResultsText-fill'} isTranslating={generatingId === 'searchProductsResultsText-translate'} />
                        <LocalizedSettingInput label="View All Results Label" value={settings.viewAllResultsText} onChange={v => handleUpdate('viewAllResultsText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('viewAllResultsText', 'View All Results Label')} onAIAutoComplete={() => handleAIAutoComplete('viewAllResultsText', 'View All Results Label')} isGenerating={generatingId === 'viewAllResultsText-fill'} isTranslating={generatingId === 'viewAllResultsText-translate'} />
                      </div>
                      <LocalizedSettingInput label="No Search Results Message" value={settings.searchNoProductsResultsText} onChange={v => handleUpdate('searchNoProductsResultsText', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('searchNoProductsResultsText', 'No Search Results Message')} onAIAutoComplete={() => handleAIAutoComplete('searchNoProductsResultsText', 'No Search Results Message')} isGenerating={generatingId === 'searchNoProductsResultsText-fill'} isTranslating={generatingId === 'searchNoProductsResultsText-translate'} />
                   </div>
                </SettingCard>
                <SettingCard id="LabelsCheckout" title="Checkout & Cart UX" icon={ShoppingCart}>
                   <div className="grid grid-cols-1 gap-8">
                      <LocalizedSettingInput label="Cart Header" value={settings.cartTitle} onChange={v => handleUpdate('cartTitle', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('cartTitle', 'Cart Header')} onAIAutoComplete={() => handleAIAutoComplete('cartTitle', 'Cart Header')} isGenerating={generatingId === 'cartTitle-fill'} isTranslating={generatingId === 'cartTitle-translate'} />
                      <LocalizedSettingInput label="Empty Cart Message" value={settings.cartEmptyMessage} onChange={v => handleUpdate('cartEmptyMessage', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('cartEmptyMessage', 'Empty Cart Message')} onAIAutoComplete={() => handleAIAutoComplete('cartEmptyMessage', 'Empty Cart Message')} isGenerating={generatingId === 'cartEmptyMessage-fill'} isTranslating={generatingId === 'cartEmptyMessage-translate'} />
                      <LocalizedSettingInput label="Order Summary Title" value={settings.orderSummaryText} onChange={v => handleUpdate('orderSummaryText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('orderSummaryText', 'Order Summary Title')} onAIAutoComplete={() => handleAIAutoComplete('orderSummaryText', 'Order Summary Title')} isGenerating={generatingId === 'orderSummaryText-fill'} isTranslating={generatingId === 'orderSummaryText-translate'} />
                      <LocalizedSettingInput label="Checkout Button" value={settings.checkoutButtonText} onChange={v => handleUpdate('checkoutButtonText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('checkoutButtonText', 'Checkout Button')} onAIAutoComplete={() => handleAIAutoComplete('checkoutButtonText', 'Checkout Button')} isGenerating={generatingId === 'checkoutButtonText-fill'} isTranslating={generatingId === 'checkoutButtonText-translate'} />
                   </div>
                </SettingCard>

                <SettingCard id="LabelsInventory" title="Product & Inventory Labels" icon={Package}>
                   <div className="grid grid-cols-1 gap-8">
                      <LocalizedSettingInput label="Pricing & Inventory Header" value={settings.inventoryTitleText} onChange={v => handleUpdate('inventoryTitleText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('inventoryTitleText', 'Inventory Title')} onAIAutoComplete={() => handleAIAutoComplete('inventoryTitleText', 'Inventory Title')} isGenerating={generatingId === 'inventoryTitleText-fill'} isTranslating={generatingId === 'inventoryTitleText-translate'} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <LocalizedSettingInput label="Regular Price Label" value={settings.regularPriceText} onChange={v => handleUpdate('regularPriceText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('regularPriceText', 'Regular Price')} onAIAutoComplete={() => handleAIAutoComplete('regularPriceText', 'Regular Price')} isGenerating={generatingId === 'regularPriceText-fill'} isTranslating={generatingId === 'regularPriceText-translate'} />
                        <LocalizedSettingInput label="Sale Price Label" value={settings.salePriceText} onChange={v => handleUpdate('salePriceText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('salePriceText', 'Sale Price')} onAIAutoComplete={() => handleAIAutoComplete('salePriceText', 'Sale Price')} isGenerating={generatingId === 'salePriceText-fill'} isTranslating={generatingId === 'salePriceText-translate'} />
                        <LocalizedSettingInput label="SKU Code Label" value={settings.skuCodeText} onChange={v => handleUpdate('skuCodeText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('skuCodeText', 'SKU Code')} onAIAutoComplete={() => handleAIAutoComplete('skuCodeText', 'SKU Code')} isGenerating={generatingId === 'skuCodeText-fill'} isTranslating={generatingId === 'skuCodeText-translate'} />
                        <LocalizedSettingInput label="Initial Stock Label" value={settings.initialStockText} onChange={v => handleUpdate('initialStockText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('initialStockText', 'Initial Stock')} onAIAutoComplete={() => handleAIAutoComplete('initialStockText', 'Initial Stock')} isGenerating={generatingId === 'initialStockText-fill'} isTranslating={generatingId === 'initialStockText-translate'} />
                        <LocalizedSettingInput label="Weight Label" value={settings.weightKgText} onChange={v => handleUpdate('weightKgText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('weightKgText', 'Weight Label')} onAIAutoComplete={() => handleAIAutoComplete('weightKgText', 'Weight Label')} isGenerating={generatingId === 'weightKgText-fill'} isTranslating={generatingId === 'weightKgText-translate'} />
                        <LocalizedSettingInput label="Shipping Class Label" value={settings.shippingClassText} onChange={v => handleUpdate('shippingClassText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('shippingClassText', 'Shipping Class')} onAIAutoComplete={() => handleAIAutoComplete('shippingClassText', 'Shipping Class')} isGenerating={generatingId === 'shippingClassText-fill'} isTranslating={generatingId === 'shippingClassText-translate'} />
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

                    <div className="pt-6 border-t border-zinc-100">
                      <p className="text-sm font-black uppercase tracking-widest text-zinc-900 mb-4">Account Finalization Wall</p>
                      <div className="space-y-6">
                        <LocalizedSettingInput label="Finalization Header" value={settings.finalizeAccountTitle} onChange={v => handleUpdate('finalizeAccountTitle', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('finalizeAccountTitle', 'Finalization Header')} isGenerating={generatingId === 'finalizeAccountTitle-fill'} isTranslating={generatingId === 'finalizeAccountTitle-translate'} />
                        <LocalizedSettingInput label="Finalization Instruction" value={settings.finalizeAccountSubtitle} onChange={v => handleUpdate('finalizeAccountSubtitle', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('finalizeAccountSubtitle', 'Finalization Instruction')} isGenerating={generatingId === 'finalizeAccountSubtitle-fill'} isTranslating={generatingId === 'finalizeAccountSubtitle-translate'} />
                      </div>
                    </div>

                    <LocalizedSettingInput label="Google Login Unavailable Message" value={settings.googleLoginUnavailableText} onChange={v => handleUpdate('googleLoginUnavailableText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('googleLoginUnavailableText', 'Google Login Unavailable Message')} isGenerating={generatingId === 'googleLoginUnavailableText-fill'} isTranslating={generatingId === 'googleLoginUnavailableText-translate'} />
                    <LocalizedSettingInput label="Invalid Login Error Message" value={settings.invalidLoginErrorText} onChange={v => handleUpdate('invalidLoginErrorText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('invalidLoginErrorText', 'Invalid Login Error Message')} isGenerating={generatingId === 'invalidLoginErrorText-fill'} isTranslating={generatingId === 'invalidLoginErrorText-translate'} />
                    <LocalizedSettingInput label="Cookie Preferences Footer Button" value={settings.cookiePreferencesButtonText} onChange={v => handleUpdate('cookiePreferencesButtonText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('cookiePreferencesButtonText', 'Cookie Preferences Footer Button')} isGenerating={generatingId === 'cookiePreferencesButtonText-fill'} isTranslating={generatingId === 'cookiePreferencesButtonText-translate'} />
                    <LocalizedSettingInput label="Unsubscribe Footer Link" value={settings.unsubscribeLinkText} onChange={v => handleUpdate('unsubscribeLinkText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('unsubscribeLinkText', 'Unsubscribe Footer Link')} isGenerating={generatingId === 'unsubscribeLinkText-fill'} isTranslating={generatingId === 'unsubscribeLinkText-translate'} />
                    <LocalizedSettingInput label="Sign Up Terms Consent Prefix" value={settings.signUpTermsConsentText} onChange={v => handleUpdate('signUpTermsConsentText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('signUpTermsConsentText', 'Sign Up Terms Consent Prefix')} isGenerating={generatingId === 'signUpTermsConsentText-fill'} isTranslating={generatingId === 'signUpTermsConsentText-translate'} />
                    <LocalizedSettingInput label="Sign Up Privacy Consent Prefix" value={settings.signUpPrivacyConsentText} onChange={v => handleUpdate('signUpPrivacyConsentText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('signUpPrivacyConsentText', 'Sign Up Privacy Consent Prefix')} isGenerating={generatingId === 'signUpPrivacyConsentText-fill'} isTranslating={generatingId === 'signUpPrivacyConsentText-translate'} />
                    <LocalizedSettingInput label="Sign Up Marketing Consent Text" value={settings.signUpMarketingConsentText} onChange={v => handleUpdate('signUpMarketingConsentText', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('signUpMarketingConsentText', 'Sign Up Marketing Consent Text')} isGenerating={generatingId === 'signUpMarketingConsentText-fill'} isTranslating={generatingId === 'signUpMarketingConsentText-translate'} />

                    <LocalizedSettingInput label="Consent Banner Eyebrow" value={settings.consentBannerEyebrowText} onChange={v => handleUpdate('consentBannerEyebrowText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentBannerEyebrowText', 'Consent Banner Eyebrow')} isGenerating={generatingId === 'consentBannerEyebrowText-fill'} isTranslating={generatingId === 'consentBannerEyebrowText-translate'} />
                    <LocalizedSettingInput label="Consent Banner Title" value={settings.consentBannerTitleText} onChange={v => handleUpdate('consentBannerTitleText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentBannerTitleText', 'Consent Banner Title')} isGenerating={generatingId === 'consentBannerTitleText-fill'} isTranslating={generatingId === 'consentBannerTitleText-translate'} />
                    <LocalizedSettingInput label="Consent Banner Description" value={settings.consentBannerDescriptionText} onChange={v => handleUpdate('consentBannerDescriptionText', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('consentBannerDescriptionText', 'Consent Banner Description')} isGenerating={generatingId === 'consentBannerDescriptionText-fill'} isTranslating={generatingId === 'consentBannerDescriptionText-translate'} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <LocalizedSettingInput label="Consent Privacy Link Label" value={settings.consentPrivacyLinkText} onChange={v => handleUpdate('consentPrivacyLinkText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentPrivacyLinkText', 'Consent Privacy Link Label')} isGenerating={generatingId === 'consentPrivacyLinkText-fill'} isTranslating={generatingId === 'consentPrivacyLinkText-translate'} />
                      <LocalizedSettingInput label="Consent Cookie Link Label" value={settings.consentCookieLinkText} onChange={v => handleUpdate('consentCookieLinkText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentCookieLinkText', 'Consent Cookie Link Label')} isGenerating={generatingId === 'consentCookieLinkText-fill'} isTranslating={generatingId === 'consentCookieLinkText-translate'} />
                      <LocalizedSettingInput label="Consent Essential Title" value={settings.consentEssentialTitleText} onChange={v => handleUpdate('consentEssentialTitleText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentEssentialTitleText', 'Consent Essential Title')} isGenerating={generatingId === 'consentEssentialTitleText-fill'} isTranslating={generatingId === 'consentEssentialTitleText-translate'} />
                      <LocalizedSettingInput label="Consent Always On Label" value={settings.consentAlwaysOnText} onChange={v => handleUpdate('consentAlwaysOnText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentAlwaysOnText', 'Consent Always On Label')} isGenerating={generatingId === 'consentAlwaysOnText-fill'} isTranslating={generatingId === 'consentAlwaysOnText-translate'} />
                      <LocalizedSettingInput label="Consent Analytics Title" value={settings.consentAnalyticsTitleText} onChange={v => handleUpdate('consentAnalyticsTitleText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentAnalyticsTitleText', 'Consent Analytics Title')} isGenerating={generatingId === 'consentAnalyticsTitleText-fill'} isTranslating={generatingId === 'consentAnalyticsTitleText-translate'} />
                      <LocalizedSettingInput label="Consent Marketing Title" value={settings.consentMarketingTitleText} onChange={v => handleUpdate('consentMarketingTitleText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentMarketingTitleText', 'Consent Marketing Title')} isGenerating={generatingId === 'consentMarketingTitleText-fill'} isTranslating={generatingId === 'consentMarketingTitleText-translate'} />
                      <LocalizedSettingInput label="Consent Save Preferences Label" value={settings.consentSavePreferencesText} onChange={v => handleUpdate('consentSavePreferencesText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentSavePreferencesText', 'Consent Save Preferences Label')} isGenerating={generatingId === 'consentSavePreferencesText-fill'} isTranslating={generatingId === 'consentSavePreferencesText-translate'} />
                      <LocalizedSettingInput label="Consent Reject Optional Label" value={settings.consentRejectOptionalText} onChange={v => handleUpdate('consentRejectOptionalText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentRejectOptionalText', 'Consent Reject Optional Label')} isGenerating={generatingId === 'consentRejectOptionalText-fill'} isTranslating={generatingId === 'consentRejectOptionalText-translate'} />
                    </div>
                    <LocalizedSettingInput label="Consent Essential Description" value={settings.consentEssentialDescriptionText} onChange={v => handleUpdate('consentEssentialDescriptionText', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('consentEssentialDescriptionText', 'Consent Essential Description')} isGenerating={generatingId === 'consentEssentialDescriptionText-fill'} isTranslating={generatingId === 'consentEssentialDescriptionText-translate'} />
                    <LocalizedSettingInput label="Consent Analytics Description" value={settings.consentAnalyticsDescriptionText} onChange={v => handleUpdate('consentAnalyticsDescriptionText', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('consentAnalyticsDescriptionText', 'Consent Analytics Description')} isGenerating={generatingId === 'consentAnalyticsDescriptionText-fill'} isTranslating={generatingId === 'consentAnalyticsDescriptionText-translate'} />
                    <LocalizedSettingInput label="Consent Marketing Title" value={settings.consentMarketingTitleText} onChange={v => handleUpdate('consentMarketingTitleText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('consentMarketingTitleText', 'Consent Marketing Title')} isGenerating={generatingId === 'consentMarketingTitleText-fill'} isTranslating={generatingId === 'consentMarketingTitleText-translate'} />
                    <LocalizedSettingInput label="Consent Marketing Description" value={settings.consentMarketingDescriptionText} onChange={v => handleUpdate('consentMarketingDescriptionText', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('consentMarketingDescriptionText', 'Consent Marketing Description')} isGenerating={generatingId === 'consentMarketingDescriptionText-fill'} isTranslating={generatingId === 'consentMarketingDescriptionText-translate'} />
                  </div>
                </SettingCard>

                <SettingCard id="OTPVerification" title="Security & OTP Verification" icon={Lock}>
                  <div className="space-y-8">
                    <LocalizedSettingInput 
                      label="OTP Modal Title" 
                      value={settings.otpTitle} 
                      onChange={v => handleUpdate('otpTitle', v)} 
                      languages={settings.languages} 
                      onAITranslate={() => handleAITranslate('otpTitle', 'OTP Title')} 
                      isGenerating={generatingId === 'otpTitle-fill'} 
                      isTranslating={generatingId === 'otpTitle-translate'} 
                    />
                    <LocalizedSettingInput 
                      label="OTP Modal Subtitle" 
                      value={settings.otpSubtitle} 
                      onChange={v => handleUpdate('otpSubtitle', v)} 
                      languages={settings.languages} 
                      onAITranslate={() => handleAITranslate('otpSubtitle', 'OTP Subtitle')} 
                      isGenerating={generatingId === 'otpSubtitle-fill'} 
                      isTranslating={generatingId === 'otpSubtitle-translate'} 
                    />
                    <LocalizedSettingInput 
                      label="Spam Folder Reminder" 
                      value={settings.otpCheckSpam} 
                      onChange={v => handleUpdate('otpCheckSpam', v)} 
                      languages={settings.languages} 
                      onAITranslate={() => handleAITranslate('otpCheckSpam', 'OTP Spam Reminder')} 
                      isGenerating={generatingId === 'otpCheckSpam-fill'} 
                      isTranslating={generatingId === 'otpCheckSpam-translate'} 
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <LocalizedSettingInput 
                        label="Verify Button Text" 
                        value={settings.otpVerifyButton} 
                        onChange={v => handleUpdate('otpVerifyButton', v)} 
                        languages={settings.languages} 
                        onAITranslate={() => handleAITranslate('otpVerifyButton', 'OTP Verify Button')} 
                        isGenerating={generatingId === 'otpVerifyButton-fill'} 
                        isTranslating={generatingId === 'otpVerifyButton-translate'} 
                      />
                      <LocalizedSettingInput 
                        label="Clear/Try Again Text" 
                        value={settings.otpClearButton} 
                        onChange={v => handleUpdate('otpClearButton', v)} 
                        languages={settings.languages} 
                        onAITranslate={() => handleAITranslate('otpClearButton', 'OTP Clear Button')} 
                        isGenerating={generatingId === 'otpClearButton-fill'} 
                        isTranslating={generatingId === 'otpClearButton-translate'} 
                      />
                    </div>
                  </div>
                </SettingCard>
                <SettingCard id="PasswordRecovery" title="Password Recovery & Security UX" icon={Lock}>
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <LocalizedSettingInput label="Forgot Password Trigger Link" value={settings.forgotPasswordText} onChange={v => handleUpdate('forgotPasswordText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('forgotPasswordText', 'Forgot Password Link')} isGenerating={generatingId === 'forgotPasswordText-fill'} isTranslating={generatingId === 'forgotPasswordText-translate'} />
                      <LocalizedSettingInput label="Request Page Title" value={settings.forgotPasswordTitle} onChange={v => handleUpdate('forgotPasswordTitle', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('forgotPasswordTitle', 'Forgot Password Title')} isGenerating={generatingId === 'forgotPasswordTitle-fill'} isTranslating={generatingId === 'forgotPasswordTitle-translate'} />
                    </div>
                    <LocalizedSettingInput label="Request Page Instruction" value={settings.forgotPasswordSubtitle} onChange={v => handleUpdate('forgotPasswordSubtitle', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('forgotPasswordSubtitle', 'Forgot Password Subtitle')} isGenerating={generatingId === 'forgotPasswordSubtitle-fill'} isTranslating={generatingId === 'forgotPasswordSubtitle-translate'} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <LocalizedSettingInput label="Send Link Button" value={settings.sendResetLinkButtonText} onChange={v => handleUpdate('sendResetLinkButtonText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('sendResetLinkButtonText', 'Send Reset Link Button')} isGenerating={generatingId === 'sendResetLinkButtonText-fill'} isTranslating={generatingId === 'sendResetLinkButtonText-translate'} />
                      <LocalizedSettingInput label="Back to Login Link" value={settings.backToLoginText} onChange={v => handleUpdate('backToLoginText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('backToLoginText', 'Back to Login Text')} isGenerating={generatingId === 'backToLoginText-fill'} isTranslating={generatingId === 'backToLoginText-translate'} />
                    </div>

                    <LocalizedSettingInput label="Link Sent Success Message" value={settings.resetPasswordSentSuccessText} onChange={v => handleUpdate('resetPasswordSentSuccessText', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('resetPasswordSentSuccessText', 'Reset Password Sent Success')} isGenerating={generatingId === 'resetPasswordSentSuccessText-fill'} isTranslating={generatingId === 'resetPasswordSentSuccessText-translate'} />

                    <div className="pt-4 border-t border-slate-100">
                      <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Error & Security Messages</h4>
                      <div className="space-y-6">
                        <LocalizedSettingInput 
                          label="Account Already Exists Error" 
                          value={settings.userAlreadyExistsErrorText} 
                          onChange={v => handleUpdate('userAlreadyExistsErrorText', v)} 
                          languages={settings.languages} 
                          onAITranslate={() => handleAITranslate('userAlreadyExistsErrorText', 'User Already Exists Error')} 
                          isGenerating={generatingId === 'userAlreadyExistsErrorText-fill'} 
                          isTranslating={generatingId === 'userAlreadyExistsErrorText-translate'} 
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <LocalizedSettingInput 
                            label="Rate Limit Wait Message" 
                            value={settings.rateLimitWaitErrorText} 
                            onChange={v => handleUpdate('rateLimitWaitErrorText', v)} 
                            languages={settings.languages} 
                            onAITranslate={() => handleAITranslate('rateLimitWaitErrorText', 'Rate Limit Wait Error')} 
                            isGenerating={generatingId === 'rateLimitWaitErrorText-fill'} 
                            isTranslating={generatingId === 'rateLimitWaitErrorText-translate'} 
                          />
                          <LocalizedSettingInput 
                            label="Invalid/Expired OTP Error" 
                            value={settings.invalidOtpErrorText} 
                            onChange={v => handleUpdate('invalidOtpErrorText', v)} 
                            languages={settings.languages} 
                            onAITranslate={() => handleAITranslate('invalidOtpErrorText', 'Invalid OTP Error')} 
                            isGenerating={generatingId === 'invalidOtpErrorText-fill'} 
                            isTranslating={generatingId === 'invalidOtpErrorText-translate'} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-zinc-100 pt-8 mt-8">
                      <p className="text-sm font-black uppercase tracking-widest text-zinc-900 mb-6 flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5" /> Set New Password Page
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <LocalizedSettingInput label="Reset Page Title" value={settings.resetPasswordTitle} onChange={v => handleUpdate('resetPasswordTitle', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('resetPasswordTitle', 'Reset Password Title')} isGenerating={generatingId === 'resetPasswordTitle-fill'} isTranslating={generatingId === 'resetPasswordTitle-translate'} />
                        <LocalizedSettingInput label="Update Button Label" value={settings.resetPasswordButtonText} onChange={v => handleUpdate('resetPasswordButtonText', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('resetPasswordButtonText', 'Reset Password Button')} isGenerating={generatingId === 'resetPasswordButtonText-fill'} isTranslating={generatingId === 'resetPasswordButtonText-translate'} />
                        <LocalizedSettingInput label="New Password Field" value={settings.newPasswordLabel} onChange={v => handleUpdate('newPasswordLabel', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('newPasswordLabel', 'New Password Label')} isGenerating={generatingId === 'newPasswordLabel-fill'} isTranslating={generatingId === 'newPasswordLabel-translate'} />
                        <LocalizedSettingInput label="Confirm Field" value={settings.confirmNewPasswordLabel} onChange={v => handleUpdate('confirmNewPasswordLabel', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('confirmNewPasswordLabel', 'Confirm Password Label')} isGenerating={generatingId === 'confirmNewPasswordLabel-fill'} isTranslating={generatingId === 'confirmNewPasswordLabel-translate'} />
                      </div>
                      <div className="mt-8">
                        <LocalizedSettingInput label="Password Reset Final Success" value={settings.passwordResetSuccessText} onChange={v => handleUpdate('passwordResetSuccessText', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('passwordResetSuccessText', 'Password Reset Success Message')} isGenerating={generatingId === 'passwordResetSuccessText-fill'} isTranslating={generatingId === 'passwordResetSuccessText-translate'} />
                      </div>
                    </div>
                  </div>
                </SettingCard>

                <SettingCard id="Authentication" title="Authentication Layout" icon={Lock}>
                  <div className="space-y-6">
                    <p className="text-[12px] text-zinc-500 mb-4 font-medium italic">Change the background image for the login and sign-up pages. Use a high-resolution interior or lifestyle photo for best results.</p>
                    <div className="space-y-4">
                        <div className="aspect-video bg-zinc-50 border border-zinc-100 rounded-md relative group overflow-hidden">
                           {isValidUrl(settings.authBackgroundImage) ? (
                              <Image src={toMediaProxyUrl(settings.authBackgroundImage)} alt="Authentication background" fill className="object-cover" />
                           ) : <ImageIcon className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-200" />}
                           <input type="file" onChange={e => handleImageUpload(e, 'authBackgroundImage')} className="absolute inset-0 opacity-0 cursor-pointer" />
                           <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Upload className="w-5 h-5 text-white" />
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <Info className="w-3.5 h-3.5 text-zinc-500" />
                           <p className="text-xs text-zinc-500 font-medium">Click the preview above to upload a new authentication background image.</p>
                        </div>
                    </div>
                  </div>
                </SettingCard>

                <SettingCard id="PolicyPages" title="Policy Pages" icon={Mail}>
                  <div className="space-y-8">
                    <LocalizedSettingInput label="Privacy Policy Page Title" value={settings.privacyPolicyPageTitle} onChange={v => handleUpdate('privacyPolicyPageTitle', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('privacyPolicyPageTitle', 'Privacy Policy Page Title')} isGenerating={generatingId === 'privacyPolicyPageTitle-fill'} isTranslating={generatingId === 'privacyPolicyPageTitle-translate'} />
                    <LocalizedSettingInput label="Privacy Policy Page Content (Markdown)" value={settings.privacyPolicyPageContent} onChange={v => handleUpdate('privacyPolicyPageContent', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('privacyPolicyPageContent', 'Privacy Policy Page Content')} isGenerating={generatingId === 'privacyPolicyPageContent-fill'} isTranslating={generatingId === 'privacyPolicyPageContent-translate'} />
                    <LocalizedSettingInput label="Cookie Policy Page Title" value={settings.cookiePolicyPageTitle} onChange={v => handleUpdate('cookiePolicyPageTitle', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('cookiePolicyPageTitle', 'Cookie Policy Page Title')} isGenerating={generatingId === 'cookiePolicyPageTitle-fill'} isTranslating={generatingId === 'cookiePolicyPageTitle-translate'} />
                    <LocalizedSettingInput label="Cookie Policy Page Content (Markdown)" value={settings.cookiePolicyPageContent} onChange={v => handleUpdate('cookiePolicyPageContent', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('cookiePolicyPageContent', 'Cookie Policy Page Content')} isGenerating={generatingId === 'cookiePolicyPageContent-fill'} isTranslating={generatingId === 'cookiePolicyPageContent-translate'} />
                    <LocalizedSettingInput label="Terms Page Title" value={settings.termsOfServicePageTitle} onChange={v => handleUpdate('termsOfServicePageTitle', v)} languages={settings.languages} onAITranslate={() => handleAITranslate('termsOfServicePageTitle', 'Terms Page Title')} isGenerating={generatingId === 'termsOfServicePageTitle-fill'} isTranslating={generatingId === 'termsOfServicePageTitle-translate'} />
                    <LocalizedSettingInput label="Terms Page Content (Markdown)" value={settings.termsOfServicePageContent} onChange={v => handleUpdate('termsOfServicePageContent', v)} languages={settings.languages} type="textarea" onAITranslate={() => handleAITranslate('termsOfServicePageContent', 'Terms Page Content')} isGenerating={generatingId === 'termsOfServicePageContent-fill'} isTranslating={generatingId === 'termsOfServicePageContent-translate'} />
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
                             <div key={lang} className="flex items-center gap-2 px-3 py-1 bg-zinc-900 text-white rounded text-xs font-bold uppercase tracking-widest">
                               {lang}
                               {lang !== 'en' && (
                                 <button onClick={() => handleUpdate('languages', settings.languages.filter(l => l !== lang))} className="text-zinc-500 hover:text-white transition-colors">&times;</button>
                               )}
                             </div>
                           ))}
                        </div>
                        <div className="flex items-center gap-3">
                           <input 
                              type="text" 
                              placeholder="Add lang (e.g. fr, de)" 
                              className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-sm text-sm font-medium focus:ring-1 focus:ring-zinc-900 focus:outline-none placeholder:text-zinc-300"
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
                           <p className="text-xs text-zinc-500 font-medium italic">Press Enter to synchronize new locale</p>
                        </div>
                     </div>
                  </SettingCard>
                  
                  <SettingCard id="Shipping" title="Global Shipping Regions" icon={Globe}>
                     <div className="space-y-6">
                        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 sm:p-5 space-y-3">
                           <label className="text-[11px] font-black uppercase tracking-widest text-zinc-900">Add shipping country</label>
                           <div className="flex flex-col sm:flex-row gap-3">
                              <input
                                type="text"
                                list="shipping-country-suggestions"
                                value={shippingCountryDraft}
                                onChange={(e) => setShippingCountryDraft(e.target.value)}
                                placeholder="Type country name or ISO code, e.g. Sweden or SE"
                                className="flex-1 h-11 px-4 bg-white border border-zinc-200 rounded-md text-sm font-medium focus:outline-none focus:border-zinc-900"
                              />
                              <datalist id="shipping-country-suggestions">
                                {shippingCountrySuggestions.map((suggestion) => (
                                  <option key={suggestion} value={suggestion} />
                                ))}
                              </datalist>
                              <button
                                onClick={() => {
                                  const normalizedInput = shippingCountryDraft.replace(/\s*\([A-Z]{2}\)\s*$/, '').trim();
                                  const nextCountry = buildShippingCountryEntry(normalizedInput, settings.languages);
                                  if (!nextCountry) {
                                    toast.error('Enter a country name or ISO code first.');
                                    return;
                                  }

                                  const existingCountries = settings.shippingCountries || [];
                                  const alreadyExists = existingCountries.some(
                                    (country) => country.code.toUpperCase() === nextCountry.code.toUpperCase()
                                  );

                                  if (alreadyExists) {
                                    toast.info(`${nextCountry.name.en || normalizedInput} is already in the shipping list.`);
                                    return;
                                  }

                                  handleUpdate('shippingCountries', [...existingCountries, nextCountry]);
                                  setShippingCountryDraft('');
                                }}
                                className="h-11 px-5 bg-zinc-900 text-white rounded-md text-[11px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add
                              </button>
                           </div>
                           <p className="text-xs text-zinc-500 font-medium">
                             Just enter the country once. The region code and translated labels are prepared automatically.
                           </p>
                        </div>
                        <div className="flex flex-col gap-4">
                           {settings.shippingCountries?.map((country, idx) => (
                             <div key={idx} className="p-4 bg-zinc-50 border border-zinc-100 rounded-md relative group space-y-3">
                               <button onClick={() => handleUpdate('shippingCountries', settings.shippingCountries.filter((_, i) => i !== idx))} className="absolute top-2 right-2 p-1.5 text-zinc-300 hover:text-rose-600 transition-colors">
                                 <Trash2 className="w-3.5 h-3.5" />
                               </button>
                               <div className="flex items-start justify-between gap-4 pr-8">
                                 <div>
                                   <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">ISO Code</p>
                                   <p className="mt-1 text-sm font-bold text-zinc-900">{country.code}</p>
                                 </div>
                                 <div className="text-right">
                                   <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Display Name</p>
                                   <p className="mt-1 text-sm font-bold text-zinc-900">{country.name?.en || Object.values(country.name || {})[0] || country.code}</p>
                                 </div>
                               </div>
                               <div className="flex flex-wrap gap-2">
                                 {settings.languages.map((lang) => (
                                   <span key={`${country.code}-${lang}`} className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-600">
                                     <span className="text-zinc-400">{lang}</span>
                                     <span className="text-zinc-900 normal-case tracking-normal font-medium">
                                       {country.name?.[lang] || country.name?.en || country.code}
                                     </span>
                                   </span>
                                 ))}
                               </div>
                             </div>
                           ))}
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
            <p className="text-xs font-bold text-zinc-900 uppercase tracking-widest leading-none">Global Synchronization</p>
            <p className="text-xs text-zinc-500 font-medium mt-1">Updates to these settings are pushed in real-time to the public storefront Neural Cache. Languages are synced across all active market segments.</p>
         </div>
      </div>
    </div>
  );
}
