"use client";

import React, { useState } from 'react';
import { Search, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Category } from '@/types';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarFiltersProps {
  categories: Category[];
  settings: any;
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
    setDirection(1);
    setViewStack(prev => [...prev, categoryId]);
  };

  const goBack = () => {
    setDirection(-1);
    setViewStack(prev => prev.slice(0, -1));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
      {/* Dynamic Header */}
      <div className="h-14 px-5 border-b border-slate-100 flex items-center shrink-0 bg-white">
        <AnimatePresence mode="wait">
          {viewStack.length > 0 ? (
            <motion.button
              key="back-btn"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              onClick={goBack}
              className="flex items-center space-x-3 text-slate-400 hover:text-slate-900 transition-colors group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" strokeWidth={1.5} />
              <span className="text-[12px] font-black uppercase tracking-[0.2em]">{activeCategoryData?.name}</span>
            </motion.button>
          ) : (
            <motion.h3 
              key="root-title"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[12px] font-black uppercase tracking-[0.22em] text-slate-900"
            >
              Collections
            </motion.h3>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={viewStack.length}
            custom={direction}
            variants={{
              enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (direction: number) => ({ x: direction < 0 ? '100%' : '-100%', opacity: 0 })
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', damping: 25, stiffness: 150 }}
            className="absolute inset-0 p-5 overflow-y-auto custom-scrollbar space-y-8"
          >
            {/* Search Section */}
            <div className="space-y-4">
              <div className="relative group">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Filter collections..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-sm py-3 px-11 pr-4 text-[13px] focus:bg-white focus:border-slate-900 outline-none transition-all placeholder:text-slate-300"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" strokeWidth={1.5} />
              </div>
            </div>

            {viewStack.length === 0 ? (
              /* Root Level View - Strictly Text-Only */
              <div className="space-y-8">
                <div className="space-y-1">
                  <button
                    onClick={() => updateParams({ category: 'All' })}
                    className={`w-full flex items-center justify-between py-3 px-4 rounded-sm transition-all border ${activeCategory === 'All' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-transparent hover:bg-slate-50 text-slate-500 hover:text-slate-900'}`}
                  >
                    <span className="text-[12px] font-black uppercase tracking-[0.15em]">All Products</span>
                    {activeCategory === 'All' && <Check className="w-5 h-5" strokeWidth={1.5} />}
                  </button>

                  <div className="pt-2 space-y-1">
                    {currentCategories.map((cat) => {
                      const hasChildren = categories.some(c => c.parentId === cat.id);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            if (hasChildren && cat.id) goForward(cat.id);
                            else updateParams({ category: cat.slug });
                          }}
                          className={`w-full flex items-center justify-between py-3 px-4 rounded-sm transition-all border group ${activeCategory === cat.slug ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-transparent hover:bg-slate-50 text-slate-500 hover:text-slate-900'}`}
                        >
                          <span className="text-[12px] font-black uppercase tracking-[0.15em]">{cat.name}</span>
                          {hasChildren ? (
                            <ChevronRight className="w-5 h-5 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
                          ) : (
                            activeCategory === cat.slug && <Check className="w-5 h-5" strokeWidth={1.5} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Integrated Sort Section */}
                <div className="pt-8 border-t border-slate-100 space-y-5">
                   <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Sort By</p>
                   <div className="space-y-1">
                     {[
                       { id: 'newest', label: settings.sortNewestText?.[lang] || 'Newest Arrivals' },
                       { id: 'price-asc', label: settings.sortPriceAscText?.[lang] || 'Price: Low to High' },
                       { id: 'price-desc', label: settings.sortPriceDescText?.[lang] || 'Price: High to Low' }
                     ].map((option) => (
                       <button
                         key={option.id}
                         onClick={() => updateParams({ sort: option.id })}
                         className={`w-full text-left py-3 px-4 rounded-sm transition-all text-[11px] uppercase font-black tracking-[0.12em] ${sortBy === option.id ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-900'}`}
                       >
                         {option.label}
                       </button>
                     ))}
                   </div>
                </div>
              </div>
            ) : (
              /* Sub-level View - Strictly Text-Only */
              <div className="space-y-4">
                <button
                  onClick={() => updateParams({ category: activeCategoryData?.slug || 'All' })}
                  className={`w-full text-center py-3 px-4 rounded-sm transition-all ${activeCategory === activeCategoryData?.slug ? 'bg-slate-900 text-white' : 'bg-slate-900/5 text-slate-900 hover:bg-slate-900/10'}`}
                >
                  <span className="text-[12px] font-black uppercase tracking-[0.15em]">View All {activeCategoryData?.name}</span>
                </button>

                <div className="grid gap-1 pt-4">
                  {currentCategories.map((sub) => {
                    const hasChildren = categories.some(c => c.parentId === sub.id);
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          if (hasChildren && sub.id) goForward(sub.id);
                          else updateParams({ category: sub.slug });
                        }}
                        className={`flex items-center justify-between py-3 px-4 rounded-sm transition-all border ${activeCategory === sub.slug ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-50 text-slate-500 hover:text-slate-900 hover:border-slate-200'}`}
                      >
                        <span className="text-[12px] font-black uppercase tracking-[0.15em]">{sub.name}</span>
                        {hasChildren ? (
                          <ChevronRight className="w-5 h-5 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
                        ) : (
                          activeCategory === sub.slug && <Check className="w-5 h-5" strokeWidth={1.5} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
