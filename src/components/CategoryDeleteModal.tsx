"use client";
import React, { useState } from 'react';
import { X, Trash2, ArrowRight } from 'lucide-react';
import { Category } from '@/types';
import { Product } from '@/store/useCartStore';
import { toast } from 'sonner';
import { deleteCategoryAction } from '@/app/actions/categories';
import { motion, AnimatePresence } from 'motion/react';

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
  const [isDeleting, setIsDeleting] = useState(false);

  const associatedProducts = products.filter(p => p.categoryId === category.id || p.parentCategoryId === category.id);

  const handleConfirm = async () => {
    if (isDeleting) return;
    const toastId = toast.loading('Removing collection...');
    setIsDeleting(true);
    try {
      const result = await deleteCategoryAction({
        categoryId: category.id!, action, reassignTo, 
        productIds: associatedProducts.map(p => p.id!),
        directProductIds: associatedProducts.filter(p => p.categoryId === category.id).map(p => p.id!),
        parentProductIds: associatedProducts.filter(p => p.parentCategoryId === category.id).map(p => p.id!),
      });
      if (!result.success) throw new Error(result.error || result.message);
      toast.success(result.message, { id: toastId });
      onDeleted();
      onClose();
    } catch (error: unknown) {
      toast.error((error instanceof Error ? error.message : String(error)) || 'Failed to remove', { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-sm bg-white border border-zinc-200 rounded-lg shadow-xl overflow-hidden"
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-100 bg-zinc-50/50">
          <h3 className="text-sm font-semibold text-zinc-900">Delete Collection</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-900">You are deleting "{category.name}"</p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              This collection contains {associatedProducts.length} items. Select a protocol:
            </p>
          </div>

          <div className="space-y-2">
            <button 
              onClick={() => setAction('reassign')}
              className={`w-full text-left p-3 rounded-md border text-xs font-semibold transition-all ${action === 'reassign' ? 'border-zinc-900 bg-zinc-50 text-zinc-900' : 'border-zinc-100 text-zinc-500 hover:border-zinc-200 bg-white'}`}
            >
              Reassign items to another collection
            </button>
            <button 
              onClick={() => setAction('delete')}
              className={`w-full text-left p-3 rounded-md border text-xs font-semibold transition-all ${action === 'delete' ? 'border-red-600 bg-red-50/50 text-red-600' : 'border-zinc-100 text-zinc-500 hover:border-zinc-200 bg-white'}`}
            >
              Delete items permanently
            </button>
          </div>

          <AnimatePresence>
            {action === 'reassign' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <select 
                  value={reassignTo} 
                  onChange={(e) => setReassignTo(e.target.value)} 
                  className="w-full bg-slate-50 border border-zinc-200 rounded-md px-3 h-10 text-xs font-medium outline-none"
                >
                  <option value="">Move items to...</option>
                  {categories.filter(c => c.id !== category.id).map(c => (
                    <option key={c.id} value={c.id!}>{c.name}</option>
                  ))}
                </select>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 pt-2">
             <button onClick={onClose} className="flex-1 h-10 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 rounded-md transition-all">Cancel</button>
             <button 
              onClick={handleConfirm} 
              disabled={isDeleting || (action === 'reassign' && !reassignTo)}
              className={`flex-1 h-10 rounded-md text-xs font-bold text-white transition-all ${action === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-900 hover:bg-zinc-800'} disabled:opacity-50`} 
            >
              {isDeleting ? 'Deleting...' : 'Confirm'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

