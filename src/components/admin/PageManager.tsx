"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { 
  Plus, 
  RefreshCw, 
  Download, 
  FileCode, 
  Edit, 
  Trash2, 
  Wand2, 
  Languages, 
  X 
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/hooks/useDebounce';
import { useCustomConfirm } from '@/components/ConfirmationContext';
import { useSettingsStore, LocalizedString } from '@/store/useSettingsStore';
import { getAI } from '@/lib/gemini';
import { StaticPage } from '@/types';
import { downloadXLSX } from '@/utils/export';
import { handleSupabaseError, OperationType } from '@/utils/supabaseErrorHandler';

export function PageManager() {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const customConfirm = useCustomConfirm();
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<StaticPage | null>(null);
  const [activeTranslationLang, setActiveTranslationLang] = useState<string | null>(null);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const supabase = createClient();

  const settings = useSettingsStore((state) => state.settings);
  const languages = settings.languages || ['en'];
  
  const [formData, setFormData] = useState<{
    title: LocalizedString;
    slug: string;
    content: LocalizedString;
  }>({
    title: { en: '' },
    slug: '',
    content: { en: '' }
  });

  const filteredPages = pages.filter(page => {
    const searchLower = debouncedSearchQuery.toLowerCase();
    return (
      (page.title.en && page.title.en.toLowerCase().includes(searchLower)) ||
      (page.title.sv && page.title.sv.toLowerCase().includes(searchLower)) ||
      (page.slug && page.slug.toLowerCase().includes(searchLower))
    );
  });

  const toggleAllPages = () => {
    if (selectedPages.length === pages.length) {
      setSelectedPages([]);
    } else {
      setSelectedPages(pages.map(p => p.id!));
    }
  };

  const togglePageSelection = (id: string) => {
    if (selectedPages.includes(id)) {
      setSelectedPages(selectedPages.filter(pId => pId !== id));
    } else {
      setSelectedPages([...selectedPages, id]);
    }
  };

  const deleteSelectedPages = async () => {
    const confirmed = await customConfirm('Delete Pages', `Are you sure you want to delete ${selectedPages.length} pages?`);
    if (!confirmed) return;

    const toastId = toast.loading('Deleting pages...');
    try {
      await supabase.from('pages').delete().in('id', selectedPages);
      toast.success('Pages deleted successfully', { id: toastId });
      setSelectedPages([]);
      const { data } = await supabase.from('pages').select('*').order('updated_at', { ascending: false });
      if (data) setPages(data as StaticPage[]);
    } catch (error) {
      console.error("Error deleting pages:", error);
      toast.error('Failed to delete pages', { id: toastId });
    }
  };

  const handleAIAutoComplete = async () => {
    if (!formData.title.en) {
      toast.error('Please provide an English title first.');
      return;
    }
    setGenerating(true);
    const toastId = toast.loading('AI is generating content...');
    try {
      const ai = getAI();
      const prompt = `Generate professional content for a static page titled "${formData.title.en}" for an e-commerce store.
      Return ONLY the markdown content, no other commentary.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });
      
      const text = response.text || '';
      setFormData(prev => ({
        ...prev,
        content: {
          ...prev.content,
          en: text.trim()
        }
      }));
      toast.success('Content generated!', { id: toastId });
    } catch (error) {
      console.error("AI AutoComplete error:", error);
      toast.error('Failed to generate content', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleAITranslate = async () => {
    const defaultLang = languages[0] || 'en';
    if (!formData.title[defaultLang] || !formData.content[defaultLang]) {
      toast.error(`Please provide ${defaultLang.toUpperCase()} title and content first.`);
      return;
    }
    
    setGenerating(true);
    const toastId = toast.loading('Translating to all languages...');
    
    try {
      const ai = getAI();
      const prompt = `Translate the following title and content into these languages: ${languages.filter(l => l !== defaultLang).join(', ')}.
      Title: "${formData.title[defaultLang]}"
      Content: "${formData.content[defaultLang]}"
      Return ONLY a JSON object matching this structure:
      {
        "title": { "langCode": "translated title" },
        "content": { "langCode": "translated content" }
      }`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const translations = JSON.parse(response.text || '{}');
      setFormData(prev => ({
        ...prev,
        title: {
          ...prev.title,
          ...(translations.title || {})
        },
        content: {
          ...prev.content,
          ...(translations.content || {})
        }
      }));
      toast.success('Translated successfully!', { id: toastId });
    } catch (error) {
      console.error("AI Translate error:", error);
      toast.error('Failed to translate content', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    const fetchPages = async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) {
        handleSupabaseError(error, OperationType.LIST, 'pages');
      } else {
        setPages(data as StaticPage[]);
      }
    };
    fetchPages();
  }, [supabase]);

  const handleDelete = async (id: string) => {
    const confirmed = await customConfirm('Delete Page', 'Are you sure you want to delete this page?');
    if (confirmed) {
      try {
        await supabase.from('pages').delete().eq('id', id);
        setPages(prev => prev.filter(p => p.id !== id));
        toast.success('Page deleted');
      } catch (error) {
        handleSupabaseError(error, OperationType.DELETE, 'pages');
        toast.error('Failed to delete page');
      }
    }
  };

  const handleEdit = (page: StaticPage) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingPage(null);
    setFormData({ title: { en: '' }, slug: '', content: { en: '' } });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const defaultLang = languages[0] || 'en';
      const pageData = {
        title: formData.title,
        slug: formData.slug || formData.title[defaultLang]?.toLowerCase().replace(/\s+/g, '-'),
        content: formData.content,
        updated_at: new Date().toISOString()
      };

      if (editingPage?.id) {
        await supabase.from('pages').update(pageData).eq('id', editingPage.id);
        toast.success('Page updated successfully');
      } else {
        await supabase.from('pages').insert(pageData);
        toast.success('Page added successfully');
      }
      
      const { data } = await supabase.from('pages').select('*').order('updated_at', { ascending: false });
      if (data) setPages(data as StaticPage[]);
      
      setIsModalOpen(false);
    } catch (error) {
      console.error("Save error:", error);
      toast.error('Failed to save page');
    }
  };

  const handleSeedPages = async () => {
    setSeeding(true);
    const toastId = toast.loading('Seeding default pages...');
    try {
      const defaultPages = [
        { title: { en: 'Support' }, slug: 'support', content: { en: '# Support\n\nHow can we help you today?' } },
        { title: { en: 'FAQ' }, slug: 'faq', content: { en: '# Frequently Asked Questions\n\nFind answers to common questions here.' } },
        { title: { en: 'Shipping & Returns' }, slug: 'shipping-returns', content: { en: '# Shipping & Returns\n\nOur policies on shipping and returns.' } },
        { title: { en: 'Contact Us' }, slug: 'contact', content: { en: '# Contact Us\n\nGet in touch with our team.' } },
        { title: { en: 'Privacy Policy' }, slug: 'privacy-policy', content: { en: '# Privacy Policy\n\nYour privacy is important to us.' } }
      ];

      for (const page of defaultPages) {
        const { data: existing } = await supabase
          .from('pages')
          .select('id')
          .eq('slug', page.slug)
          .maybeSingle();
        
        if (!existing) {
          await supabase.from('pages').insert({
            ...page,
            updated_at: new Date().toISOString()
          });
        }
      }
      
      const { data } = await supabase.from('pages').select('*').order('updated_at', { ascending: false });
      if (data) setPages(data as StaticPage[]);
      
      toast.success('Default pages seeded successfully!', { id: toastId });
    } catch (error) {
      console.error("Seeding error:", error);
      toast.error('Failed to seed pages', { id: toastId });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader 
        title="Pages"
        description="Manage static pages like About, Contact, and Policies"
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Search pages..."
        }}
        primaryAction={{
          label: "Add Page",
          icon: Plus,
          onClick: handleAddNew
        }}
        secondaryActions={[
          { label: 'Seed Defaults', icon: RefreshCw, onClick: handleSeedPages },
          { label: 'Export XLSX', icon: Download, onClick: () => downloadXLSX(filteredPages, 'pages') }
        ]}
        statsLabel={`${filteredPages.length} pages`}
      />
      
      <div className="py-8 border-b border-gray-200/60 last:border-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-6 py-4 font-bold">
                  <input type="checkbox" checked={selectedPages.length === pages.length && pages.length > 0} onChange={toggleAllPages} className="w-5 h-5 rounded border-zinc-300 cursor-pointer" />
                </th>
                <th className="px-6 py-4 font-bold">Title</th>
                <th className="px-6 py-4 font-bold">Slug</th>
                <th className="px-6 py-4 font-bold">Last Updated</th>
                <th className="px-6 py-4 font-bold text-right">
                  {selectedPages.length > 0 && (
                    <button onClick={deleteSelectedPages} className="w-full sm:w-auto flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/50 px-6 py-3 text-sm font-medium rounded-md transition-colors">
                      Delete ({selectedPages.length})
                    </button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredPages.map((page) => (
                <tr key={page.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-6 py-4">
                    <input type="checkbox" checked={selectedPages.includes(page.id!)} onChange={() => togglePageSelection(page.id!)} className="w-5 h-5 rounded border-zinc-300 cursor-pointer" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded bg-zinc-100 flex items-center justify-center text-zinc-900 shrink-0">
                        <FileCode className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-zinc-900">{page.title[languages[0]] || page.title['en']}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500 font-mono">
                    <span className="bg-zinc-100 px-2 py-1 rounded">/{page.slug}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600">
                    {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(page)}
                        className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
                        title="Edit Page"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(page.id!)}
                        className="p-2 text-red-500 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                        title="Delete Page"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pages.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    <div className="w-12 h-12 bg-zinc-50 rounded flex items-center justify-center mx-auto mb-3">
                      <FileCode className="w-6 h-6 text-zinc-400" />
                    </div>
                    <p className="text-lg font-bold text-zinc-900">{settings.noPagesYetText?.[lang] || 'No pages yet'}</p>
                    <p className="text-sm mt-1 text-zinc-500 font-medium">{settings.noPagesDescriptionText?.[lang] || 'Add a page manually or seed default pages to get started.'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-gray-200/60 shadow-xl w-full max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-3 py-2 h-[52px] border-b border-zinc-200 bg-zinc-50/50">
              <h3 className="text-[16px] font-semibold text-zinc-900 tracking-tight">{editingPage ? 'Edit Page' : 'Add New Page'}</h3>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={handleAIAutoComplete}
                  disabled={generating}
                  className="flex items-center justify-center px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-xs font-medium hover:bg-indigo-100 transition-all disabled:opacity-50"
                >
                  <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                  {generating ? '...' : 'Auto-Fill'}
                </button>
                <button 
                  type="button"
                  onClick={handleAITranslate}
                  disabled={generating}
                  className="flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-3 py-1.5 text-xs font-medium rounded transition-colors disabled:opacity-50"
                >
                  <Languages className="w-3.5 h-3.5 mr-1.5" />
                  {generating ? '...' : 'Translate'}
                </button>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors h-[36px] w-[36px] flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-zinc-50/30">
              <form onSubmit={handleSubmit} className="px-4 py-3 space-y-4">
                <div className="mb-4 flex gap-2 overflow-x-auto pb-2 border-b border-zinc-200">
                  <button 
                    type="button"
                    onClick={() => setActiveTranslationLang(null)}
                    className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-widest transition-all ${activeTranslationLang === null ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700'}`}
                  >
                    {languages[0]?.trim().toUpperCase() || 'EN'}
                  </button>
                  {languages?.slice(1).map(lang => (
                    <button 
                      key={lang}
                      type="button"
                      onClick={() => setActiveTranslationLang(lang.trim())}
                      className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-widest transition-all ${activeTranslationLang === lang.trim() ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700'}`}
                    >
                      {lang.trim().toUpperCase()}
                    </button>
                  ))}
                </div>

                {activeTranslationLang ? (
                  <div className="space-y-4 py-4">
                    <h4 className="text-sm font-semibold text-zinc-900">Translation: {activeTranslationLang.toUpperCase()}</h4>
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Title ({activeTranslationLang.toUpperCase()})</label>
                      <input 
                        type="text" 
                        value={formData.title[activeTranslationLang] || ''} 
                        onChange={e => setFormData(prev => ({ ...prev, title: { ...prev.title, [activeTranslationLang]: e.target.value } }))} 
                        className="w-full border border-zinc-200 rounded-md px-4 h-[44px] focus:ring-2 focus:ring-zinc-900 outline-none text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Content ({activeTranslationLang.toUpperCase()})</label>
                      <textarea 
                        style={{ minHeight: '160px' }}
                        value={formData.content[activeTranslationLang] || ''} 
                        onChange={e => setFormData(prev => ({ ...prev, content: { ...prev.content, [activeTranslationLang]: e.target.value } }))} 
                        className="w-full border border-zinc-200 rounded-md p-4 focus:ring-2 focus:ring-zinc-900 outline-none font-mono text-sm" 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Title (Default)</label>
                        <input required type="text" value={formData.title[languages[0]] || ''} onChange={e => setFormData({...formData, title: {...formData.title, [languages[0]]: e.target.value}})} className="w-full border border-zinc-200 rounded-md px-4 h-[44px] focus:ring-2 focus:ring-zinc-900 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Slug (URL path)</label>
                        <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="e.g. privacy-policy" className="w-full border border-zinc-200 rounded-md px-4 h-[44px] focus:ring-2 focus:ring-zinc-900 outline-none text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Content (Default)</label>
                      <textarea 
                        required 
                        style={{ minHeight: '160px' }}
                        value={formData.content[languages[0]] || ''} 
                        onChange={e => setFormData({...formData, content: {...formData.content, [languages[0]]: e.target.value}})} 
                        className="w-full border border-zinc-200 rounded-md p-4 focus:ring-2 focus:ring-zinc-900 outline-none font-mono text-sm"></textarea>
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t border-zinc-200 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => { setIsModalOpen(false); setEditingPage(null); }}
                    className="flex-1 flex items-center justify-center bg-white text-zinc-900 hover:bg-zinc-50 border border-zinc-200 px-6 h-[44px] text-sm font-medium rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-6 h-[44px] text-sm font-medium rounded-md transition-colors">{editingPage ? 'Update Page' : 'Add Page'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
