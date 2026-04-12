"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Product } from '@/store/useCartStore';
import { Category } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, X, SlidersHorizontal, ChevronRight, ChevronDown, Folder, ListFilter, Check, ShoppingBag } from 'lucide-react';
import { IconRenderer } from '@/components/IconRenderer';
import { handleFirestoreError, OperationType } from '@/utils/firestoreErrorHandler';

import { useCartStore } from '@/store/useCartStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';

const Highlight = ({ text, query }: { text: string; query: string }) => {
  if (!text) return null;
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-amber-100 text-amber-900 rounded-2xl px-0.5 font-medium">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
};

function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [categoriesData, setCategoriesData] = useState<Category[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const { settings } = useSettingsStore();
  const { addItem } = useCartStore();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      setCategoriesData(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      const prices = products.map(p => p.price);
      setPriceRange([0, Math.ceil(Math.max(...prices))]);
    }
  }, [products]);

  const categoryTree = useMemo(() => {
    const rootCategories = categoriesData.filter(c => !c.parentId);
    const tree = rootCategories.map(root => ({
      ...root,
      children: categoriesData.filter(c => c.parentId === root.id)
    }));
    return tree;
  }, [categoriesData]);
  
  useEffect(() => {
    setVisibleCount(20);
  }, [activeCategory, debouncedSearchQuery, sortBy, onlyInStock, priceRange, selectedColors, selectedSizes, minRating]);

  const allFilteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesSearch = p.title?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
                            (p.description || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                            (p.category || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      const matchesStock = !onlyInStock || (p.stock && p.stock > 0);
      
      const productColors: string[] = (p as any).colors || ['Black', 'White', 'Beige'];
      const productSizes: string[] = (p as any).sizes || ['S', 'M', 'L', 'XL'];
      const productRating = (p as any).rating || 4.5;

      const matchesColor = selectedColors.length === 0 || selectedColors.some(c => productColors.some(pc => pc.toLowerCase() === c.toLowerCase()));
      const matchesSize = selectedSizes.length === 0 || selectedSizes.some(s => productSizes.includes(s));
      const matchesRating = productRating >= minRating;

      return matchesCategory && matchesSearch && matchesPrice && matchesStock && matchesColor && matchesSize && matchesRating;
    });

    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
    }

    return result;
  }, [products, activeCategory, debouncedSearchQuery, sortBy, onlyInStock, priceRange, selectedColors, selectedSizes, minRating]);

  const displayedProducts = useMemo(() => {
    return allFilteredProducts.slice(0, visibleCount);
  }, [allFilteredProducts, visibleCount]);

  const loadMore = () => {
    if (visibleCount < allFilteredProducts.length) {
      setVisibleCount(prev => prev + 20);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleCount, allFilteredProducts.length]);

  const isVideo = (url: string) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.mov');
  };

  // Prevent body scroll when mobile filters are open
  useEffect(() => {
    if (isMobileFiltersOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileFiltersOpen]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-ink"></div>
      </div>
    );
  }

  const activeFilterCount = (searchQuery ? 1 : 0) + (selectedColors.length > 0 ? 1 : 0) + (selectedSizes.length > 0 ? 1 : 0) + (sortBy !== 'newest' ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          
          {/* Desktop Sidebar Filters */}
          <div className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-32 space-y-10">
              {/* Search */}
              <section>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={settings.searchPlaceholder?.[lang] || "Search products..."}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-all"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                </div>
              </section>

              {/* Categories */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-brand-ink mb-5">{settings.categoriesText?.[lang] || 'Categories'}</h3>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => setActiveCategory('All')}
                    className={`text-left text-sm py-1.5 transition-all flex items-center justify-between group ${activeCategory === 'All' ? 'text-brand-ink font-medium' : 'text-brand-muted hover:text-brand-ink'}`}
                  >
                    <span>{settings.allCategoriesText?.[lang] || 'All Collections'}</span>
                    {activeCategory === 'All' && <ChevronRight className="w-4 h-4" />}
                  </button>
                  {categoryTree.map((cat) => {
                    const hasChildren = cat.children.length > 0;
                    const isExpanded = activeCategory === cat.name || cat.children.some(c => c.name === activeCategory);
                    return (
                    <div key={cat.id} className="flex flex-col">
                      <button
                        onClick={() => setActiveCategory(cat.name)}
                        className={`text-left text-sm py-1.5 transition-all flex items-center justify-between group ${activeCategory === cat.name ? 'text-brand-ink font-medium' : 'text-brand-muted hover:text-brand-ink'}`}
                      >
                        <div className="flex items-center gap-3">
                          {(() => {
                            const iconOrImage = cat.iconUrl || cat.imageUrl;
                            if (iconOrImage && iconOrImage !== '') {
                              return iconOrImage.startsWith('lucide:') || iconOrImage.startsWith('icon:') ? (
                                <IconRenderer iconName={iconOrImage} className="w-4 h-4 text-zinc-600" />
                              ) : (
                                <img src={iconOrImage} alt={cat.name} className="w-4 h-4 rounded-full object-cover" />
                              );
                            }
                            return null;
                          })()}
                          <span>{cat.name}</span>
                        </div>
                        {hasChildren ? (
                          isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                        ) : (
                          activeCategory === cat.name && <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      {hasChildren && isExpanded && (
                        <div className="pl-4 flex flex-col space-y-1 mt-1 border-l-2 border-gray-50 ml-1">
                          {cat.children.map((child) => (
                            <button
                              key={child.id}
                              onClick={() => setActiveCategory(child.name)}
                              className={`text-left text-sm py-1 transition-all ${activeCategory === child.name ? 'text-brand-ink font-medium' : 'text-brand-muted hover:text-brand-ink'}`}
                            >
                              {child.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )})}
                </div>
              </section>

              {/* Sort By */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-brand-ink mb-5">{settings.sortByText?.[lang] || 'Sort By'}</h3>
                <div className="flex flex-col space-y-2">
                  {[
                    { id: 'newest', label: settings.sortNewestText?.[lang] || 'Newest Arrivals' },
                    { id: 'price-asc', label: settings.sortPriceAscText?.[lang] || 'Price: Low to High' },
                    { id: 'price-desc', label: settings.sortPriceDescText?.[lang] || 'Price: High to Low' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSortBy(option.id)}
                      className={`text-left text-sm py-1.5 transition-all flex items-center justify-between group ${sortBy === option.id ? 'text-brand-ink font-medium' : 'text-brand-muted hover:text-brand-ink'}`}
                    >
                      <span>{option.label}</span>
                      {sortBy === option.id && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </section>

              {/* Colors */}
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none outline-none mb-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-brand-ink">{settings.colorsText?.[lang] || 'Colors'}</h3>
                  <ChevronRight className="w-4 h-4 text-brand-muted group-open:rotate-90 transition-transform" />
                </summary>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'Black', label: settings.colorBlackText?.[lang] || 'Black', hex: '#000000' },
                    { id: 'White', label: settings.colorWhiteText?.[lang] || 'White', hex: '#FFFFFF' },
                    { id: 'Beige', label: settings.colorBeigeText?.[lang] || 'Beige', hex: '#F5F5DC' },
                    { id: 'Navy', label: settings.colorNavyText?.[lang] || 'Navy', hex: '#000080' },
                    { id: 'Grey', label: settings.colorGreyText?.[lang] || 'Grey', hex: '#808080' }
                  ].map((colorObj) => (
                    <button
                      key={colorObj.id}
                      onClick={() => {
                        setSelectedColors(prev => 
                          prev.includes(colorObj.id) ? prev.filter(c => c !== colorObj.id) : [...prev, colorObj.id]
                        );
                      }}
                      className="group/color relative"
                      title={colorObj.label}
                    >
                      <div 
                        className={`w-8 h-8 rounded-full border transition-all ${selectedColors.includes(colorObj.id) ? 'border-brand-ink ring-2 ring-brand-ink ring-offset-2' : 'border-gray-200 group-hover/color:border-gray-400 shadow-sm'}`}
                        style={{ backgroundColor: colorObj.hex }}
                      />
                    </button>
                  ))}
                </div>
              </details>

              {/* Sizes */}
              <details className="group mt-8">
                <summary className="flex items-center justify-between cursor-pointer list-none outline-none mb-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-brand-ink">{settings.sizesText?.[lang] || 'Sizes'}</h3>
                  <ChevronRight className="w-4 h-4 text-brand-muted group-open:rotate-90 transition-transform" />
                </summary>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'XS', label: settings.sizeXSText?.[lang] || 'XS' },
                    { id: 'S', label: settings.sizeSText?.[lang] || 'S' },
                    { id: 'M', label: settings.sizeMText?.[lang] || 'M' },
                    { id: 'L', label: settings.sizeLText?.[lang] || 'L' },
                    { id: 'XL', label: settings.sizeXLText?.[lang] || 'XL' }
                  ].map((sizeObj) => (
                    <button
                      key={sizeObj.id}
                      onClick={() => {
                        setSelectedSizes(prev => 
                          prev.includes(sizeObj.id) ? prev.filter(s => s !== sizeObj.id) : [...prev, sizeObj.id]
                        );
                      }}
                      className={`w-10 h-10 rounded-2xl text-xs font-medium transition-all flex items-center justify-center border ${
                        selectedSizes.includes(sizeObj.id) 
                          ? 'bg-brand-ink text-white border-brand-ink' 
                          : 'bg-white text-brand-ink border-gray-200 hover:border-brand-ink'
                      }`}
                    >
                      {sizeObj.label}
                    </button>
                  ))}
                </div>
              </details>

              {/* Reset */}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setSortBy('newest');
                    setSelectedColors([]);
                    setSelectedSizes([]);
                    setOnlyInStock(false);
                    setSearchQuery('');
                  }}
                  className="w-full py-3 text-sm font-medium text-brand-ink bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors"
                >
                  {settings.clearAllFiltersText?.[lang] || 'Clear All Filters'}
                </button>
              )}
            </div>
          </div>
          
          {/* Product Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8 hidden lg:flex">
              <p className="text-sm text-brand-muted">
                {settings.showingText?.[lang] || 'Showing'} <span className="font-medium text-brand-ink">{displayedProducts.length}</span> {settings.ofText?.[lang] || 'of'} <span className="font-medium text-brand-ink">{allFilteredProducts.length}</span> {settings.productsText?.[lang] || 'products'}
              </p>
            </div>

            {allFilteredProducts.length === 0 ? (
              <div className="py-16 md:py-24 text-center border-b border-gray-200/60 last:border-0">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100">
                  <Search className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-2xl font-sans text-brand-ink mb-3">{settings.noProductsFoundText?.[lang] || 'No products found'}</h3>
                <p className="text-brand-muted text-base mb-8 max-w-md mx-auto">{settings.noProductsDescription?.[lang] || 'We couldn\'t find anything matching your search criteria.'}</p>
                <button 
                  onClick={() => { setSearchQuery(''); setActiveCategory('All'); setSelectedColors([]); setSelectedSizes([]); }}
                  className="bg-brand-ink text-white px-8 py-3.5 rounded-2xl text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  {settings.clearFiltersText?.[lang] || 'Clear Filters'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 md:gap-x-8 gap-y-10 md:gap-y-16">
                {displayedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.5) }}
                    className="group flex flex-col h-full"
                  >
                    <Link href={`/product/${product.id}`} className="block relative aspect-[4/5] mb-4 overflow-hidden bg-gray-50 rounded-2xl shadow-sm border border-gray-100">
                      {product.isFeatured && (
                        <div className="absolute top-3 left-3 md:top-4 md:left-4 z-20">
                          <span className="bg-white/95 backdrop-blur-sm text-brand-ink text-[10px] md:text-xs font-bold px-3 py-1 md:px-4 md:py-1.5 rounded-2xl uppercase tracking-wider shadow-sm">
                            {settings.featuredBadgeText?.[lang] || 'Featured'}
                          </span>
                        </div>
                      )}
                      {isVideo(product.imageUrl) ? (
                        product.imageUrl && product.imageUrl.trim() !== "" && (
                          <video 
                            src={product.imageUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        )
                      ) : (
                        product.imageUrl && product.imageUrl.trim() !== "" && (
                          <img 
                            src={product.imageUrl} 
                            alt={product.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        )
                      )}
                      
                      {/* Quick Add Overlay */}
                      <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 z-20 md:opacity-0 group-hover:opacity-100 transition-all duration-300 md:translate-y-2 group-hover:translate-y-0">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            addItem(product);
                            toast.success(`${product.title} added to cart!`, {
                              className: 'bg-black text-white text-xs rounded-full h-9 px-4 flex items-center gap-2',
                              duration: 1500,
                              icon: <Check className="w-3 h-3" />
                            });
                          }}
                          className="bg-white/95 backdrop-blur-sm text-brand-ink hover:bg-brand-ink hover:text-white p-3 md:px-5 md:py-3 rounded-full shadow-xl transition-all duration-300 flex items-center justify-center gap-2 border border-black/5"
                        >
                          <ShoppingBag className="w-4 h-4 md:w-4 md:h-4" />
                          <span className="hidden md:block text-xs font-bold uppercase tracking-wider">
                            {(settings as any).quickAddText?.[lang] || 'Quick Add'}
                          </span>
                        </button>
                      </div>
                    </Link>
                    
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between text-[10px] md:text-xs uppercase tracking-wider font-medium mb-1.5">
                        <span className="text-brand-muted truncate pr-2">{product.category}</span>
                      </div>
                      <h3 className="text-sm md:text-base font-sans font-medium text-brand-ink group-hover:text-brand-muted transition-colors line-clamp-2 mb-2">
                        <Link href={`/product/${product.id}`}>
                          <Highlight text={product.title} query={searchQuery} />
                        </Link>
                      </h3>
                      <div className="mt-auto pt-2">
                        <span className="text-sm md:text-base font-medium text-brand-ink">{formatPrice(product.price || 0, lang, product.prices)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {visibleCount < allFilteredProducts.length && (
              <div className="mt-16 flex justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-2 border-brand-ink/20 border-t-brand-ink rounded-full animate-spin" />
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-muted">Loading more products...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Mobile Filter Button */}
      <div className="lg:hidden fixed bottom-6 inset-x-0 flex justify-center z-40 pointer-events-none">
        <button 
          onClick={() => setIsMobileFiltersOpen(true)}
          className="pointer-events-auto bg-black/30 backdrop-blur-2xl text-white px-6 py-3.5 rounded-full flex items-center space-x-2 font-medium text-sm hover:scale-105 transition-transform active:scale-95 border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
        >
          <div className="flex items-center space-x-1">
            <Search className="w-4 h-4" />
            <ListFilter className="w-4 h-4" />
          </div>
          <span>{settings.filterAndSortText?.[lang] || 'Search & Filter'}</span>
          {activeFilterCount > 0 && (
            <span className="bg-white/30 backdrop-blur-md text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ml-1 border border-white/40">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFiltersOpen(false)}
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
                  onClick={() => setIsMobileFiltersOpen(false)}
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                      onClick={() => setActiveCategory('All')}
                      className={`w-full flex items-center justify-between p-4 rounded-xl ${activeCategory === 'All' ? 'bg-gray-100 font-bold' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <Folder className="w-5 h-5" />
                        <span>All Categories</span>
                      </div>
                      {activeCategory === 'All' && <Check className="w-5 h-5" />}
                    </button>
                    {categoryTree.map(cat => (
                      <button key={cat.id} className="w-full flex items-center justify-between p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Folder className="w-5 h-5" />
                          <span>{cat.name}</span>
                        </div>
                        <ChevronRight className="w-5 h-5" />
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
                        onClick={() => setSortBy(option.id)}
                        className={`w-full text-right p-4 rounded-xl ${sortBy === option.id ? 'bg-gray-100 font-bold' : ''}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="p-6 border-t border-gray-100 flex gap-4 shrink-0">
                <button
                  onClick={() => {
                    setSortBy('newest');
                    setSelectedColors([]);
                    setSelectedSizes([]);
                    setOnlyInStock(false);
                    setSearchQuery('');
                  }}
                  className="flex-1 py-4 rounded-full border border-gray-300 font-bold text-brand-ink"
                >
                  Clear All Filters
                </button>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="flex-1 py-4 rounded-full bg-brand-accent text-white font-bold"
                >
                  Show {allFilteredProducts.length} results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Products() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-ink"></div>
      </div>
    }>
      <ProductsContent />
    </React.Suspense>
  );
}
