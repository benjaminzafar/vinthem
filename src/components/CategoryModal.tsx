"use client";
import React, { useState, useEffect } from 'react';
import { X, Star, Wand2, Image, Search } from 'lucide-react';
import { Category } from '@/types';
import { toast } from 'sonner';
import { CategoryDeleteModal } from './CategoryDeleteModal';
import { IconSelector } from './IconSelector';
import { IconRenderer } from './IconRenderer';
import { Product } from '@/store/useCartStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { getAI } from '@/lib/gemini';
import { createClient } from '@/utils/supabase/client';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
  categories: Category[];
  products: Product[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<string | null>;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, category, categories, products, onUpload }) => {
  const supabase = createClient();
  const { settings } = useSettingsStore();
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [isFeatured, setIsFeatured] = useState(category?.isFeatured || false);
  const [showInHero, setShowInHero] = useState(category?.showInHero || false);
  const [parentId, setParentId] = useState(category?.parentId || '');
  const [imageUrl, setImageUrl] = useState(category?.imageUrl || '');
  const [iconUrl, setIconUrl] = useState(category?.iconUrl || '');
  const [translations, setTranslations] = useState(category?.translations || {});
  const [activeTranslationLang, setActiveTranslationLang] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);

  useEffect(() => {
    setName(category?.name || '');
    setDescription(category?.description || '');
    setIsFeatured(category?.isFeatured || false);
    setShowInHero(category?.showInHero || false);
    setParentId(category?.parentId || '');
    setImageUrl(category?.imageUrl || '');
    setIconUrl(category?.iconUrl || '');
    setTranslations(category?.translations || {});
  }, [category]);

  const handleAITranslate = async () => {
    if (!activeTranslationLang) return;
    setGenerating(true);
    try {
      const ai = getAI();
      const prompt = `Translate the following category information into ${activeTranslationLang.toUpperCase()}:
      Name: ${name}
      Description: ${description}
      
      Return the response as a JSON object with 'name' and 'description' fields.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });
      
      const translatedData = JSON.parse(response.text);
      setTranslations(prev => ({
        ...prev,
        [activeTranslationLang]: translatedData
      }));
      toast.success(`Translated to ${activeTranslationLang.toUpperCase()}`);
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to translate');
    } finally {
      setGenerating(false);
    }
  };

  const handleAIAutoCompleteCategory = async () => {
    if (!imageUrl) {
      toast.error('Please provide an image first.');
      return;
    }
    setGenerating(true);
    const toastId = toast.loading('Analyzing image and generating category details...');
    try {
      const ai = getAI();
      
      const response = await fetch(imageUrl);
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

      const prompt = `Analyze this category image and generate details for an e-commerce store.
      Return ONLY a JSON object with the following structure:
      {
        "name": "A catchy, descriptive category name",
        "description": "A detailed, persuasive category description"
      }`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [
          { text: prompt },
          { inlineData: { data: base64Data, mimeType: blob.type } }
        ],
        config: {
          responseMimeType: 'application/json',
        }
      });

      const result = JSON.parse(aiResponse.text);
      
      setName(result.name || name);
      setDescription(result.description || description);
      
      toast.success('Category details generated!', { id: toastId });
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate details.', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploading(true);
    try {
      const url = await onUpload(e);
      if (url) setIconUrl(url);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const categoryData = { 
        name, 
        description, 
        is_featured: isFeatured, 
        show_in_hero: showInHero, 
        parent_id: parentId || null, 
        image_url: imageUrl || null, 
        icon_url: iconUrl || null, 
        translations 
      };
      
      if (category?.id) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', category.id);
        if (error) throw error;
        toast.success('Category updated successfully');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(categoryData);
        if (error) throw error;
        toast.success('Category added successfully');
      }
      onClose();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(error.message || 'Failed to save category');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-gray-200/60 shadow-xl w-full max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-3 py-2 h-[52px] border-b border-zinc-200 bg-zinc-50/50">
          <h3 className="text-[16px] font-semibold text-zinc-900 tracking-tight">{category ? 'Edit Category' : 'Add Category'}</h3>
          <div className="flex items-center gap-2">
            {category && (
              <button 
                type="button" 
                onClick={() => setIsDeleteModalOpen(true)} 
                className="text-sm font-medium text-red-600 hover:text-red-700 px-2"
              >
                Delete
              </button>
            )}
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors h-[36px] w-[36px] flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-zinc-50/30">
          <form onSubmit={handleSubmit} className="px-4 py-3 space-y-4">
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2 border-b border-zinc-200">
              <button
                type="button"
                onClick={() => setActiveTranslationLang('')}
                className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-widest transition-all ${activeTranslationLang === '' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700'}`}
              >
                Default
              </button>
              {settings.languages.filter(lang => lang.trim().toLowerCase() !== 'en').map(lang => (
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
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-zinc-900">Translation: {activeTranslationLang.toUpperCase()}</h4>
                  <button 
                    type="button"
                    onClick={handleAITranslate}
                    disabled={generating || (!name && !description)}
                    className="flex items-center px-4 h-[44px] bg-purple-50 text-purple-700 rounded-md text-sm font-medium hover:bg-purple-100 transition-colors disabled:opacity-50"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    {generating ? 'Translating...' : 'Translate with AI'}
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Name</label>
                    <input 
                      type="text" 
                      value={translations[activeTranslationLang]?.name || ''} 
                      onChange={e => setTranslations(prev => ({ ...prev, [activeTranslationLang]: { ...prev[activeTranslationLang], name: e.target.value } }))} 
                      className="w-full border border-zinc-200 rounded-md px-4 h-[44px] focus:ring-2 focus:ring-zinc-900 outline-none text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Description</label>
                    <textarea 
                      style={{ minHeight: '160px' }}
                      value={translations[activeTranslationLang]?.description || ''} 
                      onChange={e => setTranslations(prev => ({ ...prev, [activeTranslationLang]: { ...prev[activeTranslationLang], description: e.target.value } }))} 
                      className="w-full border border-zinc-200 rounded-md p-4 focus:ring-2 focus:ring-zinc-900 outline-none text-sm" 
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button 
                    type="button"
                    onClick={handleAIAutoCompleteCategory}
                    disabled={generating || !imageUrl}
                    className="flex items-center px-4 h-[44px] bg-purple-50 text-purple-700 rounded-md text-sm font-medium hover:bg-purple-100 transition-colors disabled:opacity-50"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    {generating ? 'Generating...' : 'Auto-fill from Image'}
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Name</label>
                    <input 
                      type="text" 
                      required 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      className="w-full border border-zinc-200 rounded-md px-4 h-[44px] focus:ring-2 focus:ring-zinc-900 outline-none text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Description</label>
                    <textarea 
                      style={{ minHeight: '160px' }}
                      value={description} 
                      onChange={e => setDescription(e.target.value)} 
                      className="w-full border border-zinc-200 rounded-md p-4 focus:ring-2 focus:ring-zinc-900 outline-none text-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-200">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Parent Category</label>
                    <select 
                      value={parentId} 
                      onChange={e => setParentId(e.target.value)} 
                      className="w-full border border-zinc-200 rounded-md px-4 h-[44px] focus:ring-2 focus:ring-zinc-900 outline-none text-sm bg-white"
                    >
                      <option value="">None (Top Level)</option>
                      {categories.filter(c => c.id !== category?.id).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-3 p-4 border border-zinc-200 rounded-md cursor-pointer hover:bg-zinc-50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={isFeatured} 
                      onChange={e => setIsFeatured(e.target.checked)} 
                      className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" 
                    />
                    <div>
                      <span className="font-medium text-zinc-900 block text-sm">Featured Category</span>
                      <span className="text-xs text-zinc-500">Show this category on the homepage</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 border border-zinc-200 rounded-md cursor-pointer hover:bg-zinc-50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={showInHero} 
                      onChange={e => setShowInHero(e.target.checked)} 
                      className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" 
                    />
                    <div>
                      <span className="font-medium text-zinc-900 block text-sm">Show in Hero</span>
                      <span className="text-xs text-zinc-500">Show this category in the hero slider</span>
                    </div>
                  </label>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-200">
                  {/* Category Image Section */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Category Image</label>
                    <div className="space-y-2">
                      {imageUrl ? (
                        <img src={imageUrl} alt="Preview" className="w-full aspect-video object-cover rounded-md border border-zinc-200" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full aspect-video flex items-center justify-center bg-zinc-50 rounded-md border border-zinc-200 text-zinc-400">
                          <Image className="w-8 h-8" />
                        </div>
                      )}
                      <div className="flex gap-2 w-full">
                        <label className="flex-1 cursor-pointer flex items-center justify-center h-10 px-4 border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors text-sm font-medium text-zinc-700">
                          {uploading ? 'Uploading...' : 'Upload Image'}
                          <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                            setUploading(true);
                            try {
                              const url = await onUpload(e);
                              if (url) setImageUrl(url);
                            } finally {
                              setUploading(false);
                            }
                          }} disabled={uploading} />
                        </label>
                        {imageUrl && (
                          <button
                            type="button"
                            onClick={() => setImageUrl('')}
                            className="flex items-center justify-center h-10 px-4 border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors text-sm font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Category Icon Section */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Category Icon</label>
                    <div className="flex flex-col items-center gap-2">
                      {iconUrl ? (
                        iconUrl.startsWith('lucide:') || iconUrl.startsWith('icon:') ? (
                          <div className="w-16 h-16 flex items-center justify-center bg-zinc-50 rounded-md border border-zinc-200">
                            <IconRenderer iconName={iconUrl} className="w-8 h-8 text-zinc-600" />
                          </div>
                        ) : (
                          <img src={iconUrl} alt="Icon Preview" className="w-16 h-16 object-cover rounded-md border border-zinc-200" referrerPolicy="no-referrer" />
                        )
                      ) : (
                        <div className="w-16 h-16 flex items-center justify-center bg-zinc-50 rounded-md border border-zinc-200 text-zinc-400">
                          <Image className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex gap-2 w-full justify-center">
                        <button
                          type="button"
                          onClick={() => setIsIconSelectorOpen(true)}
                          className="flex items-center justify-center h-10 px-4 border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors text-sm font-medium text-zinc-700"
                        >
                          <Search className="w-4 h-4 mr-2" />
                          Select Icon
                        </button>
                        <label className="cursor-pointer flex items-center justify-center h-10 px-4 border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors text-sm font-medium text-zinc-700">
                          {uploading ? 'Uploading...' : 'Upload Image'}
                          <input type="file" className="hidden" accept="image/*" onChange={handleIconUpload} disabled={uploading} />
                        </label>
                        {iconUrl && (
                          <button
                            type="button"
                            onClick={() => setIconUrl('')}
                            className="flex items-center justify-center h-10 px-4 border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors text-sm font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                disabled={uploading} 
                className="flex-1 flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-6 h-[44px] text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {category ? 'Update Category' : 'Add Category'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {category && (
        <CategoryDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          category={category}
          categories={categories}
          products={products}
          onDeleted={onClose}
        />
      )}
      {isIconSelectorOpen && (
        <IconSelector
          onSelect={(iconName) => setIconUrl(`icon:${iconName}`)}
          onClose={() => setIsIconSelectorOpen(false)}
        />
      )}
    </div>
  );
};
