"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Product } from '@/store/useCartStore';
import { Category } from '@/types';
import { Plus, Package, Edit, Layers, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { useCustomConfirm } from '@/components/ConfirmationContext';
import { motion, AnimatePresence } from 'motion/react';

export function CollectionManager() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const customConfirm = useCustomConfirm();
  const supabase = createClient();

  const refreshCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      const mappedCategories = ((data || []) as any[]).map((c) => ({
        ...c, isFeatured: c.is_featured, showInHero: c.show_in_hero, 
        parentId: c.parent_id, imageUrl: c.image_url, iconUrl: c.icon_url
      }));
      setCategories(mappedCategories as unknown as Category[]);
    } catch (error: any) {
      toast.error('Load failed: ' + error.message);
    }
  };

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  const toggleAll = () => {
    const parents = categories.filter(c => !c.parentId);
    setSelectedCollections(selectedCollections.length === parents.length ? [] : parents.map(p => p.id!));
  };

  const deleteSelected = async () => {
    if (selectedCollections.length === 0) return;
    const confirmed = await customConfirm('Delete', `Remove ${selectedCollections.length} collections?`);
    if (!confirmed) return;
    try {
      const { error } = await supabase.from('categories').delete().in('id', selectedCollections);
      if (error) throw error;
      toast.success('Deleted');
      setSelectedCollections([]);
      refreshCategories();
    } catch (error: any) {
      toast.error('Deletion failed: ' + error.message);
    }
  };

  useEffect(() => {
    refreshCategories();
    // Enable Realtime
    const channel = supabase
      .channel('categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        refreshCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const fetchProductCounts = async () => {
      // Optimization: Only select columns needed for the parent count
      const { data } = await supabase.from('products').select('id, category_id');
      if (data) {
        setProducts(data.map((p: any) => ({
          ...p, categoryId: p.category_id
        })) as unknown as Product[]);
      }
    };
    fetchProductCounts();

    const channel = supabase
      .channel('products-changes-collections')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProductCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Collections</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 px-1">Structure & Catalog Hierarchy</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <input 
              type="text"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-11 bg-white border border-slate-200 rounded-[4px] text-xs font-medium focus:outline-none focus:border-slate-900 transition-all w-64 placeholder:text-slate-400 text-slate-900"
            />
          </div>
          <button 
            onClick={() => router.push('/admin/collections/new')}
            className="h-11 px-8 bg-slate-900 text-white rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Collection
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[4px] overflow-hidden">
        <div className="px-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
             <Layers className="w-4 h-4 text-slate-400" />
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Catalogue Hierarchy</h3>
          </div>
          <AnimatePresence>
            {selectedCollections.length > 0 && (
              <motion.button 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={deleteSelected}
                className="text-[10px] font-black text-rose-600 uppercase tracking-widest hover:underline"
              >
                Delete Selected ({selectedCollections.length})
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50">
                <th className="px-6 py-4 w-12">
                   <input type="checkbox" checked={selectedCollections.length > 0 && selectedCollections.length === categories.filter(c => !c.parentId).length} onChange={toggleAll} className="w-4 h-4 rounded-sm border-slate-300 transition-all" />
                </th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Structure</th>
                <th className="px-6 py-4 text-center">Stats</th>
                <th className="px-6 py-4 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(() => {
                const getSorted = (parentId: string | null = null, level: number = 0): { category: Category, level: number }[] => {
                  const result: { category: Category, level: number }[] = [];
                  filteredCategories.filter(c => c.parentId === parentId).forEach(child => {
                    result.push({ category: child, level });
                    result.push(...getSorted(child.id!, level + 1));
                  });
                  return result;
                };

                const sortedData = getSorted();
                if (sortedData.length === 0) return <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No collection entries found</td></tr>;

                return sortedData.map(({ category: parent, level }) => (
                  <tr 
                    key={parent.id} 
                    onClick={() => router.push(`/admin/collections/${parent.id}`)}
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedCollections.includes(parent.id!)} 
                        onChange={() => setSelectedCollections(prev => prev.includes(parent.id!) ? prev.filter(i => i !== parent.id) : [...prev, parent.id!])} 
                        className="w-4 h-4 rounded-sm border-slate-300 transition-all" 
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4" style={{ marginLeft: `${level * 24}px` }}>
                        <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-[4px] flex items-center justify-center overflow-hidden shrink-0 group-hover:border-slate-900 transition-all">
                          {parent.imageUrl ? <img src={parent.imageUrl} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-slate-300" />}
                        </div>
                        <div className="min-w-0">
                           <p className="font-black text-slate-900 text-xs tracking-tight truncate">{parent.name}</p>
                           {level > 0 && <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Nested Path Indicator</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="px-2.5 py-1 bg-white text-slate-600 rounded-[4px] text-[9px] font-black uppercase tracking-widest inline-block border border-slate-100">
                          {level === 0 ? 'Root Layer' : 'Sub Layer'}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-black text-slate-500 text-center">
                      {products.filter(p => p.categoryId === parent.id).length} PDTS
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="p-2 text-slate-300 group-hover:text-slate-900 transition-all">
                          <Edit className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
