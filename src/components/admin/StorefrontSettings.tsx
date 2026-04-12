"use client";
import React, { useState } from 'react';
import { 
  Globe, 
  Layout, 
  Settings, 
  ImageIcon, 
  AlignLeft, 
  Languages, 
  Info, 
  Save, 
  Loader2, 
  Sparkles, 
  Upload, 
  Mail, 
  Calendar, 
  Wand2, 
  Plus, 
  Trash2, 
  X, 
  ShoppingCart,
  ChevronUp,
  ChevronDown,
  Search,
  ChevronRight,
  Star,
  Grid,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  Share2,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useSettingsStore, StorefrontSettings as StorefrontSettingsType, LocalizedString, MenuLink, FooterSection } from '@/store/useSettingsStore';
import { getAI } from '@/lib/gemini';

// --- Sub-components ---

function LocalizedFieldInput({ value, label, onChange, languages, field, handleAITranslateField, settings, setSettings, generating }: { value: LocalizedString, label: string, onChange: (newValue: LocalizedString) => void, languages: string[], field?: string, handleAITranslateField?: any, settings?: StorefrontSettingsType, setSettings?: any, generating?: boolean }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {handleAITranslateField && field && settings && setSettings && (
          <button 
            type="button"
            onClick={() => handleAITranslateField(field, value, label)}
            disabled={generating}
            className="flex items-center px-3 py-1.5 bg-white text-gray-700 rounded text-xs font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <Languages className="w-3 h-3 mr-1.5" />
            AI Translate
          </button>
        )}
      </div>
      <div className="space-y-2">
        {languages.map(lang => (
          <div key={lang} className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500 w-8 uppercase text-center py-1.5 border border-gray-200 rounded bg-gray-50">{lang}</span>
            <input
              type="text"
              value={value[lang] || ''}
              onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
              className="w-full border border-zinc-200 rounded-md px-4 h-[44px] focus:ring-2 focus:ring-zinc-900 outline-none text-sm bg-white"
              placeholder={`Enter ${label} in ${lang.toUpperCase()}...`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const LocalizedInput = ({ field, label, type = 'text', settings, setSettings, generating, handleAIAutoCompleteField, handleAITranslateField, handleSettingsChange }: { field: keyof StorefrontSettingsType, label: string, type?: 'text' | 'textarea', settings: StorefrontSettingsType, setSettings: React.Dispatch<React.SetStateAction<StorefrontSettingsType>>, generating: boolean, handleAIAutoCompleteField: any, handleAITranslateField: any, handleSettingsChange: any }) => {
  const value = settings[field] as LocalizedString;
  return (
    <div className="space-y-5 p-6 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <label className="text-base font-semibold text-gray-900">{label}</label>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            type="button"
            onClick={() => handleAIAutoCompleteField(field, label)}
            disabled={generating}
            className="flex-1 sm:flex-none flex items-center justify-center px-3 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-xs font-medium hover:bg-indigo-100 transition-all disabled:opacity-50"
          >
            <Wand2 className="w-3.5 h-3.5 mr-2" />
            {generating ? '...' : 'Auto-Fill'}
          </button>
          <button 
            type="button"
            onClick={() => handleAITranslateField(field, value, label)}
            disabled={generating}
            className="flex-1 sm:flex-none w-full sm:w-auto flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-4 py-2 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Languages className="w-3.5 h-3.5 mr-2" />
            {generating ? '...' : 'Translate'}
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {settings.languages.map(lang => (
          <div key={lang} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 uppercase">{lang}</span>
            </div>
            {type === 'textarea' ? (
              <textarea
                name={`${field}.${lang}`}
                value={value[lang] || ''}
                onChange={handleSettingsChange}
                rows={3}
                className="w-full border border-zinc-200 rounded-lg p-4 focus:ring-2 focus:ring-zinc-900 outline-none text-sm bg-white resize-none shadow-sm"
                placeholder={`Write ${label.toLowerCase()} in ${lang.toUpperCase()}...`}
              />
            ) : (
              <input
                type="text"
                name={`${field}.${lang}`}
                value={value[lang] || ''}
                onChange={handleSettingsChange}
                className="w-full border border-zinc-200 rounded-lg px-4 h-[44px] focus:ring-2 focus:ring-zinc-900 outline-none text-sm bg-white shadow-sm"
                placeholder={`Enter ${label.toLowerCase()} in ${lang.toUpperCase()}...`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

function TranslationManager({ settings, setSettings }: { settings: StorefrontSettingsType, setSettings: React.Dispatch<React.SetStateAction<StorefrontSettingsType>> }) {
  const [searchQuery, setSearchQuery] = useState('');

  const renderLocalizedInputs = (data: any, path: string = ''): React.ReactNode[] => {
    let nodes: React.ReactNode[] = [];

    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        nodes = [...nodes, ...renderLocalizedInputs(item, `${path}[${index}]`)];
      });
    } else if (typeof data === 'object' && data !== null) {
      if ('en' in data && !('href' in data) && !('links' in data)) {
        // It's a localized string
        const label = path || 'General';
        if (label.toLowerCase().includes(searchQuery.toLowerCase())) {
          nodes.push(
            <div key={path} className="py-4 border-b border-gray-100 hover:border-brand-ink transition-colors group ">
              <h3 className="text-xs font-medium text-gray-500 mb-4 group-hover:text-gray-900 transition-colors">{path.replace(/\[(\d+)\]/g, ' #$1').replace(/\./g, ' > ')}</h3>
              <LocalizedFieldInput 
                value={data as LocalizedString} 
                label={path.split('.').pop() || path} 
                onChange={(newValue) => {
                  setSettings(prev => {
                    const newSettings = JSON.parse(JSON.stringify(prev));
                    const setNested = (obj: any, pathStr: string, val: any) => {
                      const keys = pathStr.split(/[.\[\]]/).filter(Boolean);
                      let current = obj;
                      for (let i = 0; i < keys.length - 1; i++) {
                        current = current[keys[i]];
                      }
                      current[keys[keys.length - 1]] = val;
                    };
                    setNested(newSettings, path, newValue);
                    return newSettings;
                  });
                }}
                languages={settings.languages}
              />
            </div>
          );
        }
      } else {
        Object.entries(data).forEach(([key, value]) => {
          nodes = [...nodes, ...renderLocalizedInputs(value, path ? `${path}.${key}` : key)];
        });
      }
    }

    return nodes;
  };

  const allInputs = renderLocalizedInputs(settings);

  return (
    <div className="space-y-8 pt-8 border-t border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Translation Manager</h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">Review and edit all storefront translations in one flat view.</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search all fields..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-zinc-200 rounded-lg pl-11 pr-4 h-[44px] focus:ring-2 focus:ring-zinc-900 outline-none text-sm bg-white"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {allInputs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {allInputs}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded border border-dashed border-gray-200">
            <div className="w-12 h-12 bg-white rounded flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm font-medium">No matching fields found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Component ---

import { AdminHeader } from './AdminHeader';

export function StorefrontSettings({ handleSaveSettings }: { handleSaveSettings: (settings: StorefrontSettingsType) => Promise<void> }) {
  const { settings: initialSettings } = useSettingsStore();
  const [settings, setSettings] = useState<StorefrontSettingsType>(initialSettings);
  const [activeTab, setActiveTab] = useState<'general' | 'layout' | 'homepage' | 'checkout' | 'footer' | 'translations'>('general');
  const [generating, setGenerating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [field, lang] = name.split('.');
      setSettings(prev => ({
        ...prev,
        [field]: {
          ...(prev[field as keyof StorefrontSettingsType] as LocalizedString),
          [lang]: value
        }
      }));
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof StorefrontSettingsType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(field as string);
    const toastId = toast.loading('Uploading image...');

    try {
      const { uploadImageWithTimeout } = await import('../../lib/upload');
      const url = await uploadImageWithTimeout(file, `storefront/${Date.now()}_${file.name}`);
      setSettings(prev => ({ ...prev, [field]: url }));
      toast.success('Image uploaded successfully', { id: toastId });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || 'Failed to upload image', { id: toastId });
    } finally {
      setUploadingImage(null);
    }
  };

  const handleAIAutoCompleteField = async (field: keyof StorefrontSettingsType, label: string) => {
    setGenerating(true);
    const toastId = toast.loading(`AI is generating ${label}...`);
    try {
      const ai = getAI();
      const prompt = `Generate a creative and professional ${label} for a premium minimalist e-commerce store named "${settings.storeName.en}".
      Return ONLY the text content, no other commentary.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });
      
      const text = response.text || '';
      setSettings(prev => ({
        ...prev,
        [field]: {
          ...(prev[field] as LocalizedString),
          en: text.trim()
        }
      }));
      toast.success(`${label} generated!`, { id: toastId });
    } catch (error) {
      console.error("AI AutoComplete error:", error);
      toast.error('Failed to generate content', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleAITranslateField = async (field: keyof StorefrontSettingsType, value: LocalizedString, label: string) => {
    if (!value.en) {
      toast.error('Please provide an English version first.');
      return;
    }
    
    setGenerating(true);
    const toastId = toast.loading(`Translating ${label} to all languages...`);
    
    try {
      const ai = getAI();
      const prompt = `Translate the following text into these languages: ${settings.languages.filter(l => l !== 'en').join(', ')}.
      Text: "${value.en}"
      Return ONLY a JSON object where keys are language codes and values are the translations.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const translations = JSON.parse(response.text || '{}');
      setSettings(prev => ({
        ...prev,
        [field]: {
          ...value,
          ...translations
        }
      }));
      toast.success(`${label} translated!`, { id: toastId });
    } catch (error) {
      console.error("AI Translate error:", error);
      toast.error('Failed to translate content', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleAddFooterSection = () => {
    const newSection: FooterSection = {
      title: { en: 'New Section' },
      links: [{ label: { en: 'Home' }, href: '/' }]
    };
    setSettings(prev => ({
      ...prev,
      footerSections: [...(prev.footerSections || []), newSection]
    }));
  };

  const handleRemoveFooterSection = (index: number) => {
    setSettings(prev => ({
      ...prev,
      footerSections: prev.footerSections.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateFooterSectionTitle = (index: number, lang: string, value: string) => {
    setSettings(prev => {
      const newSections = [...prev.footerSections];
      newSections[index].title[lang] = value;
      return { ...prev, footerSections: newSections };
    });
  };

  const handleAddFooterLink = (sectionIndex: number) => {
    setSettings(prev => {
      const newSections = [...prev.footerSections];
      newSections[sectionIndex].links.push({ label: { en: 'New Link' }, href: '#' });
      return { ...prev, footerSections: newSections };
    });
  };

  const handleUpdateFooterLink = (sectionIndex: number, linkIndex: number, field: 'label' | 'href', lang: string, value: string) => {
    setSettings(prev => {
      const newSections = [...prev.footerSections];
      if (field === 'label') {
        newSections[sectionIndex].links[linkIndex].label[lang] = value;
      } else {
        newSections[sectionIndex].links[linkIndex].href = value;
      }
      return { ...prev, footerSections: newSections };
    });
  };

  const handleRemoveFooterLink = (sectionIndex: number, linkIndex: number) => {
    setSettings(prev => {
      const newSections = [...prev.footerSections];
      newSections[sectionIndex].links = newSections[sectionIndex].links.filter((_, i) => i !== linkIndex);
      return { ...prev, footerSections: newSections };
    });
  };

  const handleAddNavbarLink = () => {
    setSettings(prev => ({
      ...prev,
      navbarLinks: [...(prev.navbarLinks || []), { label: { en: 'New Link' }, href: '#' }]
    }));
  };

  const handleUpdateNavbarLink = (index: number, field: 'label' | 'href', lang: string, value: string) => {
    setSettings(prev => {
      const newLinks = [...prev.navbarLinks];
      if (field === 'label') {
        newLinks[index].label[lang] = value;
      } else {
        newLinks[index].href = value;
      }
      return { ...prev, navbarLinks: newLinks };
    });
  };

  const handleRemoveNavbarLink = (index: number) => {
    setSettings(prev => ({
      ...prev,
      navbarLinks: prev.navbarLinks.filter((_, i) => i !== index)
    }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'layout', label: 'Layout & Navigation', icon: Layout },
    { id: 'homepage', label: 'Homepage Content', icon: ImageIcon },
    { id: 'checkout', label: 'Checkout & Cart', icon: ShoppingCart },
    { id: 'footer', label: 'Footer', icon: AlignLeft },
    { id: 'translations', label: 'Translations', icon: Languages },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header Section */}
      <AdminHeader 
        title="Storefront Settings"
        description="Manage your store's visual identity and customer experience"
        primaryAction={{
          label: "Save Changes",
          icon: Save,
          onClick: () => handleSaveSettings(settings)
        }}
        secondaryActions={[
          { label: 'View Store', icon: Globe, onClick: () => window.open('/', '_blank') }
        ]}
      />

      {/* Responsive Tab Bar / Accordion */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row w-full border-b border-zinc-200">
          {tabs.map((tab) => (
            <React.Fragment key={tab.id}>
              {/* Mobile Accordion Header */}
              <button
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`sm:hidden w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-all border border-zinc-200 rounded-lg mb-2 ${
                  activeTab === tab.id
                    ? 'bg-zinc-900 text-white'
                    : 'bg-white text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </div>
                {activeTab === tab.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {/* Desktop Tab */}
              <button
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`hidden sm:flex flex-1 items-center justify-center gap-2 px-4 h-[44px] text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'text-zinc-900 border-b-2 border-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-w-0">
        <div className="">
          <div className="py-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'general' && (
                    <div className="space-y-8">
                      <section className="py-8 border-b-2 border-gray-200 last:border-0">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded bg-brand-ink flex items-center justify-center">
                            <Settings className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Store Identity</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-8">
                          <LocalizedInput field="storeName" label="Store Name" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          
                          <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-900">Store Logo</label>
                            <div className="flex flex-col md:flex-row items-start gap-8">
                              <div className="w-40 h-40 rounded border border-dashed border-gray-200 bg-white flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-brand-ink transition-colors">
                                {settings.logoImage ? (
                                  <img src={settings.logoImage} alt="Logo" className="w-full h-full object-contain p-4" referrerPolicy="no-referrer" />
                                ) : (
                                  <ImageIcon className="w-10 h-10 text-gray-200" />
                                )}
                                <div className="absolute inset-0 bg-brand-ink/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                  <Upload className="w-6 h-6 text-white" />
                                  <span className="text-xs font-medium text-white">Upload Logo</span>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(e, 'logoImage')}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                              </div>
                              <div className="flex-1 w-full space-y-4">
                                <div className="space-y-1.5">
                                  <label className="text-xs font-medium text-gray-500">Logo URL</label>
                                  <input
                                    type="text"
                                    name="logoImage"
                                    value={settings.logoImage}
                                    onChange={handleSettingsChange}
                                    placeholder="https://example.com/logo.png"
                                    className="pl-10 pr-4 border-gray-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 w-full sm:w-auto flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-6 py-3 text-sm font-medium rounded-lg transition-colors"
                                  />
                                </div>
                                <div className="pt-4">
                                  <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                    Recommended: 512x512px. Transparent PNG or SVG preferred for best 2D look.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section className="py-8 border-b border-gray-200/60 last:border-0">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded bg-brand-ink flex items-center justify-center">
                            <Globe className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">SEO & Search</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-6 py-6 border-b border-gray-100 last:border-0 ">
                          <LocalizedInput field="seoTitle" label="SEO Title" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="seoDescription" label="SEO Description" type="textarea" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                        </div>
                      </section>

                      <section className="py-8 border-b border-gray-200/60 last:border-0">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded bg-brand-ink flex items-center justify-center">
                            <AlignLeft className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Common UI Labels</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-gray-100 last:border-0 ">
                          <LocalizedInput field="searchText" label="Search Button" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="searchPlaceholder" label="Search Placeholder" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="loginText" label="Login Button" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="menuText" label="Menu Label" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="viewAllText" label="View All Label" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="shopNowText" label="Shop Now Label" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="accountLabel" label="Account Label" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="categoriesText" label="Categories Label" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="filterText" label="Filter Label" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="sortByText" label="Sort Label" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="sortNewestText" label="Newest Label" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="sortPriceAscText" label="Price Low to High Label" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="sortPriceDescText" label="Price High to Low Label" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="priceText" label="Price Label" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="sizesText" label="Size Label" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="colorsText" label="Color Label" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                        </div>
                      </section>

                      <section className="py-8 border-b border-gray-200/60 last:border-0">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded bg-brand-ink flex items-center justify-center">
                            <Languages className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Supported Languages</h3>
                        </div>
                        <div className="space-y-6">
                          <div className="flex flex-wrap gap-3">
                            {settings.languages.map(lang => (
                              <div key={lang} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
                                <span className="text-xs font-medium">{lang}</span>
                                {lang !== 'en' && (
                                  <button 
                                    onClick={() => setSettings(prev => ({ ...prev, languages: prev.languages.filter(l => l !== lang) }))}
                                    className="text-gray-300 hover:text-red-500 transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-3">
                            <input 
                              type="text" 
                              placeholder="Add lang (e.g. fr)"
                              className="pl-10 pr-4 border-gray-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 w-full sm:w-auto flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-6 py-3 text-sm font-medium rounded-md transition-colors"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const val = (e.target as HTMLInputElement).value.toLowerCase().trim();
                                  if (val && !settings.languages.includes(val)) {
                                    setSettings(prev => ({ ...prev, languages: [...prev.languages, val] }));
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }
                              }}
                            />
                            <p className="text-xs text-gray-400 font-medium">Press Enter to add</p>
                          </div>
                        </div>
                      </section>
                    </div>
                  )}

                  {activeTab === 'layout' && (
                    <div className="space-y-8">
                      <section className="py-8 border-b border-gray-200/60 last:border-0">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-brand-ink flex items-center justify-center">
                              <Layout className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Navigation Menu</h3>
                          </div>
                          <button
                            onClick={handleAddNavbarLink}
                            className="gap-2 w-full sm:w-auto flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-6 py-3 text-sm font-medium rounded-md transition-colors"
                          >
                            <Plus className="w-4 h-4" /> Add Link
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          {settings.navbarLinks.map((link, index) => (
                            <div key={index} className="py-6 border-b border-gray-100 last:border-0  flex flex-col md:flex-row gap-6 items-start relative group">
                              <div className="flex-1 w-full space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {settings.languages.map(lang => (
                                    <div key={lang} className="space-y-1.5">
                                      <label className="text-xs font-medium text-gray-500">{lang} Label</label>
                                      <input
                                        type="text"
                                        value={link.label[lang] || ''}
                                        onChange={(e) => handleUpdateNavbarLink(index, 'label', lang, e.target.value)}
                                        className="border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-ink/20 focus:border-brand-ink w-full sm:w-auto flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-6 py-3 text-sm font-medium rounded-lg transition-colors"
                                        placeholder={`Link in ${lang.toUpperCase()}`}
                                      />
                                    </div>
                                  ))}
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-xs font-medium text-gray-500">URL / Path</label>
                                  <input
                                    type="text"
                                    value={link.href}
                                    onChange={(e) => handleUpdateNavbarLink(index, 'href', 'en', e.target.value)}
                                    className="border-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-brand-ink/20 focus:border-brand-ink w-full sm:w-auto flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-6 py-3 text-sm font-medium rounded-lg transition-colors"
                                    placeholder="/shop, /about, etc."
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveNavbarLink(index)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-all md:self-center"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  )}

                  {activeTab === 'homepage' && (
                    <div className="space-y-10">
                      {/* Hero Section */}
                      <section className="py-8 border-b border-gray-200/60 last:border-0">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 rounded bg-brand-ink flex items-center justify-center">
                            <Layout className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Hero Section</h3>
                        </div>
                        <p className="text-sm text-gray-500">The Hero section content is managed via the Collections settings.</p>
                      </section>

                      {/* Featured Section */}
                      <section className="py-8 border-b border-gray-200/60 last:border-0">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 rounded bg-brand-ink flex items-center justify-center">
                            <Star className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Featured Products Section</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <LocalizedInput field="featuredTopSubtitle" label="Featured Top Subtitle" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="featuredTitle" label="Featured Title" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="featuredSubtitle" label="Featured Subtitle" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                        </div>
                      </section>

                      {/* Future Products Section */}
                      <section className="py-8 border-b border-gray-200/60 last:border-0">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 rounded bg-brand-ink flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Future Products / Preview</h3>
                        </div>
                        
                        <div className="space-y-10">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <LocalizedInput field="previewTitle" label="Preview Label" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                            <LocalizedInput field="futureTitle" label="Future Title" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                            <div className="md:col-span-2">
                              <LocalizedInput field="futureSubtitle" label="Future Subtitle" type="textarea" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Future Product 1 */}
                            <div className="space-y-6 pt-6 border-t border-gray-100">
                              <h4 className="text-xs font-medium text-gray-500">Future Item 1</h4>
                              <div className="aspect-[4/3] rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                                {settings.futureImage1 ? (
                                  <img src={settings.futureImage1} alt="Future 1" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <ImageIcon className="w-8 h-8 text-gray-200" />
                                )}
                                
                                {/* Design Preview Overlay */}
                                {settings.futureImage1 && (
                                  <>
                                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/50 to-transparent opacity-80 pointer-events-none"></div>
                                    <div className="absolute top-6 left-6 right-6 pointer-events-none">
                                      <p className="text-white/90 font-medium text-xs tracking-widest uppercase mb-1">{settings.futureProduct1Date?.en || 'Date'}</p>
                                      <h3 className="text-white text-xl font-bold tracking-tight">{settings.futureProduct1Title?.en || 'Title'}</h3>
                                    </div>
                                    <div className="absolute bottom-6 right-6 bg-white/20 backdrop-blur-md border border-white/30 p-3 rounded-full pointer-events-none">
                                      <ArrowRight className="w-5 h-5 text-white" />
                                    </div>
                                  </>
                                )}

                                <div className="absolute inset-0 bg-brand-ink/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                  <Upload className="w-5 h-5 text-white" />
                                  <span className="text-xs font-medium text-white">Upload</span>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(e, 'futureImage1')}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                              </div>
                              <div className="space-y-4">
                                <LocalizedInput field="futureProduct1Title" label="Title" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                                <LocalizedInput field="futureProduct1Date" label="Release Date" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                                  <input
                                    type="text"
                                    value={settings.futureProduct1Link || ''}
                                    onChange={(e) => setSettings(prev => ({ ...prev, futureProduct1Link: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-ink focus:border-brand-ink sm:text-sm"
                                    placeholder="/products"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Future Product 2 */}
                            <div className="space-y-6 pt-6 border-t border-gray-100">
                              <h4 className="text-xs font-medium text-gray-500">Future Item 2</h4>
                              <div className="aspect-[4/3] rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                                {settings.futureImage2 ? (
                                  <img src={settings.futureImage2} alt="Future 2" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <ImageIcon className="w-8 h-8 text-gray-200" />
                                )}

                                {/* Design Preview Overlay */}
                                {settings.futureImage2 && (
                                  <>
                                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/50 to-transparent opacity-80 pointer-events-none"></div>
                                    <div className="absolute top-6 left-6 right-6 pointer-events-none">
                                      <p className="text-white/90 font-medium text-xs tracking-widest uppercase mb-1">{settings.futureProduct2Date?.en || 'Date'}</p>
                                      <h3 className="text-white text-xl font-bold tracking-tight">{settings.futureProduct2Title?.en || 'Title'}</h3>
                                    </div>
                                    <div className="absolute bottom-6 right-6 bg-white/20 backdrop-blur-md border border-white/30 p-3 rounded-full pointer-events-none">
                                      <ArrowRight className="w-6 h-6 text-white" />
                                    </div>
                                  </>
                                )}

                                <div className="absolute inset-0 bg-brand-ink/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                  <Upload className="w-5 h-5 text-white" />
                                  <span className="text-xs font-medium text-white">Upload</span>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(e, 'futureImage2')}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                              </div>
                              <div className="space-y-4">
                                <LocalizedInput field="futureProduct2Title" label="Title" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                                <LocalizedInput field="futureProduct2Date" label="Release Date" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                                  <input
                                    type="text"
                                    value={settings.futureProduct2Link || ''}
                                    onChange={(e) => setSettings(prev => ({ ...prev, futureProduct2Link: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-ink focus:border-brand-ink sm:text-sm"
                                    placeholder="/products"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Collection Section */}
                      <section className="py-8 border-b border-gray-200/60 last:border-0">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 rounded bg-brand-ink flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Collection Section</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <LocalizedInput field="collectionTopSubtitle" label="Collection Top Subtitle" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="collectionTitle" label="Collection Title" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="collectionSubtitle" label="Collection Subtitle" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                        </div>
                      </section>

                      {/* Newsletter Section */}
                      <section className="py-8 border-b border-gray-200/60 last:border-0">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 rounded bg-brand-ink flex items-center justify-center">
                            <Mail className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Newsletter Section</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <LocalizedInput field="newsletterSectionTitle" label="Section Title" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="newsletterSectionSubtitle" label="Section Subtitle" type="textarea" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="newsletterPlaceholder" label="Input Placeholder" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="newsletterButtonText" label="Button Text" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                        </div>
                      </section>

                    </div>
                  )}

                  {activeTab === 'checkout' && (
                    <div className="space-y-10">
                      {/* Cart Settings */}
                      <section className="py-8 border-b border-gray-200/60 last:border-0">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 rounded bg-brand-ink flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Cart Settings</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <LocalizedInput field="cartTitle" label="Cart Title" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="cartEmptyMessage" label="Empty Cart Message" type="textarea" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="addedToCartText" label="Added to Cart Text" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="addedToCartConfirmationText" label="Confirmation Message" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="removeText" label="Remove Button" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="subtotalText" label="Subtotal Label" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                        </div>
                      </section>

                      {/* Checkout Labels */}
                      <section className="py-8 border-b border-gray-200/60 last:border-0">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 rounded bg-brand-ink flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Checkout Labels</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <LocalizedInput field="checkoutButtonText" label="Checkout Button" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="proceedToPaymentText" label="Proceed to Payment" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="continueShoppingText" label="Continue Shopping" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="calculatedAtCheckoutText" label="Calculated at Checkout" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="shippingText" label="Shipping Label" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="totalText" label="Total Label" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                        </div>
                      </section>

                      {/* Summary & Forms */}
                      <section className="py-8 border-b border-gray-200/60 last:border-0">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 rounded bg-brand-ink flex items-center justify-center">
                            <Info className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Summary & Forms</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <LocalizedInput field="orderSummaryText" label="Order Summary Title" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="shippingInformationText" label="Shipping Info Title" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="fullNameLabel" label="Full Name Label" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="addressLabel" label="Address Label" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="cityLabel" label="City Label" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="postalCodeLabel" label="Postal Code Label" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                        </div>
                      </section>

                      {/* Payment & Status */}
                      <section className="py-8 border-b border-gray-200/60 last:border-0">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 rounded bg-brand-ink flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Payment & Status</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <LocalizedInput field="completePaymentText" label="Complete Payment" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="processingText" label="Processing Text" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="paymentSuccessText" label="Payment Success" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="paymentErrorText" label="Payment Error" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="orderPlacedSuccessText" label="Order Placed Success" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                        </div>
                      </section>
                    </div>
                  )}

                  {activeTab === 'footer' && (
                    <div className="space-y-10">
                      <section className="py-8 border-b border-gray-200/60 last:border-0">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 rounded bg-brand-ink flex items-center justify-center">
                            <AlignLeft className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Footer Content</h3>
                        </div>
                        
                        <div className="space-y-6">
                          <LocalizedInput field="footerDescription" label="Footer Description" type="textarea" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                          <LocalizedInput field="footerCopyright" label="Copyright Text" settings={settings} setSettings={setSettings} generating={generating} handleAIAutoCompleteField={handleAIAutoCompleteField} handleAITranslateField={handleAITranslateField} handleSettingsChange={handleSettingsChange} />
                        </div>
                      </section>

                      <section className="py-8 border-b border-gray-200/60 last:border-0">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 rounded bg-brand-ink flex items-center justify-center">
                            <Share2 className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Social Media Links</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {['Instagram', 'TikTok', 'Facebook', 'Twitter'].map(social => (
                            <div key={social} className="space-y-1.5">
                              <label className="block text-xs font-medium text-gray-500">{social}</label>
                              <input
                                type="text"
                                name={`social${social}`}
                                value={settings[`social${social}` as keyof StorefrontSettingsType] as string}
                                onChange={handleSettingsChange}
                                className="pl-10 pr-4 border-gray-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 w-full sm:w-auto flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-6 py-3 text-sm font-medium rounded-lg transition-colors"
                                placeholder={`https://${social.toLowerCase()}.com/...`}
                              />
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="py-8 border-b border-gray-200/60 last:border-0">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-brand-ink flex items-center justify-center">
                              <Layout className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Footer Menu Sections</h3>
                          </div>
                          <button
                            onClick={handleAddFooterSection}
                            className="gap-2 w-full sm:w-auto flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-6 py-3 text-sm font-medium rounded-md transition-colors"
                          >
                            <Plus className="w-4 h-4" /> Add Section
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {(settings.footerSections || []).map((section, sectionIndex) => (
                            <div key={sectionIndex} className="py-6 border-b border-gray-100 last:border-0 space-y-6 relative group">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <LocalizedFieldInput 
                                    value={section.title} 
                                    label="Section Title" 
                                    onChange={(newValue) => {
                                      setSettings(prev => {
                                        const newSections = [...prev.footerSections];
                                        newSections[sectionIndex].title = newValue;
                                        return { ...prev, footerSections: newSections };
                                      });
                                    }}
                                    languages={settings.languages}
                                  />
                                </div>
                                <button
                                  onClick={() => handleRemoveFooterSection(sectionIndex)}
                                  className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors mt-8 border border-gray-100"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>

                              <div className="space-y-4">
                                {section.links.map((link, linkIndex) => (
                                  <div key={linkIndex} className="bg-gray-50/50 p-4 rounded border border-gray-100 space-y-4 relative group/link">
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-medium text-gray-500">Link #{linkIndex + 1}</span>
                                      <button
                                        onClick={() => handleRemoveFooterLink(sectionIndex, linkIndex)}
                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <LocalizedFieldInput 
                                      value={link.label} 
                                      label="Link Label" 
                                      onChange={(newValue) => {
                                        setSettings(prev => {
                                          const newSections = [...prev.footerSections];
                                          newSections[sectionIndex].links[linkIndex].label = newValue;
                                          return { ...prev, footerSections: newSections };
                                        });
                                      }}
                                      languages={settings.languages}
                                    />
                                    <div className="space-y-1.5">
                                      <label className="block text-xs font-medium text-gray-500">URL</label>
                                      <input
                                        type="text"
                                        value={link.href}
                                        onChange={(e) => handleUpdateFooterLink(sectionIndex, linkIndex, 'href', 'en', e.target.value)}
                                        className="border-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-brand-ink/20 focus:border-brand-ink w-full sm:w-auto flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-6 py-3 text-sm font-medium rounded-lg transition-colors"
                                        placeholder="/about, /contact, etc."
                                      />
                                    </div>
                                  </div>
                                ))}
                                <button
                                  onClick={() => handleAddFooterLink(sectionIndex)}
                                  className="w-full py-3 border border-dashed border-gray-200 rounded text-xs font-medium text-gray-400 hover:text-gray-900 hover:border-brand-ink transition-all flex items-center justify-center gap-2"
                                >
                                  <Plus className="w-4 h-4" /> Add Link
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  )}

                  {activeTab === 'translations' && (
                    <TranslationManager settings={settings} setSettings={setSettings} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    );
  }
