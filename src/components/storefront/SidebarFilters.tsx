"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ChevronRight, ChevronLeft, Check, LayoutGrid } from 'lucide-react';
import { IconRenderer } from '../IconRenderer';
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
 * Hardened Sidebar Filters
 * Style: Scandinavian Sharp (Borders active, Shadows purged, Standard radii)
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
    <div 
      suppressHydrationWarning
      className="flex flex-col bg-white border border-slate-200 shadow-none overflow-hidden min-h-[500px]"
    >
      {/* Search Bar - Integrated Flat */}
      <div className="p-5 border-b border-slate-100">
        <div className="relative group">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={settings.searchPlaceholder?.[lang] || 'Search...'}
            className="w-full bg-slate-50 border border-slate-200 rounded-none py-3 px-11 text-base font-normal outline-none transition-all placeholder:text-slate-500 focus:bg-white focus:border-slate-900"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-slate-900 transition-colors" strokeWidth={2} />
        </div>
      </div>

      <div className="p-5 space-y-10 flex-1 overflow-y-auto">
        {/* Navigation Section */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {viewStack.length > 0 && (
              <motion.button
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                onClick={goBack}
                className="flex items-center space-x-2 text-slate-500 hover:text-brand-ink transition-colors pb-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm font-medium tracking-wide">{activeCategoryData?.name}</span>
              </motion.button>
            )}
          </AnimatePresence>

          <div className="space-y-1">
            {viewStack.length === 0 && (
              <button
                onClick={() => updateParams({ category: 'All' })}
                className={`w-full flex items-center justify-between py-3 px-4 transition-all border ${activeCategory === 'All' ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-white border-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-900'}`}
              >
                <span className="text-xs font-medium uppercase tracking-widest">
                  {settings.allCategoriesText?.[lang] || 'All Products'}
                </span>
                {activeCategory === 'All' && <Check className="w-4 h-4" strokeWidth={1.5} />}
              </button>
            )}

            {currentCategories.map((cat) => {
              const hasChildren = categories.some(c => c.parentId === cat.id);
              const isActive = activeCategory === cat.slug;
              return (
                <CategoryItem 
                  key={cat.id}
                  cat={cat}
                  isActive={isActive}
                  hasChildren={hasChildren}
                  goForward={goForward}
                  updateParams={updateParams}
                />
              );
            })}
          </div>
        </div>

        {/* Sorting Section */}
        <div className="pt-8 border-t border-slate-100">
          <div className="space-y-1">
            {[
              { id: 'newest', label: settings.sortNewestText?.[lang] || 'Newest Arrivals' },
              { id: 'price-asc', label: settings.sortPriceAscText?.[lang] || 'Price: Low to High' },
              { id: 'price-desc', label: settings.sortPriceDescText?.[lang] || 'Price: High to Low' }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => updateParams({ sort: option.id })}
                className={`w-full text-left py-2 px-4 transition-all text-[12px] font-semibold tracking-tight ${sortBy === option.id ? 'text-brand-ink underline underline-offset-4' : 'text-brand-muted hover:text-brand-ink'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryItem({ cat, isActive, hasChildren, goForward, updateParams }: any) {
  const [imageError, setImageError] = React.useState(false);
  const iconToUse = cat.iconUrl || cat.imageUrl;
  const isRemoteIcon = iconToUse && (iconToUse.startsWith('http') || iconToUse.startsWith('/') || iconToUse.startsWith('blob:'));

  return (
    <button
      onClick={() => {
        if (hasChildren && cat.id) goForward(cat.id);
        else updateParams({ category: cat.slug });
      }}
      className={`w-full flex items-center justify-between py-3 px-4 transition-all border group ${isActive ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-white border-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-900'}`}
    >
      <div className="flex items-center space-x-3">
        {iconToUse && !imageError ? (
          <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
            {isRemoteIcon ? (
              <Image 
                src={iconToUse} 
                alt={cat.name} 
                fill 
                className="object-cover rounded-[2px] grayscale group-hover:grayscale-0 transition-all opacity-80 group-hover:opacity-100" 
                onError={() => setImageError(true)}
              />
            ) : (
                <IconRenderer iconName={iconToUse} className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-all" />
            )}
          </div>
        ) : (
          <LayoutGrid className="w-4 h-4 opacity-40 shrink-0" strokeWidth={1.5} />
        )}
        <span className="text-[12px] font-semibold text-left truncate max-w-[140px] tracking-tight">{cat.name}</span>
      </div>
      {hasChildren ? (
        <ChevronRight className="w-4 h-4 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-slate-500 group-hover:text-slate-900 shrink-0" strokeWidth={2} />
      ) : (
        isActive && <Check className="w-4 h-4 shrink-0" strokeWidth={2} />
      )}
    </button>
  );
}
