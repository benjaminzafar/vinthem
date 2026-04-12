"use client";
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Category } from '@/types';
import { Product } from '@/store/useCartStore';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc, writeBatch, collection } from 'firebase/firestore';
import { toast } from 'sonner';

interface CategoryDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
  categories: Category[];
  products: Product[];
  onDeleted: () => void;
}

export const CategoryDeleteModal: React.FC<CategoryDeleteModalProps> = ({ 
  isOpen, onClose, category, categories, products, onDeleted 
}) => {
  const [action, setAction] = useState<'reassign' | 'delete'>('reassign');
  const [reassignTo, setReassignTo] = useState('');

  const associatedProducts = products.filter(p => p.categoryId === category.id || p.parentCategoryId === category.id);

  const handleConfirm = async () => {
    const batch = writeBatch(db);
    
    try {
      if (action === 'delete') {
        associatedProducts.forEach(p => {
          batch.delete(doc(db, 'products', p.id!));
        });
      } else if (action === 'reassign' && reassignTo) {
        associatedProducts.forEach(p => {
          batch.update(doc(db, 'products', p.id!), { 
            categoryId: p.categoryId === category.id ? reassignTo : p.categoryId,
            parentCategoryId: p.parentCategoryId === category.id ? reassignTo : p.parentCategoryId
          });
        });
      }

      batch.delete(doc(db, 'categories', category.id!));
      await batch.commit();
      
      toast.success('Category deleted successfully');
      onDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg border border-gray-200/60 shadow-xl w-full max-w-lg flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-3 py-2 h-[52px] border-b border-zinc-200 bg-zinc-50/50">
          <h3 className="text-[16px] font-semibold text-zinc-900 tracking-tight">Delete Category</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors h-[36px] w-[36px] flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="px-4 py-3 bg-zinc-50/30">
          <div className="bg-red-50 text-red-800 p-4 rounded-xl mb-6 border border-red-100">
          <p className="font-medium">You are about to delete <strong>{category.name}</strong>.</p>
          <p className="text-sm mt-1">This category has {associatedProducts.length} associated product(s).</p>
        </div>
        
        <div className="space-y-4 mb-8">
          <p className="text-sm font-medium text-gray-700">What would you like to do with the associated products?</p>
          
          <label className={`flex items-start p-4 rounded-xl border cursor-pointer transition-colors ${action === 'reassign' ? 'border-indigo-600 bg-zinc-100/50' : 'border-gray-200 hover:bg-gray-50'}`}>
            <div className="flex items-center h-5">
              <input type="radio" checked={action === 'reassign'} onChange={() => setAction('reassign')} className="w-4 h-4 text-zinc-900 border-gray-300 focus:ring-indigo-600" />
            </div>
            <div className="ml-3 flex-1">
              <span className="block text-sm font-medium text-gray-900">Reassign products</span>
              <span className="block text-sm text-gray-500 mb-2">Move them to another category</span>
              {action === 'reassign' && (
                <select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 outline-none bg-white">
                  <option value="">Select a category...</option>
                  {categories.filter(c => c.id !== category.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>
          </label>

          <label className={`flex items-start p-4 rounded-xl border cursor-pointer transition-colors ${action === 'delete' ? 'border-red-600 bg-red-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
            <div className="flex items-center h-5">
              <input type="radio" checked={action === 'delete'} onChange={() => setAction('delete')} className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-600" />
            </div>
            <div className="ml-3">
              <span className="block text-sm font-medium text-red-900">Delete products</span>
              <span className="block text-sm text-red-700/70">Permanently delete all {associatedProducts.length} products</span>
            </div>
          </label>
          <div className="pt-4 border-t border-zinc-200 flex gap-3">
            <button onClick={onClose} className="flex-1 flex items-center justify-center bg-white text-zinc-900 hover:bg-zinc-50 border border-zinc-200 px-6 h-[44px] text-sm font-medium rounded-md transition-colors">
              Cancel
            </button>
            <button 
              onClick={handleConfirm} 
              className="flex-1 flex items-center justify-center bg-red-600 text-white hover:bg-red-700 border border-transparent px-6 h-[44px] text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={action === 'reassign' && !reassignTo}
            >
              Confirm Deletion
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};
