"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { 
  Package, 
  Plus, 
  Download, 
  Upload, 
  Search, 
  Edit, 
  Trash2, 
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { useCustomConfirm } from '@/components/ConfirmationContext';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Product } from '@/store/useCartStore';
import { Category } from '@/types';
import { ProductModal } from '@/components/admin/ProductModal';
import { downloadXLSX } from '@/utils/export';
import Papa from 'papaparse';

export function ProductManager({ selectedProductId, onClearSelection }: { selectedProductId?: string | null, onClearSelection?: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'drafts'>('all');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { settings } = useSettingsStore();
  const customConfirm = useCustomConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (activeTab === 'active') return product.stock > 0;
    if (activeTab === 'drafts') return product.stock === 0; // Simplified for demo
    return true;
  });

  const refreshProducts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) {
      const mappedProducts = (data as any[]).map(p => ({
        ...p,
        imageUrl: p.image_url,
        categoryId: p.category_id,
        isFeatured: p.is_featured,
        isNewArrival: p.is_new_arrival,
        isSale: p.is_sale,
        discountPrice: p.sale_price,
        createdAt: p.created_at
      }));
      setProducts(mappedProducts as Product[]);
    }
    setLoading(false);
  }, [supabase]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
    } else {
      setEditingProduct(null);
    }
    setIsModalOpen(true);
  };

  useEffect(() => {
    refreshProducts();
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*').order('name');
      if (data) {
        const mappedCategories = (data as any[]).map((c) => ({
          ...c, isFeatured: c.is_featured, showInHero: c.show_in_hero,
          parentId: c.parent_id, imageUrl: c.image_url, iconUrl: c.icon_url
        }));
        setCategories(mappedCategories as Category[]);
      }
    };
    fetchCategories();

    // Enable Realtime for Products
    const productsChannel = supabase
      .channel('products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        refreshProducts();
      })
      .subscribe();

    // Enable Realtime for Categories (in case a category name changes)
    const categoriesChannel = supabase
      .channel('categories-realtime-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(categoriesChannel);
    };
  }, [supabase, refreshProducts]);

  const selectedProductFromRoute =
    selectedProductId && products.length > 0
      ? products.find((product) => product.id === selectedProductId) ?? null
      : null;
  const activeProduct = editingProduct ?? selectedProductFromRoute;
  const modalOpen = isModalOpen || !!selectedProductFromRoute;

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await customConfirm('Delete Product', 'Are you sure you want to delete this product?');
    if (confirmed) {
      try {
        await supabase.from('products').delete().eq('id', id);
        setProducts(prev => prev.filter(p => p.id !== id));
        toast.success('Product deleted');
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header - Flat & Professional */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your store's inventory and details</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-10 bg-white border border-slate-300 rounded text-sm focus:outline-none focus:border-slate-900 transition-all w-64 placeholder:text-slate-400 text-slate-900"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-6 bg-slate-900 text-white rounded text-sm font-medium hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* View Controls & Table */}
      <div className="bg-white border border-slate-300 rounded overflow-hidden shadow-none">
        {/* Tabs Bar */}
        <div className="px-6 border-b border-slate-300 bg-white flex items-center justify-between h-14">
          <div className="flex gap-8 h-full">
            {['all', 'active', 'drafts'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`h-full text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === tab 
                    ? 'text-slate-900 border-slate-900' 
                    : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                {tab === 'all' ? 'All Products' : tab}
              </button>
            ))}
          </div>
          
          <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-all">
             <Download className="w-4 h-4" />
             Export
          </button>
        </div>

        {/* Table - 2D Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-[11px] uppercase font-bold tracking-widest text-slate-500 bg-slate-50">
                <th className="px-6 py-4 w-12 text-center opacity-30"><Plus className="w-4 h-4 mx-auto" /></th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing Inventory...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No entries found</td></tr>
              ) : filteredProducts.map((product) => (
                <tr 
                  key={product.id} 
                  onClick={() => handleOpenModal(product)}
                  className="hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="w-4 h-4 border border-slate-300 rounded-sm mx-auto group-hover:border-slate-900 transition-colors" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded flex items-center justify-center overflow-hidden shrink-0 group-hover:border-slate-300 transition-all">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{product.title}</p>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{product.sku || 'SKU-000'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-slate-600 font-medium whitespace-nowrap">
                      {categories.find(c => c.id === product.categoryId)?.name || 'General Item'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">
                    {product.price.toLocaleString()} SEK
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">
                    {product.stock} <span className="text-[10px] uppercase opacity-60 ml-1">Units</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${
                      product.stock > 10 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : product.stock > 0 
                          ? 'bg-amber-50 text-amber-700 border-amber-100' 
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${
                        product.stock > 10 ? 'bg-emerald-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      {product.stock > 10 ? 'Active' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
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

        {/* Footer Statistics */}
        <div className="px-6 py-4 border-t border-slate-300 bg-slate-50 flex items-center justify-between h-14">
           <p className="text-xs font-medium text-slate-500">Showing <span className="text-slate-900 font-bold">{filteredProducts.length}</span> of <span className="text-slate-900 font-bold">{products.length}</span> entries</p>
           <div className="flex gap-2">
             <button className="h-8 px-4 border border-slate-300 rounded text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:border-slate-900 hover:text-slate-900 transition-all disabled:opacity-30" disabled>Prev</button>
             <button className="h-8 px-4 border border-slate-300 rounded text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:border-slate-900 hover:text-slate-900 transition-all disabled:opacity-30" disabled>Next</button>
           </div>
        </div>
      </div>

      {modalOpen && (
        <ProductModal 
          isOpen={modalOpen} 
          onClose={() => { setIsModalOpen(false); setEditingProduct(null); onClearSelection?.(); }}
          product={activeProduct}
          categories={categories}
          settings={settings}
          onSuccess={refreshProducts}
        />
      )}

      {/* Import logic removed from UI to minimize clutter, but ref is kept if needed */}
      <input type="file" ref={fileInputRef} className="hidden" accept=".csv" />
    </div>
  );
}
