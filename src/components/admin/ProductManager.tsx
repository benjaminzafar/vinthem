"use client";
import React, { useState, useEffect, useRef } from 'react';
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

export function ProductManager({ selectedProductId, onClearSelection }: { selectedProductId: string | null, onClearSelection: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const { settings } = useSettingsStore();
  const customConfirm = useCustomConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
    product.id.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const productsToAdd = results.data as any[];
        const toastId = toast.loading('Importing products...');
        try {
          for (const product of productsToAdd) {
            if (product.title) {
              await supabase.from('products').insert({
                title: product.title,
                description: product.description || '',
                price: Number(product.price) || 0,
                stock: Number(product.stock) || 0,
                image_url: product.imageUrl || '',
                category: product.category || '',
                created_at: new Date().toISOString()
              });
            }
          }
          toast.success('Products imported successfully', { id: toastId });
          refreshProducts();
        } catch (error) {
          console.error("Import error:", error);
          toast.error('Failed to import products', { id: toastId });
        }
      }
    });
  };

  const refreshProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data as unknown as Product[]);
    setLoading(false);
  };

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
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      if (data) setCategories(data as unknown as Category[]);
    });
  }, [supabase]);

  useEffect(() => {
    if (selectedProductId && products.length > 0) {
      const product = products.find(p => p.id === selectedProductId);
      if (product) {
        handleOpenModal(product);
      }
    }
  }, [selectedProductId, products]);

  const handleDelete = async (id: string) => {
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
    <div className="space-y-6">
      <AdminHeader 
        title="Products"
        description="Manage your store's inventory and details"
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Search products..."
        }}
        primaryAction={{
          label: "Add Product",
          icon: Plus,
          onClick: () => handleOpenModal()
        }}
        secondaryActions={[
          { label: 'Import CSV', icon: Upload, onClick: () => fileInputRef.current?.click() },
          { label: 'Export XLSX', icon: Download, onClick: () => downloadXLSX(filteredProducts, 'products') }
        ]}
        statsLabel={`${filteredProducts.length} products`}
      />

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".csv" 
        onChange={handleImportCSV} 
      />

      <div className="py-8 border-b border-gray-200/60 last:border-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-6 py-4 font-bold">Product</th>
                <th className="px-6 py-4 font-bold">Category</th>
                <th className="px-6 py-4 font-bold">Price</th>
                <th className="px-6 py-4 font-bold">Stock</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center overflow-hidden">
                        {product.imageUrl && product.imageUrl.trim() !== "" ? (
                          <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Package className="w-6 h-6 text-zinc-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900">{product.title}</p>
                        <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">{product.sku || 'No SKU'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600">{product.category}</td>
                  <td className="px-6 py-4 font-medium text-zinc-900">{product.price.toLocaleString()} SEK</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.stock > 10 ? 'bg-green-50 text-green-700' : 
                      product.stock > 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {product.stock} in stock
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenModal(product)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
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

      {isModalOpen && (
        <ProductModal 
          isOpen={isModalOpen} 
          onClose={() => { setIsModalOpen(false); setEditingProduct(null); onClearSelection(); }}
          product={editingProduct}
          categories={categories}
          settings={settings}
          onSuccess={refreshProducts}
        />
      )}
    </div>
  );
}
