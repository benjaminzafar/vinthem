"use client";
import { logger } from '@/lib/logger';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCategoriesAction } from '@/app/actions/categories';
import { createClient } from '@/utils/supabase/client';
import { Product } from '@/store/useCartStore';
import { Category } from '@/types';
import { Plus, Package, Edit, Layers, Search, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { useCustomConfirm } from '@/components/ConfirmationContext';
import { motion, AnimatePresence } from 'motion/react';
import { InfiniteScrollSentinel } from '@/components/admin/InfiniteScrollSentinel';
import Image from 'next/image';
import { isValidUrl } from '@/lib/utils';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';
import { toMediaProxyUrl } from '@/lib/media';

export function CollectionManager({ 
  initialCategories = [],
  initialProducts = [] 
}: { 
  initialCategories?: Category[],
  initialProducts?: Array<{ id: string; categoryId: string | null }>
}) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Array<{ id: string; categoryId: string | null }>>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(initialCategories.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const ITEMS_PER_PAGE = 30;

  const customConfirm = useCustomConfirm();
  const [supabase] = useState(() => createClient());

  const fetchCategories = useCallback(async ({ reset = false, showLoader = false }: { reset?: boolean; showLoader?: boolean } = {}) => {
    if (showLoader) {
      setLoading(true);
    } else if (reset) {
      setRefreshing(true);
    } else {
      setLoadingMore(true);
    }

    try {
      let query = supabase
        .from('categories')
        .select('*');

      if (debouncedSearchQuery) {
        query = query.ilike('name', `%${debouncedSearchQuery}%`);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;

      const batchCategories = (data || []).map((c) => ({
        ...c, isFeatured: c.is_featured, showInHero: c.show_in_hero, 
        parentId: c.parent_id, imageUrl: c.image_url, iconUrl: c.icon_url
      })) as unknown as Category[];
      setCategories(batchCategories);
      setHasMore(false);

    } catch (error: unknown) {
      const err = error as Error;
      logger.error('[CollectionManager] Fetch error:', err);
      toast.error('Load failed: ' + err.message);
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [supabase, debouncedSearchQuery]);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    void fetchCategories({
      reset: true,
      showLoader: initialCategories.length === 0,
    });
  }, [debouncedSearchQuery, fetchCategories, initialCategories.length]);

  const toggleAll = () => {
    const rootCats = categories.filter(c => !c.parentId);
    if (selectedCollections.length === rootCats.length) {
      setSelectedCollections([]);
    } else {
      setSelectedCollections(rootCats.map(c => c.id!));
    }
  };

  const deleteSelected = async () => {
    if (selectedCollections.length === 0) return;
    const confirmed = await customConfirm('Bulk Delete', `Remove ${selectedCollections.length} selected collections and their sub-collections?`);
    if (!confirmed) return;
    
    const toastId = toast.loading(`Deleting ${selectedCollections.length} collections...`);
    try {
      const result = await deleteCategoriesAction({ categoryIds: selectedCollections });
      if (!result.success) throw new Error(result.error || result.message);
      toast.success(result.message, { id: toastId });
      setSelectedCollections([]);
      refreshCategories();
    } catch (error: any) {
      toast.error('Bulk deletion failed: ' + error.message, { id: toastId });
    }
  };



  const refreshCategories = () => void fetchCategories({ reset: true, showLoader: false });

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCollections(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const deleteSingle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await customConfirm('Delete Collection', 'Permanently remove this collection and its sub-collections?');
    if (!confirmed) return;
    
    const toastId = toast.loading('Deleting collection...');
    try {
      const result = await deleteCategoriesAction({ categoryIds: [id] });
      if (!result.success) throw new Error(result.error || result.message);
      toast.success(result.message, { id: toastId });
      refreshCategories();
    } catch (error: any) {
      toast.error('Deletion failed: ' + error.message, { id: toastId });
    }
  };

  const sortedData = useMemo(() => {
    const result: { category: Category; level: number }[] = [];
    
    const addChildren = (parentId: string | null, level: number) => {
      const children = categories
        .filter(c => (parentId === null ? !c.parentId : c.parentId === parentId))
        .sort((a, b) => a.name.localeCompare(b.name));
        
      children.forEach(child => {
        result.push({ category: child, level });
        addChildren(child.id!, level + 1);
      });
    };
    
    addChildren(null, 0);
    return result;
  }, [categories]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-[16px] sm:text-[18px] font-bold text-slate-900 tracking-tight leading-none">Collections</h1>
          <p className="text-[12px] text-slate-500 mt-2 font-medium">Manage your catalog hierarchy and structure</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full md:w-auto">
          {refreshing && (
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
              <Layers className="h-3.5 w-3.5 animate-pulse" />
              Syncing
            </div>
          )}
          <div className="relative group flex-1 md:flex-none min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-slate-900 transition-colors" />
            <input 
              type="text"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-10 bg-white border border-slate-300 rounded text-[13px] focus:outline-none focus:border-slate-900 transition-all w-full md:w-64 text-slate-900"
            />
          </div>
          <button 
            onClick={() => router.push('/admin/collections/new')}
            className="h-10 px-4 sm:px-8 bg-slate-900 text-white rounded text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Collection</span>
            <span className="sm:hidden text-[11px]">Add</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-300 rounded overflow-hidden shadow-none">
        <div className="px-4 sm:px-6 border-b border-slate-300 bg-white flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
             <Layers className="w-4 h-4 text-slate-500" />
             <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Structure & Hierarchy</h3>
          </div>
        </div>

        {loading && categories.length === 0 ? (
          <div className="p-6">
            <AdminLoadingState
              compact
              eyebrow="Collections"
              title="Mapping collection structure"
              detail="Loading root collections, nested groups, and their linked catalog counts."
            />
          </div>
        ) : (
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left border-collapse min-w-[560px] lg:min-w-0">
            <thead>
              <tr className="border-b border-slate-300 text-[11px] font-bold uppercase tracking-widest text-slate-500 bg-slate-50/80">
                <th className="admin-table-cell px-4 sm:px-6 py-4 w-12 text-center">
                   <div 
                     onClick={toggleAll}
                     className={`w-4 h-4 border rounded-sm mx-auto cursor-pointer transition-all flex items-center justify-center ${
                       selectedCollections.length > 0 && selectedCollections.length === categories.filter(c => !c.parentId).length
                         ? 'bg-slate-900 border-slate-900' 
                         : 'border-slate-300 hover:border-slate-400 bg-white'
                     }`}
                   >
                     {selectedCollections.length > 0 && <Check className="w-3 h-3 text-white" />}
                   </div>
                </th>
                <th className="admin-table-cell px-4 sm:px-6 py-4">Collection</th>
                <th className="admin-table-cell px-4 sm:px-6 py-4 hidden md:table-cell">Type</th>
                <th className="admin-table-cell px-4 sm:px-6 py-4 text-center hidden sm:table-cell">Inventory</th>
                <th className="admin-table-cell px-4 sm:px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {loading && categories.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">Retrieving Catalog Structure...</td></tr>
              ) : sortedData.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">No collections found</td></tr>
              ) : sortedData.map(({ category: parent, level }) => (
                <tr 
                  key={parent.id} 
                  onClick={() => router.push(`/admin/collections/${parent.id}`)}
                  className={`transition-colors group cursor-pointer ${
                    selectedCollections.includes(parent.id!) ? 'bg-slate-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="admin-table-cell px-4 sm:px-6 py-4" onClick={(e) => toggleSelect(parent.id!, e)}>
                    <div className={`w-4 h-4 border rounded-sm mx-auto transition-all flex items-center justify-center ${
                      selectedCollections.includes(parent.id!)
                        ? 'bg-slate-900 border-slate-900' 
                        : 'border-slate-300 group-hover:border-slate-900 bg-white'
                    }`}>
                      {selectedCollections.includes(parent.id!) && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4" style={{ marginLeft: `${level * 24}px` }}>
                      <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded flex items-center justify-center overflow-hidden shrink-0 group-hover:border-slate-900 transition-all relative">
                        {isValidUrl(parent.imageUrl) ? <Image src={toMediaProxyUrl(parent.imageUrl)} alt={parent.name} fill sizes="48px" className="object-cover" /> : <Package className="w-5 h-5 text-slate-300" />}
                      </div>
                      <div className="min-w-0">
                         <p className="font-bold text-slate-900 text-[13px] tracking-tight truncate">{parent.name}</p>
                          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                             {level === 0 ? 'Home Depth' : `Depth Level ${level}`}
                          </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                     <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                        level === 0 
                          ? 'bg-slate-100 text-slate-700 border-slate-200' 
                          : 'bg-zinc-50 text-zinc-600 border-zinc-100'
                     }`}>
                        {level === 0 ? 'Root Collection' : 'Sub Collection'}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-bold text-slate-900 text-center hidden sm:table-cell">
                    {products.filter(p => p.categoryId === parent.id).length} Items
                  </td>

                  <td className="px-6 py-4 text-right">
                     <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                             e.stopPropagation();
                             router.push(`/admin/collections/${parent.id}`);
                          }}
                          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-all"
                        >
                           <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => deleteSingle(parent.id!, e)}
                          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
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
        )}

        <InfiniteScrollSentinel 
          onIntersect={() => void fetchCategories({ reset: false, showLoader: false })}
          isLoading={loadingMore}
          hasMore={hasMore}
          loadingMessage="Expanding catalog..."
        />
      </div>

      {/* Floating Bulk Actions Bar */}
      <AnimatePresence>
        {selectedCollections.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-50 px-6 py-3 bg-slate-900 text-white rounded-full shadow-2xl flex items-center gap-6 border border-white/10 backdrop-blur-md"
          >
            <div className="flex items-center gap-3 pr-6 border-r border-white/20">
              <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[11px] font-bold uppercase tracking-tighter shadow-inner">
                {selectedCollections.length}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={deleteSelected}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full hover:bg-rose-500/10 text-rose-400 transition-all group"
              >
                <Trash2 className="w-4 h-4 group-hover:animate-shake" />
                <span className="text-[11px] font-bold uppercase tracking-widest">Delete All</span>
              </button>

              <button
                onClick={() => setSelectedCollections([])}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full hover:bg-white/10 text-slate-500 transition-all"
              >
                <X className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-widest">Clear</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

