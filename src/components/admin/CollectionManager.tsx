"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Product } from '@/store/useCartStore';
import { Category } from '@/types';
import { CategoryModal } from '@/components/CategoryModal';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Plus, Package, Edit, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { useCustomConfirm } from '@/components/ConfirmationContext';
import { downloadXLSX } from '@/utils/export';

export function CollectionManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const customConfirm = useCustomConfirm();
  const supabase = createClient();

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  const toggleShowInHero = async (category: Category) => {
    try {
      await supabase
        .from('categories')
        .update({ show_in_hero: !category.showInHero })
        .eq('id', category.id!);
      toast.success('Category updated successfully');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const toggleAllCollections = () => {
    const parentCategories = categories.filter(c => !c.parentId);
    if (selectedCollections.length === parentCategories.length) {
      setSelectedCollections([]);
    } else {
      setSelectedCollections(parentCategories.map(p => p.id!));
    }
  };

  const toggleCollectionSelection = (id: string) => {
    if (selectedCollections.includes(id)) {
      setSelectedCollections(selectedCollections.filter(cId => cId !== id));
    } else {
      setSelectedCollections([...selectedCollections, id]);
    }
  };

  const deleteSelectedCollections = async () => {
    const confirmed = await customConfirm('Delete Collections', `Are you sure you want to delete ${selectedCollections.length} collections?`);
    if (!confirmed) return;

    const toastId = toast.loading('Deleting collections...');
    try {
      await supabase.from('categories').delete().in('id', selectedCollections);
      toast.success('Collections deleted successfully', { id: toastId });
      setSelectedCollections([]);
    } catch (error) {
      console.error('Error deleting collections:', error);
      toast.error('Failed to delete collections', { id: toastId });
    }
  };

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('name')
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching categories:', error);
          toast.error('Failed to load collections.');
        } else {
          setCategories((data || []) as unknown as Category[]);
        }
      });
  }, [supabase]);

  useEffect(() => {
    supabase.from('products').select('*').then(({ data }) => {
      if (data) setProducts(data as unknown as Product[]);
    });
  }, [supabase]);

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<string | null> => {
    const file = e.target.files?.[0];
    if (!file) return null;

    setUploading(true);
    const toastId = toast.loading('Uploading image...');

    try {
      const { uploadImageWithTimeout } = await import('@/lib/upload');
      const url = await uploadImageWithTimeout(file, `categories/${Date.now()}_${file.name}`);
      
      toast.success('Image uploaded successfully', { id: toastId });
      return url;
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || 'Failed to upload image', { id: toastId });
      return null;
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader 
        title="Collections"
        description="Organize your products into categories"
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Search collections..."
        }}
        primaryAction={{
          label: "Add Collection",
          icon: Plus,
          onClick: () => { setEditingCategory(null); setIsCategoryModalOpen(true); }
        }}
        secondaryActions={[
          { label: 'Export XLSX', icon: Download, onClick: () => downloadXLSX(filteredCategories, 'collections') }
        ]}
        statsLabel={`${filteredCategories.length} collections`}
      />

      <div className="py-8 border-b border-gray-200/60 last:border-0">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-zinc-900">All Collections</h3>
          {selectedCollections.length > 0 && (
            <button onClick={deleteSelectedCollections} className="w-full sm:w-auto flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/50 px-6 py-3 text-sm font-medium rounded-md transition-colors">
              Delete ({selectedCollections.length})
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-6 py-4 font-bold">
                  <input type="checkbox" checked={selectedCollections.length === categories.filter(c => !c.parentId).length && categories.filter(c => !c.parentId).length > 0} onChange={toggleAllCollections} className="w-5 h-5 rounded border-zinc-300 cursor-pointer" />
                </th>
                <th className="px-6 py-4 font-bold">Collection</th>
                <th className="px-6 py-4 font-bold">Products</th>
                <th className="px-6 py-4 font-bold">Show in Hero</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(() => {
                const getSorted = (parentId: string | null = null, level: number = 0): { category: Category, level: number }[] => {
                  let result: { category: Category, level: number }[] = [];
                  const children = filteredCategories.filter(c => c.parentId === parentId);
                  
                  children.forEach(child => {
                    result.push({ category: child, level });
                    result.push(...getSorted(child.id, level + 1));
                  });
                  
                  return result;
                };
                return getSorted().map(({ category: parent, level }) => (
                  <tr key={parent.id} className="hover:bg-zinc-50 transition-colors group">
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={selectedCollections.includes(parent.id!)} onChange={() => toggleCollectionSelection(parent.id!)} className="w-5 h-5 rounded border-zinc-300 cursor-pointer" />
                    </td>
                    <td className="px-6 py-4" style={{ paddingLeft: `${level * 20 + 24}px` }}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center overflow-hidden">
                          {parent.imageUrl && parent.imageUrl.trim() !== "" ? (
                            <img src={parent.imageUrl} alt={parent.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Package className="w-6 h-6 text-zinc-400" />
                          )}
                        </div>
                        <span className="font-bold text-zinc-900">{parent.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {products.filter(p => p.category === parent.name).length}
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={!!parent.showInHero} 
                        onChange={() => toggleShowInHero(parent)} 
                        className="w-5 h-5 rounded border-zinc-300 cursor-pointer" 
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => { setEditingCategory(parent); setIsCategoryModalOpen(true); }}
                        className="text-zinc-400 hover:text-zinc-900 p-2 rounded-full hover:bg-zinc-100 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-50 rounded flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-zinc-400" />
              </div>
              <p className="text-lg font-medium text-zinc-900">No collections yet</p>
              <p className="text-sm text-zinc-500 mt-1">Create collections to organize your products.</p>
            </div>
          ) : null}
        <CategoryModal 
          isOpen={isCategoryModalOpen} 
          onClose={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }}
          category={editingCategory}
          categories={categories}
          products={products}
          onUpload={handleCategoryImageUpload}
        />
      </div>
    </div>
  );
}
