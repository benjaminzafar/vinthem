"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, ArrowRight, TrendingUp, Sparkles, Zap, Package, ShoppingBag, CheckCircle2, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { FaInstagram, FaFacebook, FaTwitter, FaTiktok } from 'react-icons/fa';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUIStore } from '@/store/useUIStore';
import { Portal } from './Portal';
import { createClient } from '@/utils/supabase/client';
import { formatPrice } from '@/lib/currency';
import { Product } from '@/store/useCartStore';
import { Category, StorefrontSettingsType } from '@/types';

interface SearchBarProps {
  placeholder?: string;
  categories?: Category[];
  lang?: string;
  settings?: StorefrontSettingsType;
}

export function SearchBar({ placeholder, categories: initialCategories = [], lang = 'en', settings }: SearchBarProps) {
  const { setIsFilterDrawerOpen, searchQuery, setSearchQuery } = useUIStore();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>(initialCategories);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const fetchData = async () => {
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .or('status.eq.published,status.eq.active,status.is.null'),
        supabase
          .from('categories')
          .select('*, translations')
          .order('show_in_hero', { ascending: false })
          .order('name', { ascending: true }),
      ]);

      setAllProducts((productsResponse.data || []).map((p) => ({
        ...p,
        imageUrl: p.image_url || p.imageUrl
      })));

      if (categoriesResponse.data) {
        setAllCategories(categoriesResponse.data.map((c) => ({
          ...c,
          imageUrl: c.image_url || c.imageUrl,
          iconUrl: c.icon_url || c.iconUrl,
          showInHero: c.show_in_hero,
          translations: c.translations
        })));
      }
    } catch (error) {
      console.error('Error fetching search data:', error);
    }
  };

  useEffect(() => {
    setAllCategories(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    let focusTimeout: NodeJS.Timeout;
    if (isOverlayOpen) {
      document.body.style.overflow = 'hidden';
      void fetchData();
      focusTimeout = setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      if (focusTimeout) clearTimeout(focusTimeout);
    };
  }, [isOverlayOpen]);

  const availableFilters = useMemo(() => {
    const filters: Record<string, Set<string>> = {};
    
    allProducts.forEach(product => {
      const options = product.options || product.translations?.[lang]?.options || [];
      options.forEach(opt => {
        if (!filters[opt.name]) filters[opt.name] = new Set();
        opt.values.forEach(val => filters[opt.name].add(val));
      });
    });

    return Object.entries(filters).map(([name, values]) => ({
      name,
      values: Array.from(values).sort()
    })).filter(f => f.values.length > 1);
  }, [allProducts, lang]);

  const filteredResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    let products = allProducts;

    if (query) {
      products = products.filter(p => 
        (p.title?.toLowerCase().includes(query)) || 
        (p.translations?.[lang]?.title?.toLowerCase().includes(query))
      );
    }

    Object.entries(selectedFilters).forEach(([name, values]) => {
      if (values.length > 0) {
        products = products.filter(p => {
          const options = p.options || p.translations?.[lang]?.options || [];
          const opt = options.find(o => o.name === name);
          if (!opt) return false;
          return values.some(v => opt.values.includes(v));
        });
      }
    });

    // Apply Sorting (Internal default to newest if null)
    products = [...products].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return {
      products: products.slice(0, 16),
      categories: query ? allCategories.filter(c => 
        (c.name?.toLowerCase().includes(query)) || 
        (c.slug?.toLowerCase().includes(query))
      ).slice(0, 4) : []
    };
  }, [searchQuery, allProducts, allCategories, lang, selectedFilters, sortBy]);

  const toggleFilter = (name: string, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[name] || [];
      const next = current.includes(value) 
        ? current.filter(v => v !== value)
        : [...current, value];
      
      return { ...prev, [name]: next };
    });
  };

  const clearFilters = () => {
    setSelectedFilters({});
    setSortBy(null);
  };
  const activeFilterCount = Object.values(selectedFilters).flat().length;

  const handleToggle = () => {
    setIsOverlayOpen(!isOverlayOpen);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate.push(`/${lang}/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsOverlayOpen(false);
    }
  };

  const Highlight = ({ text, query }: { text: string; query: string }) => {
    if (!text) return null;
    if (!query.trim()) return <>{text}</>;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-slate-100 text-slate-900 px-0.5 font-medium rounded-sm inline-block">{part}</mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="relative">
      <button 
        onClick={handleToggle}
        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors rounded"
        aria-label="Search"
      >
        <Search className="w-5 h-5" strokeWidth={1.5} />
      </button>
      
      <AnimatePresence>
        {isOverlayOpen && (
          <Portal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOverlayOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[500]"
            />

            <div className={`fixed inset-0 flex items-start justify-center pt-0 lg:pt-[10vh] sm:pt-[15vh] z-[501] pointer-events-none px-0 sm:px-6`}>
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.5 }}
                className="w-full max-w-[850px] bg-white border-0 lg:border border-slate-200 pointer-events-auto lg:shadow-[0_0_80px_rgba(0,0,0,0.1)] flex flex-col h-full lg:h-auto lg:max-h-[70vh] overflow-hidden rounded"
              >
                <div className="flex items-center gap-6 px-10 border-b border-slate-100 bg-white sticky top-0 z-20 shrink-0 h-16">
                  <Search className="w-5 h-5 text-slate-600" strokeWidth={1.5} />
                  <div className="flex-1 relative">
                    <form onSubmit={handleSearch}>
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        aria-label="Search catalog"
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={placeholder || settings?.searchPlaceholder?.[lang] || 'Search products...'}
                        className="w-full h-full py-0 text-lg font-light tracking-tight outline-none bg-transparent placeholder:text-slate-500 text-slate-900"
                      />
                    </form>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setIsOverlayOpen(false)}
                      aria-label="Close search overlay"
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors rounded"
                    >
                      <X className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Filter & Sort Bar (Mobile: Inline Expand | Desktop: Sidebar Layout) */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-white">
                  {/* Left Sidebar / Mobile Header Section */}
                  <div className={`
                    lg:w-[280px] lg:border-r border-slate-100 bg-[#fcfcfc] flex flex-col overflow-hidden
                  `}>
                    {/* Mobile Toggle Trigger */}
                    <button 
                      onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                      className="lg:hidden w-full px-10 py-5 border-b border-slate-100 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <SlidersHorizontal className="w-4 h-4 text-slate-900" strokeWidth={2} />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">
                          {isMobileFilterOpen ? 'Hide Filters' : 'Filter & Sort'}
                        </span>
                        {activeFilterCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">
                            {activeFilterCount}
                          </span>
                        )}
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${isMobileFilterOpen ? 'rotate-90' : ''}`} />
                    </button>

                    {/* Filters Content (Inline on Mobile) */}
                    <div className={`
                      ${isMobileFilterOpen ? 'flex' : 'hidden lg:flex'} 
                      flex-col flex-1 overflow-y-auto custom-scrollbar p-10 lg:p-8 space-y-12 bg-[#fcfcfc]
                    `}>
                      {/* Sort Section */}
                      <div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 mb-6 flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5" />
                          Sort Order
                        </h3>
                        <div className="space-y-3">
                          {[
                            { id: 'newest', label: settings?.sortNewestText?.[lang] || 'Newest Arrivals' },
                            { id: 'price-asc', label: settings?.sortPriceAscText?.[lang] || 'Price: Low to High' },
                            { id: 'price-desc', label: settings?.sortPriceDescText?.[lang] || 'Price: High to Low' }
                          ].map((option) => (
                            <button
                              key={option.id}
                              onClick={() => setSortBy(option.id as any)}
                              className={`w-full text-left text-[12px] font-bold uppercase tracking-widest transition-all ${
                                sortBy === option.id ? 'text-slate-900 underline underline-offset-8 decoration-2' : 'text-slate-500 hover:text-slate-900'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {availableFilters.map((filter) => (
                        <div key={filter.name}>
                          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 mb-6">
                            {filter.name}
                          </h3>
                          <div className="space-y-4">
                            {filter.values.map((val) => {
                              const isActive = selectedFilters[filter.name]?.includes(val);
                              return (
                                <button
                                  key={val}
                                  onClick={() => toggleFilter(filter.name, val)}
                                  className="w-full flex items-center justify-between group transition-all py-1"
                                >
                                  <span className={`text-[12px] font-bold uppercase tracking-widest ${
                                    isActive ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-900'
                                  }`}>
                                    {val}
                                  </span>
                                  {isActive && <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                        <div className="pt-6">
                        {(activeFilterCount > 0 || sortBy !== null) && (
                          <button 
                            onClick={clearFilters}
                            className="w-full h-12 border border-slate-900 text-slate-900 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all rounded-[4px]"
                          >
                            Reset All
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Content: Results Grid */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
                    <AnimatePresence mode="wait">
                      {!searchQuery && activeFilterCount === 0 ? (
                        <motion.div
                          key="popup-idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="h-full flex flex-col items-center justify-center p-10 text-center"
                        >
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <Search className="w-6 h-6 text-slate-300" />
                          </div>
                          <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-900 mb-2">Search Catalog</h3>
                          <p className="text-[13px] text-slate-500 max-w-[280px]">Type to find products or use filters above to browse by attribute.</p>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="popup-results"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-16"
                        >
                          {filteredResults.categories.length > 0 && (
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-6">
                                {settings?.searchCollectionsResultsText?.[lang] || 'Collections'}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {filteredResults.categories.map(cat => (
                                  <Link
                                    key={cat.id}
                                    href={`/${lang}/products?category=${encodeURIComponent(cat.slug)}`}
                                    onClick={() => setIsOverlayOpen(false)}
                                    className="px-4 py-3 border border-slate-100 hover:border-slate-900 transition-all flex items-center gap-3 bg-slate-50 hover:bg-white group rounded"
                                  >
                                    <span className="text-[13px] font-bold uppercase tracking-widest text-slate-900">
                                      <Highlight text={cat.translations?.[lang]?.name || cat.name} query={searchQuery} />
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-900 transition-all group-hover:translate-x-1" />
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <div className="flex items-center justify-between mb-8">
                              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                {settings?.searchProductsResultsText?.[lang] || 'Products'} ({filteredResults.products.length})
                              </p>
                              <Link href={`/${lang}/products?search=${encodeURIComponent(searchQuery)}`} onClick={() => setIsOverlayOpen(false)} className="text-[11px] font-bold uppercase tracking-widest text-slate-900 hover:opacity-70">
                                {settings?.viewAllResultsText?.[lang] || 'View all results'}
                              </Link>
                            </div>
                            
                            {filteredResults.products.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                {filteredResults.products.map((product, i) => (
                                  <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.02 }}
                                    className="group"
                                  >
                                    <Link 
                                      href={`/${lang}/product/${product.id}`} 
                                      onClick={() => setIsOverlayOpen(false)}
                                      className="block relative aspect-[4/5] overflow-hidden bg-slate-50 border border-slate-100 mb-3 rounded"
                                    >
                                      <Image
                                        src={product.imageUrl}
                                        alt={product.translations?.[lang]?.title || product.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        sizes="(max-width: 768px) 30vw, 15vw"
                                      />
                                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors" />
                                    </Link>
                                    <div className="px-0.5">
                                      <h4 className="text-[13px] font-bold text-slate-900 line-clamp-1 mb-1">
                                        <Highlight text={product.translations?.[lang]?.title || product.title} query={searchQuery} />
                                      </h4>
                                      <p className="text-[13px] font-bold text-slate-900">{formatPrice(product.price, lang)}</p>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-20 text-center border-t border-slate-50 mt-4">
                                <p className="text-slate-500 text-xs italic tracking-wide">
                                  {settings?.searchNoProductsResultsText?.[lang] || settings?.noProductsMatchingText?.[lang] || 'No products found matching your search.'}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
}

