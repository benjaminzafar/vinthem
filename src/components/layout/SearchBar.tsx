"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, ArrowRight, TrendingUp, Sparkles, Zap, Package, ShoppingBag, CheckCircle2, ChevronRight } from 'lucide-react';
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
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>(initialCategories);
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
          .select('*')
          .order('pinned_in_search', { ascending: false })
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
          pinnedInSearch: c.pinned_in_search,
          showInHero: c.show_in_hero
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

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return { products: [], categories: [] };
    const query = searchQuery.toLowerCase().trim();
    
    return {
      products: allProducts.filter(p => 
        (p.title?.toLowerCase().includes(query)) || 
        (p.translations?.[lang]?.title?.toLowerCase().includes(query))
      ).slice(0, 16),
      categories: allCategories.filter(c => 
        (c.name?.toLowerCase().includes(query)) || 
        (c.slug?.toLowerCase().includes(query))
      ).slice(0, 4)
    };
  }, [searchQuery, allProducts, allCategories, lang]);
  
  const discoveryCategories = useMemo(() => {
    const pinned = allCategories.filter(c => c.pinnedInSearch).slice(0, 9);
    const heroCollections = allCategories.filter(c => !c.pinnedInSearch && c.showInHero).slice(0, 9 - pinned.length);
    const remainingSlots = Math.max(0, 9 - pinned.length - heroCollections.length);
    const others = allCategories
      .filter(c => !c.pinnedInSearch && !c.showInHero)
      .slice(0, remainingSlots);
    return [...pinned, ...heroCollections, ...others].slice(0, 9);
  }, [allCategories]);

  const isRemoteImage = (url?: string) => url && (url.startsWith('http') || url.startsWith('/') || url.startsWith('blob:'));

  const handleToggle = () => {
    setIsOverlayOpen(!isOverlayOpen);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
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
        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors rounded-lg"
        aria-label="Search"
      >
        <Search className="w-5 h-5" strokeWidth={1.5} />
      </button>
      
      <AnimatePresence>
        {isOverlayOpen && (
          <Portal>
            {/* Backdrop: High dim for focus */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOverlayOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[500]"
            />

            {/* Signature Popup Modal */}
            <div className={`fixed inset-0 flex items-start justify-center pt-0 lg:pt-[10vh] sm:pt-[15vh] z-[501] pointer-events-none px-0 sm:px-6`}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 10 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.5 }}
                  className="w-full max-w-[850px] bg-white border-0 lg:border border-slate-200 pointer-events-auto lg:shadow-[0_0_80px_rgba(0,0,0,0.1)] flex flex-col h-full lg:h-auto lg:max-h-[70vh] overflow-hidden rounded-none lg:rounded-2xl"
                >
                {/* Search Header: Aligned h-16 to match main Navigation */}
                <div className="flex items-center gap-6 px-10 border-b border-slate-100 bg-white sticky top-0 z-20 shrink-0 h-16">
                  <Search className="w-5 h-5 text-slate-600" strokeWidth={1.5} />
                  <div className="flex-1 relative">
                    <form onSubmit={handleSearch}>
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={placeholder || settings?.searchPlaceholder?.[lang] || 'Search products...'}
                        className="w-full h-full py-0 text-lg font-light tracking-tight outline-none bg-transparent placeholder:text-slate-500 text-slate-900"
                      />
                    </form>
                  </div>
                  <div className="flex items-center gap-4">
                    <kbd className="hidden sm:flex h-6 items-center gap-1.5 px-2 font-mono text-[10px] font-medium text-slate-500 border border-slate-100 rounded">ESC</kbd>
                    <button 
                      onClick={() => setIsOverlayOpen(false)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors rounded-lg"
                    >
                      <X className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Content Area: Custom Scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                  <AnimatePresence mode="wait">
                    {!searchQuery ? (
                      <motion.div
                        key="popup-discovery"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-10 space-y-12"
                      >
                        {/* 4 Featured Elements Logic */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                          <div className="lg:col-span-12">
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400 mb-8 px-1 text-center lg:text-left">
                              {settings?.searchDiscoverCollectionsText?.[lang] || 'Discover'}
                            </p>
                            {discoveryCategories.length > 0 ? (
                              <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
                                {discoveryCategories.map((cat) => (
                                  <Link
                                    key={cat.id}
                                    href={`/products?category=${encodeURIComponent(cat.slug)}`}
                                    onClick={() => setIsOverlayOpen(false)}
                                    className="group block relative aspect-square overflow-hidden bg-slate-50 border border-slate-100 rounded-xl"
                                  >
                                    <Image
                                      src={isRemoteImage(cat.imageUrl) ? cat.imageUrl! : `https://images.unsplash.com/photo-1618220179428-22790b46a015?q=80&w=400`}
                                      alt={cat.name}
                                      fill
                                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-slate-900/25 group-hover:bg-slate-900/40 transition-colors" />
                                    <div className="absolute inset-0 p-4 flex items-end">
                                      <span className="text-white text-sm font-medium tracking-tight translate-y-2 group-hover:translate-y-0 transition-transform">{cat.name}</span>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            ) : (
                              <div className="rounded-xl border border-slate-100 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                                {settings?.noCollectionsFoundText?.[lang] || 'No collections found'}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="popup-results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-10 space-y-16"
                      >
                        {/* Matching Collections Badges */}
                        {filteredResults.categories.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 mb-6">
                              {settings?.searchCollectionsResultsText?.[lang] || 'Collections'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {filteredResults.categories.map(cat => (
                                <Link
                                  key={cat.id}
                                  href={`/products?category=${encodeURIComponent(cat.slug)}`}
                                  onClick={() => setIsOverlayOpen(false)}
                                  className="px-4 py-3 border border-slate-100 hover:border-slate-900 transition-all flex items-center gap-3 bg-slate-50 hover:bg-white group rounded-lg"
                                >
                                  <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-900"><Highlight text={cat.name} query={searchQuery} /></span>
                                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-900 transition-all group-hover:translate-x-1" />
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* High-Density 4-Column Grid: Correct Popup Spacing */}
                        <div>
                          <div className="flex items-center justify-between mb-8">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                              {settings?.searchProductsResultsText?.[lang] || 'Products'} ({filteredResults.products.length})
                            </p>
                            <Link href={`/products?search=${encodeURIComponent(searchQuery)}`} onClick={() => setIsOverlayOpen(false)} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 hover:opacity-70">
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
                                    href={`/product/${product.id}`} 
                                    onClick={() => setIsOverlayOpen(false)}
                                    className="block relative aspect-[4/5] overflow-hidden bg-slate-50 border border-slate-100 mb-3 rounded-lg"
                                  >
                                    <Image
                                      src={product.imageUrl}
                                      alt={product.title}
                                      fill
                                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                                      sizes="(max-width: 768px) 30vw, 15vw"
                                    />
                                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors" />
                                  </Link>
                                  <div className="px-0.5">
                                    <h4 className="text-[12px] font-medium text-slate-900 line-clamp-1 mb-1">
                                      <Highlight text={product.translations?.[lang]?.title || product.title} query={searchQuery} />
                                    </h4>
                                    <p className="text-[12px] font-semibold text-slate-900">{formatPrice(product.price, lang)}</p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-20 text-center border-t border-slate-50 mt-4">
                              <p className="text-slate-400 text-xs italic tracking-wide">
                                {settings?.searchNoProductsResultsText?.[lang] || settings?.noProductsMatchingText?.[lang] || 'No products found matching your search.'}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer: Multi-Social Discovery */}
                <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-10 shrink-0">
                  {settings?.socialInstagram && (
                    <Link href={settings.socialInstagram} target="_blank" className="flex items-center gap-2.5 text-slate-400 hover:text-slate-900 transition-colors group text-decoration-none">
                      <FaInstagram className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-[0.18em]">{settings?.instagramText?.[lang] || 'Instagram'}</span>
                    </Link>
                  )}
                  {settings?.socialFacebook && (
                    <Link href={settings.socialFacebook} target="_blank" className="flex items-center gap-2.5 text-slate-400 hover:text-slate-900 transition-colors group text-decoration-none">
                      <FaFacebook className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-[0.18em]">{settings?.facebookText?.[lang] || 'Facebook'}</span>
                    </Link>
                  )}
                  {settings?.socialTwitter && (
                    <Link href={settings.socialTwitter} target="_blank" className="flex items-center gap-2.5 text-slate-400 hover:text-slate-900 transition-colors group text-decoration-none">
                      <FaTwitter className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-[0.18em]">{settings?.twitterText?.[lang] || 'Twitter'}</span>
                    </Link>
                  )}
                  {settings?.socialTikTok && (
                    <Link href={settings.socialTikTok} target="_blank" className="flex items-center gap-2.5 text-slate-400 hover:text-slate-900 transition-colors group text-decoration-none">
                      <FaTiktok className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-[0.18em]">{settings?.tiktokText?.[lang] || 'TikTok'}</span>
                    </Link>
                  )}
                  {!settings?.socialInstagram && !settings?.socialFacebook && !settings?.socialTwitter && !settings?.socialTikTok && (
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-300">Scandinavian Interior Design Standard</p>
                  )}
                </div>
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
}
