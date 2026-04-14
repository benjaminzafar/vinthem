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
import { genAI } from '@/lib/gemini';
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
      const prompt = `Generate a blog post excerpt and content for a post titled "${formData.title?.en}" for an e-commerce store.
      Return ONLY a JSON object matching this structure:
      {
        "excerpt": "A short engaging summary",
        "content": "The full markdown content of the blog post"
      }`;
      
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        }
      });
      
      const aiResponse = await model.generateContent(prompt);
      const generated = JSON.parse(aiResponse.response.text() || '{}');
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
      const prompt = `Translate the following title, excerpt, and content into these languages: ${languages.filter(l => l !== 'en').join(', ')}.
      Title: "${formData.title?.en || ''}"
      Excerpt: "${formData.excerpt?.en || ''}"
      Content: "${formData.content?.en || ''}"
      Return ONLY a JSON object matching this structure:
      {
        "title": { "langCode": "translated title" },
        "excerpt": { "langCode": "translated excerpt" },
        "content": { "langCode": "translated content" }
      }`;
      
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        }
      });
      
      const aiResponse = await model.generateContent(prompt);
      const translations = JSON.parse(aiResponse.response.text() || '{}');
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminHeader 
        title="Journal"
        description="Manage your blog posts and editorial news"
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
          <RefreshCw className="w-8 h-8 text-slate-900 animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-slate-300 rounded overflow-hidden shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-300 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
                  <th className="px-6 py-4 w-12">
                    <input type="checkbox" checked={selectedPosts.length === posts.length && posts.length > 0} onChange={toggleAllPosts} className="w-4 h-4 border-slate-300 rounded text-slate-900 focus:ring-0" />
                  </th>
                  <th className="px-6 py-4 font-bold">Editorial Title</th>
                  <th className="px-6 py-4 font-bold">Author</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 text-right">
                    {selectedPosts.length > 0 && (
                      <button onClick={deleteSelectedPosts} className="text-rose-600 hover:underline">
                        Delete Selected ({selectedPosts.length})
                      </button>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No entries found</td>
                  </tr>
                ) : filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={selectedPosts.includes(post.id!)} onChange={() => togglePostSelection(post.id!)} className="w-4 h-4 border-slate-300 rounded text-slate-900 focus:ring-0" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm truncate max-w-[300px]">
                        {typeof post.title === 'string' ? post.title : post.title?.en}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[11px] text-slate-500 font-bold uppercase tracking-widest">{post.author}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{new Date(post.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(post)}
                          className="p-2 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(post.id!)}
                          className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Blog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded">
            <div className="flex justify-between items-center px-6 h-16 border-b border-slate-300 bg-white">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {editingPost ? 'Edit Post' : 'New Post'}
              </h3>
              <div className="flex items-center gap-3">
                <button 
                  type="button" onClick={handleAIAutoComplete} disabled={generating}
                  className="h-9 px-4 bg-slate-50 border border-slate-300 text-slate-600 rounded text-[11px] font-bold uppercase tracking-widest hover:text-slate-900 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  {generating ? '...' : 'Auto-Fill'}
                </button>
                <button 
                  type="button" onClick={handleAITranslate} disabled={generating}
                  className="h-9 px-4 bg-slate-900 text-white rounded text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Languages className="w-3.5 h-3.5" />
                  {generating ? '...' : 'Translate'}
                </button>
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-900 transition-all ml-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <form onSubmit={handleSave} className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Editorial Banner</label>
                    <div className="space-y-4">
                      {formData.imageUrl ? (
                        <div className="relative aspect-video rounded border border-slate-200 overflow-hidden">
                           <img src={formData.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full aspect-video flex items-center justify-center bg-slate-50 rounded border border-slate-300 text-slate-300">
                          <ImageIcon className="w-10 h-10" />
                        </div>
                      )}
                      <label className="cursor-pointer flex items-center justify-center w-full h-10 bg-white border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all">
                        {uploading ? 'Processing Assets...' : 'Choose Banner Image'}
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Author Identity</label>
                    <input
                      type="text" required value={formData.author || ''}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full h-12 bg-white border border-slate-300 rounded px-4 focus:outline-none focus:border-slate-900 transition-all text-sm font-medium text-slate-900"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Content Localization</label>
                    <div className="flex gap-2 p-1 bg-slate-100 rounded">
                      {settings.languages.map(lang => (
                        <button
                          key={lang} type="button" onClick={() => setSelectedLang(lang)}
                          className={`flex-1 h-9 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${selectedLang === lang ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-4">
                      <input
                        type="text" placeholder="Post Title" value={formData.title?.[selectedLang] || ''}
                        onChange={(e) => setFormData({ ...formData, title: { ...formData.title, [selectedLang]: e.target.value } as any })}
                        className="w-full h-12 bg-white border border-slate-300 rounded px-4 focus:outline-none focus:border-slate-900 transition-all text-sm font-bold text-slate-900"
                      />
                      <textarea
                        placeholder="Excerpt / Summary" rows={3} value={formData.excerpt?.[selectedLang] || ''}
                        onChange={(e) => setFormData({ ...formData, excerpt: { ...formData.excerpt, [selectedLang]: e.target.value } as any })}
                        className="w-full p-4 bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-900 transition-all text-sm font-medium text-slate-600 resize-none"
                      />
                      <textarea
                        placeholder="Full Article Content (Markdown Supported)" style={{ minHeight: '240px' }}
                        value={formData.content?.[selectedLang] || ''}
                        onChange={(e) => setFormData({ ...formData, content: { ...formData.content, [selectedLang]: e.target.value } as any })}
                        className="w-full p-4 bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-900 transition-all text-sm font-mono text-slate-900 resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 flex gap-4">
                  <button 
                    type="button" onClick={handleCloseModal}
                    className="flex-1 h-12 border border-slate-300 text-slate-500 rounded text-sm font-medium hover:text-slate-900 hover:bg-slate-50 transition-all"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit" disabled={uploading}
                    className="flex-1 h-12 bg-slate-900 text-white rounded text-sm font-medium hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    {editingPost ? 'Update Publication' : 'Publish Article'}
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
