"use client";
import { logger } from '@/lib/logger';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  Package, 
  Plus, 
  Download, 
  Search, 
  Trash2,
  Check,
  X,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { useCustomConfirm } from '@/components/ConfirmationContext';
import { Product } from '@/store/useCartStore';
import { Category } from '@/types';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { isValidUrl } from '@/lib/utils';
import { InfiniteScrollSentinel } from '@/components/admin/InfiniteScrollSentinel';
import { deleteProductAction } from '@/app/actions/admin-products';

type ProductRecord = {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  sku?: string;
  image_url: string;
  category_id?: string;
  is_featured?: boolean;
  is_new_arrival?: boolean;
  is_sale?: boolean;
  sale_price?: number;
  prices?: Record<string, number>;
  stripe_tax_code?: string;
  created_at?: string;
  status?: 'draft' | 'published';
};

type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  translations?: Category['translations'];
  is_featured: boolean;
  show_in_hero?: boolean;
  parent_id?: string;
  image_url?: string;
  icon_url?: string;
};

export function ProductManager({ 
  initialProducts = [],
  initialCategories = [] 
}: { 
  selectedProductId?: string | null, 
  onClearSelection?: () => void,
  initialProducts?: Product[],
  initialCategories?: Category[]
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab ] = useState<'all' | 'active' | 'drafts'>('all');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [products, setProducts] = useState<Product[]>(initialProducts); 
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Use pageRef to avoid dependency loop in fetch function
  const pageRef = useRef(0);
  const ITEMS_PER_PAGE = 50;
  
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const customConfirm = useCustomConfirm();
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file');
      return;
    }

    const toastId = toast.loading('Processing products catalog...');
    
    try {
      // Basic CSV reading for now - logic can be expanded to actual parsing
      const text = await file.text();
      const rows = text.split('\n').filter(Boolean);
      
      if (rows.length < 2) {
        throw new Error('CSV file seems empty or malformed');
      }

      toast.success(`Success: Found ${rows.length - 1} products in catalog`, { id: toastId });
      // Here you would normally call a server action to process the data
      
    } catch (err: unknown) {
      toast.error('Failed to parse catalog: ' + (err instanceof Error ? err.message : String(err)), { id: toastId });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchProducts = useCallback(async ({ reset = false, showLoader = false }: { reset?: boolean; showLoader?: boolean } = {}) => {
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
        .from('products')
        .select('*', { count: 'exact' });

      if (debouncedSearchQuery) {
        query = query.or(`title.ilike.%${debouncedSearchQuery}%,sku.ilike.%${debouncedSearchQuery}%`);
      }

      if (activeTab === 'active') {
        query = query.or('status.eq.published,and(status.is.null,stock.gt.0)');
      } else if (activeTab === 'drafts') {
        query = query.eq('status', 'draft');
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const mappedProducts = (data || []).map((p: ProductRecord) => ({
        ...p,
        imageUrl: p.image_url,
        categoryId: p.category_id,
        isFeatured: p.is_featured,
        isNewArrival: p.is_new_arrival,
        isSale: p.is_sale,
        discountPrice: p.sale_price,
        prices: p.prices,
        stripeTaxCode: p.stripe_tax_code,
        createdAt: p.created_at
      }));

      if (reset) {
        setProducts(mappedProducts);
      } else {
        setProducts(prev => {
          const combined = [...prev, ...mappedProducts];
          const unique = Array.from(new Map(combined.map(p => [p.id, p])).values());
          return unique;
        });
      }

      // Definitive hasMore logic: 
      // 1. If we got 0 items, there is definitely no more.
      // 2. If we have a count, check if we've fetched everything.
      // 3. If we didn't fill a whole page, there is likely no more.
      const hasNoResults = mappedProducts.length === 0;
      const fetchedSoFar = from + mappedProducts.length;
      const reachedCount = count ? fetchedSoFar >= count : false;
      const partialPage = mappedProducts.length < ITEMS_PER_PAGE;
      
      setHasMore(!hasNoResults && !reachedCount && !partialPage);
      
      if (mappedProducts.length > 0) {
        pageRef.current += 1;
      }

    } catch (error: unknown) {
      const err = error as Error;
      logger.error('[ProductManager] Fetch error:', err);
      toast.error('Failed to load products: ' + err.message);
      setHasMore(false); // Stop loop on error
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [supabase, debouncedSearchQuery, activeTab]);

  useEffect(() => {
    void fetchProducts({
      reset: true,
      showLoader: initialProducts.length === 0,
    });
  }, [debouncedSearchQuery, activeTab, fetchProducts, initialProducts.length]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*').order('name');
      if (data) {
        const mappedCategories = data.map((c: CategoryRecord) => ({
          ...c, isFeatured: c.is_featured, showInHero: c.show_in_hero,
          parentId: c.parent_id, imageUrl: c.image_url, iconUrl: c.icon_url
        }));
        setCategories(mappedCategories);
      }
    };
    
    if (initialCategories.length === 0) {
      fetchCategories();
    }

    const productsChannel = supabase
      .channel('products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        void fetchProducts({ reset: true, showLoader: false });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
    };
  }, [supabase, fetchProducts, initialCategories.length]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      router.push(`/admin/products/${product.id}`);
    } else {
      router.push('/admin/products/new');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await customConfirm('Delete Product', 'Are you sure you want to delete this product?');
    if (confirmed) {
      const toastId = toast.loading('Deleting product...');
      try {
        const result = await deleteProductAction(id);
        if (!result.success) throw new Error(result.message);
        setProducts(prev => prev.filter(p => p.id !== id));
        toast.success('Product deleted successfully', { id: toastId });
      } catch (error: unknown) {
        const err = error as Error;
        toast.error('Delete failed: ' + err.message, { id: toastId });
      }
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    const confirmed = await customConfirm(
      'Bulk Delete', 
      `Are you sure you want to delete ${selectedIds.size} selected products? This cannot be undone.`
    );

    if (confirmed) {
      setBulkProcessing(true);
      const toastId = toast.loading(`Deleting ${selectedIds.size} products...`);
      try {
        const ids = Array.from(selectedIds);
        // Sequential delete for safety, though bulk action would be better on server
        const results = await Promise.all(ids.map(id => deleteProductAction(id)));
        const failedCount = results.filter(r => !r.success).length;
        
        if (failedCount > 0) {
          toast.error(`Deleted ${ids.length - failedCount} products, but ${failedCount} failed.`, { id: toastId });
        } else {
          toast.success(`Successfully deleted ${ids.length} products`, { id: toastId });
        }
        
        setProducts(prev => prev.filter(p => !selectedIds.has(p.id)));
        setSelectedIds(new Set());
      } catch (error: unknown) {
        const err = error as Error;
        toast.error('Bulk delete failed: ' + err.message, { id: toastId });
      } finally {
        setBulkProcessing(false);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-[18px] font-bold text-slate-900 tracking-tight">Products</h1>
          <p className="text-[12px] text-slate-500 mt-0.5">Manage your store's inventory and details</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full md:w-auto">
          {refreshing && (
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
              <Package className="w-3.5 h-3.5 animate-pulse" />
              Syncing
            </div>
          )}
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-10 bg-white border border-slate-300 rounded text-sm focus:outline-none focus:border-slate-900 transition-all w-full sm:w-64 text-slate-900"
            />
          </div>
          <button 
            onClick={() => router.push('/admin/products/new')}
            className="h-10 px-4 sm:px-6 bg-slate-900 text-white rounded text-sm font-medium hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden text-[11px]">Add</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-300 rounded overflow-hidden shadow-none">
        <div className="px-6 border-b border-slate-300 bg-white flex items-center justify-between h-14">
          <div className="flex gap-8 h-full">
            {['all', 'active', 'drafts'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as 'all' | 'active' | 'drafts')}
                className={`h-full text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === tab 
                    ? 'text-slate-900 border-slate-900' 
                    : 'text-slate-500 border-transparent hover:text-slate-600'
                }`}
              >
                {tab === 'all' ? 'All Products' : tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-all"
            >
              <FileText className="w-4 h-4" />
              Import CSV
            </button>
            <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-all">
               <Download className="w-4 h-4" />
               Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-[11px] uppercase font-bold tracking-widest text-slate-500 bg-slate-50">
                <th className="px-6 py-4 w-12 text-center">
                  <div 
                    onClick={toggleAll}
                    className={`w-4 h-4 border rounded-sm mx-auto cursor-pointer transition-all flex items-center justify-center ${
                      selectedIds.size === products.length && products.length > 0
                        ? 'bg-slate-900 border-slate-900' 
                        : 'border-slate-300 hover:border-slate-400 bg-white'
                    }`}
                  >
                    {selectedIds.size === products.length && products.length > 0 && <Check className="w-3 h-3 text-white" />}
                  </div>
                </th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && products.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing Inventory...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">No entries found</td></tr>
              ) : products.map((product) => (
                <tr 
                  key={product.id} 
                  onClick={() => handleOpenModal(product)}
                  className={`transition-colors group cursor-pointer ${
                    selectedIds.has(product.id) ? 'bg-slate-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <td 
                    className="px-6 py-4" 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(product.id);
                    }}
                  >
                    <div className={`w-4 h-4 border rounded-sm mx-auto transition-all flex items-center justify-center ${
                      selectedIds.has(product.id)
                        ? 'bg-slate-900 border-slate-900' 
                        : 'border-slate-300 group-hover:border-slate-900 bg-white'
                    }`}>
                      {selectedIds.has(product.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded flex items-center justify-center overflow-hidden shrink-0">
                        {isValidUrl(product.imageUrl) ? (
                          <Image src={product.imageUrl} alt="" width={48} height={48} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-[13px] truncate">{product.title}</p>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{product.sku || 'SKU-000'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600">
                    {categories.find(c => c.id === product.categoryId)?.name || 'General Item'}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 whitespace-nowrap">
                    {product.price.toLocaleString()} SEK
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">
                    {product.stock} <span className="text-[10px] uppercase opacity-60 ml-1">Units</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-widest border ${
                      product.status === 'draft' ? 'bg-zinc-100 text-zinc-600 border-zinc-200' :
                      product.stock > 10 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                      product.stock > 0 ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                      'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${
                        product.status === 'draft' ? 'bg-zinc-400' : product.stock > 10 ? 'bg-emerald-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      {product.status === 'draft' ? 'Draft' : product.stock > 10 ? 'Active' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={(e) => handleDelete(product.id, e)} 
                      className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <InfiniteScrollSentinel 
          onIntersect={() => void fetchProducts({ reset: false, showLoader: false })}
          isLoading={loadingMore}
          hasMore={hasMore}
          loadingMessage="Streaming inventory entries..."
        />

      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-300">
          <div className="bg-slate-900 text-white rounded-full px-6 py-3 shadow-2xl flex items-center gap-6 border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-3 pr-6 border-r border-white/20">
              <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[11px] font-bold uppercase">
                {selectedIds.size}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">Selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkDelete}
                disabled={bulkProcessing}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full hover:bg-rose-500/10 text-rose-400 transition-all group"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-widest">Delete</span>
              </button>

              <button
                onClick={() => setSelectedIds(new Set())}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full hover:bg-white/10 text-slate-500 transition-all"
              >
                <X className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-widest">Clear</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleCSVUpload}
        className="hidden" 
        accept=".csv" 
      />
    </div>
  );
}

