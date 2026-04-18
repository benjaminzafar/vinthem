"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Search, LayoutGrid, Check, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Category } from '@/types';
import { Product } from '@/store/useCartStore';
import { formatPrice } from '@/lib/currency';

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

  const isSearching = searchInput.trim().length > 0;
  
  const liveResults = React.useMemo(() => {
    if (!isSearching || !allProducts) return [];
    const query = searchInput.toLowerCase().trim();
    return allProducts.filter(p => 
      p.title.toLowerCase().includes(query) || 
      p.description?.toLowerCase().includes(query) ||
      p.translations?.[lang]?.title.toLowerCase().includes(query)
    ).slice(0, 6);
  }, [searchInput, allProducts, lang, isSearching]);
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
            className="fixed inset-y-0 right-0 z-[210] w-full bg-white lg:hidden flex flex-col"
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
                      <span className="text-[13px] font-black uppercase tracking-[0.2em]">{activeCategoryData?.name}</span>
                    </motion.button>
                  ) : (
                    <motion.h2 
                      key="filter-title"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[13px] font-black uppercase tracking-[0.22em] text-slate-900 mr-auto"
                    >
                      Filter & Sort
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
                 key={isSearching ? 'search-view' : viewStack.length}
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
                 {/* Search Bar stays visible in all views for quick access */}
                 <div className="space-y-4 pt-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Search</p>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder={settings.searchPlaceholder?.[lang] || "Search products..."}
                        className="w-full bg-slate-50 border border-slate-100 rounded-sm py-4 pl-12 pr-4 text-sm focus:border-slate-900 outline-none transition-all placeholder:text-slate-300"
                      />
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5} />
                    </div>
                  </div>

                 {isSearching ? (
                   /* Search Results View */
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Live Results</h3>
                        <span className="text-[10px] font-medium text-slate-400 italic">Showing top results</span>
                      </div>

                      {liveResults.length > 0 ? (
                        <div className="grid gap-4">
                          {liveResults.map((product) => (
                            <Link
                              key={product.id}
                              href={`/product/${product.id}`}
                              onClick={onClose}
                              className="group flex items-center gap-4 bg-slate-50 p-3 rounded-sm border border-slate-100 transition-all hover:bg-white hover:border-slate-200"
                            >
                              <div className="relative h-16 w-16 overflow-hidden rounded-sm bg-white shrink-0">
                                {product.imageUrl ? (
                                  <Image
                                    src={product.imageUrl}
                                    alt={product.title}
                                    fill
                                    sizes="64px"
                                    className="object-cover transition-transform group-hover:scale-110"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-[8px] uppercase tracking-tighter text-slate-300">
                                    Mavren
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <h4 className="text-[12px] font-bold text-slate-900 truncate">
                                  {product.translations?.[lang]?.title || product.title}
                                </h4>
                                <p className="mt-1 text-[11px] font-medium text-slate-500">
                                  {formatPrice(product.price || 0, lang, product.prices)}
                                </p>
                              </div>
                              <ArrowRight className="ml-auto w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors" strokeWidth={1.5} />
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center">
                          <Search className="mx-auto w-8 h-8 text-slate-200 mb-4" strokeWidth={1.5} />
                          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">No products match your search</p>
                        </div>
                      )}
                    </div>
                 ) : viewStack.length === 0 ? (
                   /* Root View */
                   <>
                    {/* Collections */}
                    <div className="space-y-6">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Collections</h3>
                      <div className="space-y-1">
                        <button
                          onClick={() => updateParams({ category: 'All' })}
                          className={`w-full flex items-center justify-between p-4 border rounded-sm ${activeCategory === 'All' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-600'}`}
                        >
                          <div className="flex items-center gap-3">
                            <LayoutGrid className="w-4 h-4" strokeWidth={1.5} />
                            <span className="text-[11px] font-black uppercase tracking-widest">All Categories</span>
                          </div>
                          {activeCategory === 'All' && <Check className="w-4 h-4" strokeWidth={1.5} />}
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
                              className={`w-full flex items-center justify-between p-4 border rounded-sm ${activeCategory === cat.slug ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-600'}`}
                            >
                              <div className="flex items-center gap-3">
                                <LayoutGrid className="w-4 h-4" strokeWidth={1.5} />
                                <span className="text-[11px] font-black uppercase tracking-widest">{cat.name}</span>
                              </div>
                              {hasChildren ? (
                                <ChevronRight className="w-4 h-4 text-slate-300" strokeWidth={1.5} />
                              ) : (
                                activeCategory === cat.slug && <Check className="w-4 h-4" strokeWidth={1.5} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sort By */}
                    <div className="space-y-6">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Sort By</h3>
                      <div className="space-y-1">
                        {[
                          { id: 'newest', label: settings.sortNewestText?.[lang] || 'Newest Arrivals' },
                          { id: 'price-asc', label: settings.sortPriceAscText?.[lang] || 'Price: Low to High' },
                          { id: 'price-desc', label: settings.sortPriceDescText?.[lang] || 'Price: High to Low' }
                        ].map(option => (
                          <button
                            key={option.id}
                            onClick={() => updateParams({ sort: option.id })}
                            className={`w-full text-left p-4 border rounded-sm ${sortBy === option.id ? 'bg-slate-900 border-slate-900 text-white font-bold' : 'bg-white border-slate-100 text-slate-600'}`}
                          >
                            <span className="text-[11px] font-black uppercase tracking-widest">{option.label}</span>
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
                        className={`w-full flex items-center justify-between p-5 rounded-sm transition-all ${activeCategory === activeCategoryData?.slug ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900 border border-slate-100'}`}
                      >
                        <span className="text-xs font-bold uppercase tracking-widest">View All {activeCategoryData?.name}</span>
                        {activeCategory === activeCategoryData?.slug ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
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
                              className={`flex items-center justify-between p-4 border rounded-sm transition-colors ${activeCategory === sub.slug ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-600'}`}
                            >
                              <span className="text-[11px] font-black uppercase tracking-widest">{sub.name}</span>
                              {hasChildren ? (
                                <ChevronRight className="w-4 h-4 text-slate-300" />
                              ) : (
                                activeCategory === sub.slug && <Check className="w-4 h-4" />
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

            <div className="p-4 border-t border-slate-100 flex items-center gap-3 shrink-0 mb-safe">
              <button
                onClick={() => {
                  setSearchInput('');
                  updateParams({ search: null, category: 'All', sort: 'newest' });
                  onClose();
                }}
                className="flex-1 bg-white border border-slate-200 text-slate-400 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-slate-900 rounded-sm"
              >
                Clear
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-slate-900 text-white py-3.5 text-[11px] font-black uppercase tracking-[0.22em] transition-all hover:bg-slate-800 rounded-sm active:scale-[0.98]"
              >
                Apply ({productCount})
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
