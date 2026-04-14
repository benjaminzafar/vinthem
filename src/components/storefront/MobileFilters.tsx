"use client";

import React from 'react';
import { X, Search, Folder, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Category } from '@/types';

interface MobileFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  settings: any;
  lang: string;
  searchInput: string;
  setSearchInput: (val: string) => void;
  activeCategory: string;
  sortBy: string;
  updateParams: (newParams: Record<string, string | null>) => void;
  productCount: number;
}

export function MobileFilters({
  isOpen,
  onClose,
  categories,
  settings,
  lang,
  searchInput,
  setSearchInput,
  activeCategory,
  sortBy,
  updateParams,
  productCount,
}: MobileFiltersProps) {
  const rootCategories = categories.filter(c => !c.parentId);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl lg:hidden max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-brand-ink">Filter & Sort</h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-gray-100 border-none rounded-full py-4 pl-4 pr-12 text-sm focus:ring-2 focus:ring-brand-ink outline-none"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-lg font-bold mb-4">Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => updateParams({ category: 'All' })}
                    className={`w-full flex items-center justify-between p-4 rounded-xl ${activeCategory === 'All' ? 'bg-gray-100 font-bold' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Folder className="w-5 h-5" />
                      <span>All Categories</span>
                    </div>
                    {activeCategory === 'All' && <Check className="w-5 h-5" />}
                  </button>
                  {rootCategories.map(cat => (
                    <button 
                      key={cat.id} 
                      onClick={() => { updateParams({ category: cat.slug }); onClose(); }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl ${activeCategory === cat.slug ? 'bg-gray-100 font-bold' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <Folder className="w-5 h-5" />
                        <span>{cat.name}</span>
                      </div>
                      {activeCategory === cat.slug ? <Check className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <h3 className="text-lg font-bold mb-4">Sort By</h3>
                <div className="space-y-2">
                  {[
                    { id: 'newest', label: 'Newest' },
                    { id: 'price-asc', label: 'Price: Low to High' },
                    { id: 'price-desc', label: 'Price: High to Low' }
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => updateParams({ sort: option.id })}
                      className={`w-full text-left p-4 rounded-xl ${sortBy === option.id ? 'bg-gray-100 font-bold' : ''}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-4 shrink-0">
              <button
                onClick={() => {
                  setSearchInput('');
                  updateParams({ search: null, category: 'All', sort: 'newest' });
                  onClose();
                }}
                className="flex-1 py-4 rounded-full border border-gray-300 font-bold text-brand-ink"
              >
                Clear
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-4 rounded-full bg-brand-ink text-white font-bold"
              >
                Show {productCount} results
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
