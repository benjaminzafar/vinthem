"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { 
  Plus, 
  Download, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Wand2, 
  Languages, 
  X, 
  ImageIcon 
} from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { useCustomConfirm } from '@/components/ConfirmationContext';
import { useSettingsStore } from '@/store/useSettingsStore';
import { getAI } from '@/lib/gemini';
import { BlogPost } from '@/types';
import { downloadXLSX } from '@/utils/export';

export function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const customConfirm = useCustomConfirm();
  const settings = useSettingsStore((state) => state.settings);
  const supabase = createClient();

  const filteredPosts = posts.filter(post => {
    const searchLower = debouncedSearchQuery.toLowerCase();
    return (
      (post.title.en && post.title.en.toLowerCase().includes(searchLower)) ||
      (post.title.sv && post.title.sv.toLowerCase().includes(searchLower)) ||
      (post.author && post.author.toLowerCase().includes(searchLower))
    );
  });

  const toggleAllPosts = () => {
    if (selectedPosts.length === posts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(posts.map(p => p.id!));
    }
  };

  const togglePostSelection = (id: string) => {
    if (selectedPosts.includes(id)) {
      setSelectedPosts(selectedPosts.filter(pId => pId !== id));
    } else {
      setSelectedPosts([...selectedPosts, id]);
    }
  };

  const deleteSelectedPosts = async () => {
    const confirmed = await customConfirm('Delete Posts', `Are you sure you want to delete ${selectedPosts.length} posts?`);
    if (!confirmed) return;

    const toastId = toast.loading('Deleting posts...');
    try {
      await supabase.from('blog_posts').delete().in('id', selectedPosts);
      toast.success('Posts deleted successfully', { id: toastId });
      setSelectedPosts([]);
      setPosts(prev => prev.filter(p => !selectedPosts.includes(p.id!)));
    } catch (error) {
      console.error("Error deleting posts:", error);
      toast.error('Failed to delete posts', { id: toastId });
    }
  };

  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: { en: '', sv: '', fi: '', da: '' },
    excerpt: { en: '', sv: '', fi: '', da: '' },
    content: { en: '', sv: '', fi: '', da: '' },
    imageUrl: '',
    author: ''
  });

  const handleAIAutoComplete = async () => {
    if (!formData.title?.en) {
      toast.error('Please provide an English title first.');
      return;
    }
    setGenerating(true);
    const toastId = toast.loading('AI is generating content...');
    try {
      const ai = getAI();
      const prompt = `Generate a blog post excerpt and content for a post titled "${formData.title.en}" for an e-commerce store.
      Return ONLY a JSON object matching this structure:
      {
        "excerpt": "A short engaging summary",
        "content": "The full markdown content of the blog post"
      }`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const generated = JSON.parse(response.text || '{}');
      setFormData(prev => ({
        ...prev,
        excerpt: {
          ...prev.excerpt,
          en: generated.excerpt || ''
        },
        content: {
          ...prev.content,
          en: generated.content || ''
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
    if (!formData.title?.en || !formData.content?.en) {
      toast.error('Please provide English title and content first.');
      return;
    }
    
    setGenerating(true);
    const toastId = toast.loading('Translating to all languages...');
    const languages = settings.languages || ['en'];
    
    try {
      const ai = getAI();
      const prompt = `Translate the following title, excerpt, and content into these languages: ${languages.filter(l => l !== 'en').join(', ')}.
      Title: "${formData.title.en}"
      Excerpt: "${formData.excerpt?.en || ''}"
      Content: "${formData.content.en}"
      Return ONLY a JSON object matching this structure:
      {
        "title": { "langCode": "translated title" },
        "excerpt": { "langCode": "translated excerpt" },
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
        excerpt: {
          ...prev.excerpt,
          ...(translations.excerpt || {})
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
    const fetchBlogs = async () => {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Supabase error fetching blogs:", error);
          toast.error('Failed to load blog posts.');
        } else {
          setPosts(data as BlogPost[]);
        }
      } catch (error) {
        console.error("Unexpected error fetching blogs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, [supabase]);

  const handleOpenModal = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setFormData(post);
    } else {
      setEditingPost(null);
      setFormData({
        title: { en: '', sv: '', fi: '', da: '' },
        excerpt: { en: '', sv: '', fi: '', da: '' },
        content: { en: '', sv: '', fi: '', da: '' },
        imageUrl: '',
        author: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPost(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading('Uploading image...');

    try {
      const { uploadImageWithTimeout } = await import('@/lib/upload');
      const url = await uploadImageWithTimeout(file, `blogs/${Date.now()}_${file.name}`);
      setFormData({ ...formData, imageUrl: url });
      toast.success('Image uploaded successfully', { id: toastId });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || 'Failed to upload image', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading(editingPost ? 'Updating post...' : 'Adding post...');
    
    try {
      if (editingPost) {
        await supabase.from('blog_posts').update(formData).eq('id', editingPost.id);
        toast.success('Post updated successfully', { id: toastId });
      } else {
        await supabase.from('blog_posts').insert({
          ...formData,
          created_at: new Date().toISOString()
        });
        toast.success('Post added successfully', { id: toastId });
      }
      
      const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
      if (data) setPosts(data as BlogPost[]);
      
      handleCloseModal();
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error('Failed to save post', { id: toastId });
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await customConfirm('Delete Post', 'Are you sure you want to delete this post?');
    if (!confirmed) return;

    const toastId = toast.loading('Deleting post...');
    try {
      await supabase.from('blog_posts').delete().eq('id', id);
      setPosts(prev => prev.filter(p => p.id !== id));
      toast.success('Post deleted successfully', { id: toastId });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error('Failed to delete post', { id: toastId });
    }
  };

  return (
    <div className="space-y-6 overflow-x-hidden max-w-full">
      <AdminHeader 
        title="Journal / Blog"
        description="Manage your blog posts and news"
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Search posts..."
        }}
        primaryAction={{
          label: "New Post",
          icon: Plus,
          onClick: () => handleOpenModal()
        }}
        secondaryActions={[
          { label: 'Export XLSX', icon: Download, onClick: () => downloadXLSX(filteredPosts, 'blog_posts') }
        ]}
        statsLabel={`${filteredPosts.length} posts`}
      />
      
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 text-zinc-900 animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0 py-8 border-b border-gray-200/60 last:border-0">
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-50/50 border-b border-zinc-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 font-bold w-12">
                  <input type="checkbox" checked={selectedPosts.length === posts.length && posts.length > 0} onChange={toggleAllPosts} className="w-5 h-5 rounded border-zinc-300 cursor-pointer" />
                </th>
                <th className="px-4 sm:px-6 py-4 font-bold">Title</th>
                <th className="px-4 sm:px-6 py-4 font-bold hidden sm:table-cell">Author</th>
                <th className="px-4 sm:px-6 py-4 font-bold">Date</th>
                <th className="px-4 sm:px-6 py-4 font-bold text-right">
                  {selectedPosts.length > 0 && (
                    <button onClick={deleteSelectedPosts} className="w-full sm:w-auto flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/50 px-6 py-3 text-sm font-medium rounded-md transition-colors">
                      Delete ({selectedPosts.length})
                    </button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 sm:px-6 py-4">
                    <input type="checkbox" checked={selectedPosts.includes(post.id!)} onChange={() => togglePostSelection(post.id!)} className="w-5 h-5 rounded border-zinc-300 cursor-pointer" />
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="font-medium text-zinc-900 max-w-[150px] sm:max-w-[300px] truncate">
                      {typeof post.title === 'string' ? post.title : post.title?.en}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-zinc-600 hidden sm:table-cell whitespace-nowrap">{post.author}</td>
                  <td className="px-4 sm:px-6 py-4 text-zinc-600 whitespace-nowrap">{new Date(post.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 sm:px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(post)}
                        className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
                        title="Edit Post"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(post.id!)}
                        className="p-2 text-red-500 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No blog posts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Blog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-gray-200/60 shadow-xl w-full max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-3 py-2 h-[52px] border-b border-zinc-200 bg-zinc-50/50">
              <h3 className="text-[16px] font-semibold text-zinc-900 tracking-tight">
                {editingPost ? 'Edit Blog Post' : 'New Blog Post'}
              </h3>
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
                <button onClick={handleCloseModal} className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors h-[36px] w-[36px] flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-zinc-50/30">
              <form onSubmit={handleSave} className="px-4 py-3 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">Cover Image</label>
                    <div className="space-y-2">
                      {formData.imageUrl ? (
                        <img src={formData.imageUrl} alt="Preview" className="w-full aspect-video object-cover rounded-md border border-zinc-200" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full aspect-video flex items-center justify-center bg-zinc-50 rounded-md border border-zinc-200 text-zinc-400">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                      <label className="cursor-pointer flex items-center justify-center w-full h-10 px-4 border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors text-sm font-medium text-zinc-700">
                        {uploading ? 'Uploading...' : 'Upload Image'}
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">Author</label>
                    <input
                      type="text"
                      required
                      value={formData.author || ''}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full px-4 h-[44px] bg-white border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900 transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">Translations</label>
                    <div className="flex gap-1 p-1 bg-zinc-100 rounded-md overflow-x-auto custom-scrollbar">
                      {settings.languages.map(lang => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setSelectedLang(lang)}
                          className={`flex-1 px-3 h-[36px] rounded-md text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedLang === lang ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
                        >
                          {lang.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Title"
                        value={formData.title?.[selectedLang] || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          title: { ...formData.title, [selectedLang]: e.target.value } as any
                        })}
                        className="w-full px-4 h-[44px] bg-white border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900 transition-all text-sm"
                      />
                      <textarea
                        placeholder="Excerpt"
                        rows={3}
                        value={formData.excerpt?.[selectedLang] || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          excerpt: { ...formData.excerpt, [selectedLang]: e.target.value } as any
                        })}
                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900 transition-all text-sm resize-none"
                      />
                      <textarea
                        placeholder="Content"
                        style={{ minHeight: '160px' }}
                        value={formData.content?.[selectedLang] || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          content: { ...formData.content, [selectedLang]: e.target.value } as any
                        })}
                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900 transition-all text-sm font-mono resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-200 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => { setIsModalOpen(false); setEditingPost(null); }}
                    className="flex-1 flex items-center justify-center bg-white text-zinc-900 hover:bg-zinc-50 border border-zinc-200 px-6 h-[44px] text-sm font-medium rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-6 h-[44px] text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                  >
                    {editingPost ? 'Save Changes' : 'Add Post'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
