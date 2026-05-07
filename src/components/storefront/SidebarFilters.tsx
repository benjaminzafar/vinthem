"use client";

import React, { useState } from 'react';
import { Search, ChevronRight, ChevronLeft, Check, ShoppingBag, Plus } from 'lucide-react';
import { StorefrontSettings } from '@/store/useSettingsStore';
import { Category } from '@/types';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { getOptimizedImageUrl } from '@/utils/image-utils';

interface SidebarFiltersProps {
  categories: Category[];
  settings: StorefrontSettings;
  lang: string;
  searchInput: string;
  setSearchInput: (val: string) => void;
}

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
  const [direction, setDirection] = useState(1);
  const activeCategorySlug = searchParams.get('category') || 'All';

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

  // Sort categories alphabetically
  currentCategories.sort((a, b) => {
    const nameA = a.translations?.[lang]?.name || a.name;
    const nameB = b.translations?.[lang]?.name || b.name;
    return nameA.localeCompare(nameB, lang);
  });

  const goForward = (categoryId: string) => {
    setDirection(1);
    setViewStack(prev => [...prev, categoryId]);
  };

  const goBack = () => {
    setDirection(-1);
    setViewStack(prev => prev.slice(0, -1));
  };

  const getCatName = (cat?: Category) => {
    if (!cat) return '';
    return cat.translations?.[lang]?.name || cat.name;
  };

  return (
    <div 
      suppressHydrationWarning
      className="flex flex-col bg-white border border-slate-200 shadow-none overflow-hidden min-h-[600px] rounded-none"
    >
      {/* Search Header */}
      <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
        <div className="relative group">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={settings.searchPlaceholder?.[lang] || 'Search...'}
            className="w-full bg-slate-50 border border-slate-200 rounded-full h-11 pl-11 pr-4 text-[14px] font-medium outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:ring-0"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" strokeWidth={2} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <nav className="space-y-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeCategoryId || 'root'}
              initial={{ x: direction > 0 ? 20 : -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction > 0 ? -20 : 20, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="space-y-6"
            >
              {viewStack.length > 0 ? (
                <div className="space-y-6">
                  <button
                    onClick={goBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group"
                  >
                    <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" strokeWidth={2.5} />
                    <span className="text-[12px] font-bold uppercase tracking-widest">{getCatName(activeCategoryData)}</span>
                  </button>

                  <div className="space-y-1">
                    {currentCategories.map((cat) => {
                      const hasChildren = categories.some(c => c.parentId === cat.id);
                      const isActive = activeCategorySlug === cat.slug;
                      return (
                        <div key={cat.id} className="group flex items-center justify-between border-b border-slate-50 last:border-0">
                          <button
                            onClick={() => {
                              updateParams({ category: cat.slug });
                              if (!hasChildren) {
                                // Scroll to top if navigation happened
                              }
                            }}
                            className={`flex-1 flex items-center py-3.5 transition-all ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                          >
                            <span className={`text-[15px] font-bold uppercase tracking-[0.05em] ${isActive ? 'translate-x-1' : ''} transition-transform`}>
                              {getCatName(cat)}
                            </span>
                          </button>
                          
                          {hasChildren && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (cat.id) goForward(cat.id);
                              }}
                              className="p-3 -mr-2 text-slate-300 hover:text-slate-900 transition-colors"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          )}
                          {isActive && !hasChildren && <Check className="w-4 h-4 text-slate-900" strokeWidth={3} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* All Products Action */}
                  <button
                    onClick={() => updateParams({ category: 'All' })}
                    className={`group flex items-center justify-between w-full py-2 ${activeCategorySlug === 'All' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    <span className="text-[18px] font-bold uppercase tracking-widest transition-all">
                      {settings.allCategoriesText?.[lang] || 'All Products'}
                    </span>
                    <ChevronRight className={`w-5 h-5 transition-all ${activeCategorySlug === 'All' ? 'translate-x-1 text-slate-900' : 'text-slate-300 group-hover:text-slate-900'}`} />
                  </button>

                  <div className="w-8 h-px bg-slate-100" />

                  {/* Root Categories Grid */}
                  <div className="grid grid-cols-3 gap-x-2 gap-y-8">
                    {currentCategories.map((category) => {
                      const hasChildren = categories.some(c => c.parentId === category.id);
                      const isActive = activeCategorySlug === category.slug;

                      return (
                        <div key={category.id} className="relative group">
                          <button
                            onClick={() => {
                              updateParams({ category: category.slug });
                              if (hasChildren && category.id) goForward(category.id);
                            }}
                            className="flex flex-col items-center gap-3 w-full group"
                          >
                            <div className={`relative w-full aspect-square rounded-2xl overflow-hidden border transition-all duration-300 ${
                              isActive ? 'border-slate-900 bg-slate-100 scale-[1.02]' : 'border-slate-100 bg-slate-50 group-hover:border-slate-200'
                            }`}>
                              {category.imageUrl ? (
                                <Image
                                  src={getOptimizedImageUrl(category.imageUrl, 240, 75)}
                                  alt={getCatName(category)}
                                  fill
                                  className={`object-cover transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
                                  sizes="150px"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-200">
                                  <ShoppingBag className="w-8 h-8" strokeWidth={1} />
                                </div>
                              )}
                              
                              {/* Overlay for active state */}
                              {isActive && (
                                <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px] flex items-center justify-center">
                                  <Check className="w-8 h-8 text-slate-900" strokeWidth={2.5} />
                                </div>
                              )}
                            </div>
                            
                            <span className={`text-[10px] font-black uppercase tracking-[0.1em] text-center leading-tight transition-colors ${
                              isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-900'
                            }`}>
                              {getCatName(category)}
                            </span>
                          </button>

                          {hasChildren && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (category.id) goForward(category.id);
                              }}
                              className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-900 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                              aria-label={`Open subcategories for ${getCatName(category)}`}
                            >
                              <Plus className="w-4 h-4" strokeWidth={3} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </nav>
      </div>
    </div>
  );
}

