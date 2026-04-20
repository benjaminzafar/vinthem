"use client";
import { logger } from '@/lib/logger';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCategoriesAction, toggleCategorySearchPinAction } from '@/app/actions/categories';
import { createClient } from '@/utils/supabase/client';
import { Product } from '@/store/useCartStore';
import { Category } from '@/types';
import { Plus, Package, Edit, Layers, Search, Pin } from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { useCustomConfirm } from '@/components/ConfirmationContext';
import { motion, AnimatePresence } from 'motion/react';
import { InfiniteScrollSentinel } from '@/components/admin/InfiniteScrollSentinel';
import Image from 'next/image';
import { isValidUrl } from '@/lib/utils';

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
    if (reset) {
      pageRef.current = 0;
    }

    if (showLoader) {
      setLoading(true);
    } else if (reset) {
      setRefreshing(true);
    } else {
      setLoadingMore(true);
    }

    const from = pageRef.current * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
      let query = supabase
        .from('categories')
        .select('*', { count: 'exact' });

      if (debouncedSearchQuery) {
        query = query.ilike('name', `%${debouncedSearchQuery}%`);
      } else {
        query = query.is('parent_id', null);
      }

      const { data: rootData, count, error } = await query
        .order('name')
        .range(from, to);

      if (error) throw error;

      let batchCategories = (rootData || []).map((c) => ({
        ...c, isFeatured: c.is_featured, showInHero: c.show_in_hero, 
        pinnedInSearch: c.pinned_in_search,
        parentId: c.parent_id, imageUrl: c.image_url, iconUrl: c.icon_url
      })) as unknown as Category[];

      if (!debouncedSearchQuery && rootData && rootData.length > 0) {
        const rootIds = rootData.map(r => r.id);
        const { data: childrenData } = await supabase
          .from('categories')
          .select('*')
          .in('parent_id', rootIds);
        
        if (childrenData) {
          const mappedChildren = childrenData.map((c) => ({
            ...c, isFeatured: c.is_featured, showInHero: c.show_in_hero, 
            pinnedInSearch: c.pinned_in_search,
            parentId: c.parent_id, imageUrl: c.image_url, iconUrl: c.icon_url
          })) as unknown as Category[];
          batchCategories = [...batchCategories, ...mappedChildren];
        }
      }

      if (reset) {
        setCategories(batchCategories);
      } else {
        setCategories(prev => {
          const combined = [...prev, ...batchCategories];
          const unique = Array.from(new Map(combined.map(c => [c.id, c])).values());
          return unique;
        });
      }

      const hasNoResults = rootData?.length === 0;
      const fetchedRootsSoFar = from + (rootData?.length || 0);
      const reachedCount = count ? fetchedRootsSoFar >= count : false;
      const partialPage = (rootData?.length || 0) < ITEMS_PER_PAGE;
      
      setHasMore(!hasNoResults && !reachedCount && !partialPage);
      
      if (rootData && rootData.length > 0) {
        pageRef.current += 1;
      }

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

  const refreshCategories = () => void fetchCategories({ reset: true, showLoader: false });

  const toggleAll = () => {
    const parents = categories.filter(c => !c.parentId);
    setSelectedCollections(selectedCollections.length === parents.length ? [] : parents.map(p => p.id!));
  };

  const deleteSelected = async () => {
    if (selectedCollections.length === 0) return;
    const confirmed = await customConfirm('Delete', `Remove ${selectedCollections.length} collections?`);
    if (!confirmed) return;
    try {
      const result = await deleteCategoriesAction({ categoryIds: selectedCollections });
      if (!result.success) {
        throw new Error(result.error || result.message);
      }
      toast.success(result.message);
      setSelectedCollections([]);
      refreshCategories();
    } catch (error: unknown) {
      const err = error as Error;
      toast.error('Deletion failed: ' + err.message);
    }
  };

  const toggleSearchPin = async (category: Category) => {
    if (!category.id) return;

    const nextPinnedState = !category.pinnedInSearch;
    setCategories((prev) =>
      prev.map((entry) =>
        entry.id === category.id ? { ...entry, pinnedInSearch: nextPinnedState } : entry,
      ),
    );

    try {
      const result = await toggleCategorySearchPinAction({
        categoryId: category.id,
        pinnedInSearch: nextPinnedState,
      });

      if (!result.success) {
        throw new Error(result.error || result.message);
      }

      toast.success(result.message);
    } catch (error: unknown) {
      const err = error as Error;
      setCategories((prev) =>
        prev.map((entry) =>
          entry.id === category.id ? { ...entry, pinnedInSearch: !nextPinnedState } : entry,
        ),
      );
      toast.error('Search pin update failed: ' + err.message, { duration: 6000 });
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel('categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        refreshCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchCategories]);

  useEffect(() => {
    const fetchProductCounts = async () => {
      const { data } = await supabase.from('products').select('id, category_id');
      if (data) {
        setProducts(data.map((p) => ({
          id: p.id as string,
          categoryId: (p.category_id as string | null) ?? null
        })));
      }
    };
    fetchProductCounts();
  }, [supabase]);

  const sortedData = useMemo(() => {
    const getSorted = (parentId: string | null = null, level: number = 0): { category: Category, level: number }[] => {
      const result: { category: Category, level: number }[] = [];
      categories.filter(c => c.parentId === parentId).forEach(child => {
        result.push({ category: child, level });
        result.push(...getSorted(child.id!, level + 1));
      });
      return result;
    };
    return getSorted();
  }, [categories]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Collections</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 px-1">Structure & Catalog Hierarchy</p>
        </div>
        
        <div className="flex items-center gap-4">
          {refreshing && (
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
              <Layers className="h-3.5 w-3.5 animate-pulse" />
              Syncing
            </div>
          )}
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <input 
              type="text"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-11 bg-white border border-slate-200 rounded-[4px] text-xs font-medium focus:outline-none focus:border-slate-900 transition-all w-64 text-slate-900"
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
                <th className="px-6 py-4 text-center">Search</th>
                <th className="px-6 py-4 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && categories.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Retrieving Catalog Hierarchy...</td></tr>
              ) : sortedData.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No collection entries found</td></tr>
              ) : sortedData.map(({ category: parent, level }) => (
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
                      <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-[4px] flex items-center justify-center overflow-hidden shrink-0 group-hover:border-slate-900 transition-all relative">
                        {isValidUrl(parent.imageUrl) ? <Image src={parent.imageUrl} alt={parent.name} fill sizes="40px" className="object-cover" /> : <Package className="w-4 h-4 text-slate-300" />}
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
                  <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => toggleSearchPin(parent)}
                      className={`inline-flex h-9 items-center gap-2 border px-3 text-[9px] font-black uppercase tracking-[0.18em] transition-all ${
                        parent.pinnedInSearch
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-900 hover:text-slate-900'
                      }`}
                    >
                      <Pin className={`h-3.5 w-3.5 ${parent.pinnedInSearch ? 'fill-current' : ''}`} />
                      {parent.pinnedInSearch ? 'Pinned' : 'Pin to Search'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                     <button className="p-2 text-slate-300 group-hover:text-slate-900 transition-all">
                        <Edit className="w-4 h-4" />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <InfiniteScrollSentinel 
          onIntersect={() => void fetchCategories({ reset: false, showLoader: false })}
          isLoading={loadingMore}
          hasMore={hasMore}
          loadingMessage="Expanding catalog levels..."
        />
      </div>
    </div>
  );
}

