"use client";

import React, { useState } from 'react';
import { Search, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { StorefrontSettings } from '@/store/useSettingsStore';
import { Category } from '@/types';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarFiltersProps {
  categories: Category[];
  settings: StorefrontSettings;
  lang: string;
  searchInput: string;
  setSearchInput: (val: string) => void;
}

/**
 * Modernized Scandinavian Sidebar
 * Purged of shadows, boxes, and redundant labels.
 * Focuses on typography and pure functionality.
 */
export function SidebarFilters({
  categories,
  settings,
  lang,
  searchInput,
  setSearchInput,
}: SidebarFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [viewStack, setViewStack] = useState<string[]>([]);
  const activeCategory = searchParams.get('category') || 'All';
  const sortBy = searchParams.get('sort') || 'newest';

  const updateParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === 'All') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const activeCategoryId = viewStack[viewStack.length - 1];
  const activeCategoryData = categories.find(c => c.id === activeCategoryId);
  
  const currentCategories = activeCategoryId 
    ? categories.filter(c => c.parentId === activeCategoryId)
    : categories.filter(c => !c.parentId);

  const goForward = (categoryId: string) => {
    setViewStack(prev => [...prev, categoryId]);
  };

  const goBack = () => {
    setViewStack(prev => prev.slice(0, -1));
  };

  return (
    <div className="flex flex-col space-y-12 py-4">
      {/* Search Bar - Modern Flat Internal Style */}
      <div className="relative group px-1">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={settings.searchPlaceholder?.[lang] || 'Search...'}
          className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-12 text-[13px] font-medium focus:bg-white focus:ring-1 focus:ring-slate-900/10 outline-none transition-all placeholder:text-slate-300"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" strokeWidth={1.5} />
      </div>

      {/* Navigation Stack */}
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {viewStack.length > 0 && (
            <motion.button
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              onClick={goBack}
              className="flex items-center space-x-2 text-slate-400 hover:text-brand-ink transition-colors px-2 mb-6"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">{activeCategoryData?.name}</span>
            </motion.button>
          )}
        </AnimatePresence>

        <div className="space-y-1">
          {viewStack.length === 0 && (
            <button
              onClick={() => updateParams({ category: 'All' })}
              className={`w-full flex items-center justify-between py-3 px-4 rounded-xl transition-all ${activeCategory === 'All' ? 'bg-slate-900 text-white font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <span className="text-[11px] uppercase tracking-[0.14em]">
                {settings.allCategoriesText?.[lang] || 'All Products'}
              </span>
              {activeCategory === 'All' && <Check className="w-3.5 h-3.5" />}
            </button>
          )}

          {currentCategories.map((cat) => {
            const hasChildren = categories.some(c => c.parentId === cat.id);
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  if (hasChildren && cat.id) goForward(cat.id);
                  else updateParams({ category: cat.slug });
                }}
                className={`w-full flex items-center justify-between py-3 px-4 rounded-xl transition-all group ${isActive ? 'bg-slate-900 text-white font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <span className="text-[11px] uppercase tracking-[0.14em] text-left">{cat.name}</span>
                {hasChildren ? (
                  <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:translate-x-0.5 transition-transform" />
                ) : (
                  isActive && <Check className="w-3.5 h-3.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sorting Strategy */}
      <div className="space-y-3 px-1">
        <div className="grid grid-cols-1 gap-1">
          {[
            { id: 'newest', label: settings.sortNewestText?.[lang] || 'Newest' },
            { id: 'price-asc', label: settings.sortPriceAscText?.[lang] || 'Price: Low to High' },
            { id: 'price-desc', label: settings.sortPriceDescText?.[lang] || 'Price: High to Low' }
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => updateParams({ sort: option.id })}
              className={`w-full text-left py-2.5 px-4 rounded-xl transition-all text-[10px] uppercase font-bold tracking-[0.12em] ${sortBy === option.id ? 'bg-slate-50 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
