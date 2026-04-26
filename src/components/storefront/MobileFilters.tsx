"use client";

import React from 'react';
import Link from 'next/link';
import { Search, ChevronRight, Check, ArrowRight, ChevronLeft, X, LayoutGrid } from 'lucide-react';
import { StorefrontSettings } from '@/store/useSettingsStore';
import { motion, AnimatePresence } from 'motion/react';
import { Category } from '@/types';
import { Product } from '@/store/useCartStore';
import { formatPrice } from '@/lib/currency';

interface MobileFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  settings: StorefrontSettings;
  lang: string;
  searchInput: string;
  setSearchInput: (val: string) => void;
  activeCategory: string;
  sortBy: string;
  updateParams: (newParams: Record<string, string | null>) => void;
  productCount: number;
  allProducts: Product[];
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
  allProducts,
}: MobileFiltersProps) {
  const [viewStack, setViewStack] = React.useState<string[]>([]);
  const [direction, setDirection] = React.useState(1); // 1 for forward, -1 for back

  // Reset stack when drawer closes
  React.useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setViewStack([]), 300);
    } else {
      // Lock body scroll when drawer is open
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

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

  const getCatName = (cat?: Category) => {
    if (!cat) return '';
    return cat.translations?.[lang]?.name || cat.name;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 z-[200] lg:hidden"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', ease: "easeOut", duration: 0.3 }}
            className="fixed inset-y-0 right-0 z-[210] w-full bg-white lg:hidden flex flex-col h-dvh"
          >
            {/* Header with Title and Dynamic Back Button */}
            <div className="flex items-center h-16 px-6 border-b border-slate-100 shrink-0">
               <AnimatePresence mode="wait">
                  {viewStack.length > 0 ? (
                    <motion.button
                      key="back-btn"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      onClick={goBack}
                      className="flex items-center space-x-2 text-slate-400 hover:text-slate-900 transition-colors mr-auto"
                    >
                      <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
                      <span className="text-[14px] font-semibold tracking-tight">{getCatName(activeCategoryData)}</span>
                    </motion.button>
                  ) : (
                    <motion.h2 
                      key="filter-title"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="!text-[12px] !font-bold !uppercase !tracking-widest text-brand-ink mr-auto"
                    >
                      {settings.filterAndSortText?.[lang] || 'Filter & Sort'}
                    </motion.h2>
                  )}
                </AnimatePresence>

              <button 
                onClick={onClose}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-900 transition-colors"
                aria-label="Close filters"
              >
                <X className="w-6 h-6" strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 relative overflow-hidden">
               <AnimatePresence initial={false} custom={direction}>
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
                   transition={{ type: 'tween', ease: "easeInOut", duration: 0.25 }}
                   className="absolute inset-0 p-6 overflow-y-auto custom-scrollbar space-y-10 pb-32"
                 >
                  {viewStack.length === 0 ? (
                    /* Root View */
                    <>
                      {/* Collections */}
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <button
                            onClick={() => updateParams({ category: 'All' })}
                            className={`w-full flex items-center justify-between h-[48px] px-4 border transition-all rounded ${activeCategory === 'All' ? 'bg-slate-50 border-slate-900 border-2 text-slate-900 font-bold' : 'bg-white border-slate-100 text-slate-600'}`}
                          >
                            <div className="flex items-center gap-3">
                              <LayoutGrid className="w-4 h-4" strokeWidth={1.5} />
                              <span className="text-[14px] font-normal tracking-tight">
                                {settings.allCategoriesText?.[lang] || 'All Categories'}
                              </span>
                            </div>
                            {activeCategory === 'All' && <Check className="w-4 h-4 text-slate-900" strokeWidth={2.5} />}
                          </button>
                          {currentCategories.map(cat => {
                            const hasChildren = categories.some(c => c.parentId === cat.id);
                            return (
                              <button 
                                key={cat.id} 
                                onClick={() => {
                                  if (hasChildren && cat.id) goForward(cat.id);
                                  else { updateParams({ category: cat.slug }); onClose(); }
                                }}
                                className={`w-full flex items-center justify-between h-[48px] px-4 border transition-all rounded ${activeCategory === cat.slug ? 'bg-slate-50 border-slate-900 border-2 text-slate-900 font-bold' : 'bg-white border-slate-100 text-slate-600'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-[14px] font-normal tracking-tight truncate max-w-[180px]">{getCatName(cat)}</span>
                                </div>
                                {hasChildren ? (
                                  <ChevronRight className="w-4 h-4 text-slate-300" strokeWidth={1.5} />
                                ) : (
                                  activeCategory === cat.slug && <Check className="w-4 h-4 text-slate-900" strokeWidth={2.5} />
                                )}
                              </button>
                            );
                          })}

                        </div>
                      </div>

                      {/* Sort By */}
                      <div className="space-y-6">
                        <h3 className="!text-[11px] !font-bold !uppercase !tracking-widest text-brand-muted">
                          {settings.sortByText?.[lang] || 'Sort by'}
                        </h3>
                        <div className="space-y-1">
                          {[
                            { id: 'newest', label: settings.sortNewestText?.[lang] || 'Newest Arrivals' },
                            { id: 'price-asc', label: settings.sortPriceAscText?.[lang] || 'Price: Low to High' },
                            { id: 'price-desc', label: settings.sortPriceDescText?.[lang] || 'Price: High to Low' }
                          ].map(option => (
                            <button
                              key={option.id}
                              onClick={() => updateParams({ sort: option.id })}
                              className={`w-full flex items-center h-[48px] px-4 border transition-all rounded ${sortBy === option.id ? 'bg-slate-50 border-slate-900 border-2 text-slate-900 font-black' : 'bg-white border-slate-100 text-slate-600'}`}
                            >
                              <span className="text-[14px] font-normal tracking-tight">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Sub Folder View */
                    <div className="space-y-8 pt-2">
                       <button
                         onClick={() => { updateParams({ category: activeCategoryData?.slug || 'All' }); onClose(); }}
                         className={`w-full flex items-center justify-between h-[48px] px-4 border transition-all rounded ${activeCategory === activeCategoryData?.slug ? 'bg-slate-50 border-slate-900 border-2 text-slate-900 font-bold' : 'bg-slate-50 border-slate-100 text-slate-400 font-medium'}`}>
                          <span className="text-[14px] font-semibold tracking-tight">View all {getCatName(activeCategoryData)}</span>
                          {activeCategory === activeCategoryData?.slug ? <Check className="w-4 h-4 text-slate-900" strokeWidth={2.5} /> : <ArrowRight className="w-4 h-4" />}
                        </button>

                       <div className="grid gap-2">
                         {currentCategories.map((sub) => {
                           const hasChildren = categories.some(c => c.parentId === sub.id);
                           return (
                             <button
                               key={sub.id}
                               onClick={() => {
                                 if (hasChildren && sub.id) goForward(sub.id);
                                 else { updateParams({ category: sub.slug }); onClose(); }
                               }}
                               className={`flex items-center justify-between h-[48px] px-4 border transition-colors rounded ${activeCategory === sub.slug ? 'bg-slate-50 border-slate-900 border-2 text-slate-900 font-bold' : 'bg-white border-slate-100 text-slate-600'}`}
                             >
                               <div className="flex items-center gap-3">
                                 <span className="text-[14px] font-normal tracking-tight truncate max-w-[180px]">{getCatName(sub)}</span>
                               </div>
                               {hasChildren ? (
                                 <ChevronRight className="w-4 h-4 text-slate-300" />
                               ) : (
                                 activeCategory === sub.slug && <Check className="w-4 h-4 text-slate-900" strokeWidth={2.5} />
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

            <div className="p-4 border-t border-slate-100 flex items-center gap-3 shrink-0 mb-safe bg-white z-20">
                <button
                  onClick={() => {
                    setSearchInput('');
                    updateParams({ search: null, category: 'All', sort: 'newest' });
                    onClose();
                  }}
                  className="flex-1 h-11 border border-slate-200 text-[12px] font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-all rounded flex items-center justify-center"
                >
                  {settings.clearFiltersText?.[lang] || 'Clear'}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 h-11 bg-slate-950 text-white text-[12px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-all rounded active:scale-[0.98] flex items-center justify-center"
                >
                   {settings.applyFiltersText?.[lang] || 'Apply'} ({productCount})
                </button>
             </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

