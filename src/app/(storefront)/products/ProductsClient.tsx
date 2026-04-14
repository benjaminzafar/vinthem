"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Product } from '@/store/useCartStore';
import { Category } from '@/types';
import { Search, ListFilter } from 'lucide-react';
import { SidebarFilters } from '@/components/storefront/SidebarFilters';
import { MobileFilters } from '@/components/storefront/MobileFilters';
import { ProductCard } from '@/components/product/ProductCard';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/hooks/useDebounce';

interface ProductsClientProps {
  initialProducts: Product[];
  initialCategories: Category[];
}

export default function ProductsClient({ initialProducts, initialCategories }: ProductsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categoriesData, setCategoriesData] = useState<Category[]>(initialCategories);
  
  const activeCategory = searchParams.get('category') || 'All';
  const sortBy = searchParams.get('sort') || 'newest';
  
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  
  const { settings } = useSettingsStore();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(searchInput, 400);

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

  useEffect(() => {
    updateParams({ search: debouncedSearch || null });
  }, [debouncedSearch]);

  useEffect(() => { setProducts(initialProducts); }, [initialProducts]);
  useEffect(() => { setCategoriesData(initialCategories); }, [initialCategories]);

  const displayedProducts = useMemo(() => {
    return products.slice(0, visibleCount);
  }, [products, visibleCount]);

  const loadMore = () => {
    if (visibleCount < products.length) {
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
  }, [visibleCount, products.length]);

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          
          <div className="hidden lg:block w-64 shrink-0">
            <SidebarFilters 
              categories={categoriesData}
              settings={settings}
              lang={lang}
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              selectedColors={selectedColors}
              setSelectedColors={setSelectedColors}
              selectedSizes={selectedSizes}
              setSelectedSizes={setSelectedSizes}
            />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8 hidden lg:flex">
              <p className="text-sm text-brand-muted">
                {settings.showingText?.[lang] || 'Showing'} <span className="font-medium text-brand-ink">{displayedProducts.length}</span> {settings.ofText?.[lang] || 'of'} <span className="font-medium text-brand-ink">{products.length}</span> {settings.productsText?.[lang] || 'products'}
              </p>
            </div>

            {products.length === 0 ? (
              <div className="py-16 md:py-24 text-center border-b border-gray-200/60 last:border-0">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100">
                  <Search className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-2xl font-sans text-brand-ink mb-3">{settings.noProductsFoundText?.[lang] || 'No products found'}</h3>
                <p className="text-brand-muted text-base mb-8 max-w-md mx-auto">{settings.noProductsDescription?.[lang] || 'We couldn\'t find anything matching your search criteria.'}</p>
                <button 
                  onClick={() => { setSearchInput(''); updateParams({ search: null, category: 'All', sort: 'newest' }); }}
                  className="bg-brand-ink text-white px-8 py-3.5 rounded-2xl text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  {settings.clearFiltersText?.[lang] || 'Clear Filters'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 md:gap-x-8 gap-y-10 md:gap-y-16">
                {displayedProducts.map((product, index) => (
                  <ProductCard 
                    key={product.id}
                    product={product}
                    lang={lang}
                    settings={settings}
                    priority={index < 4}
                  />
                ))}
              </div>
            )}

            {visibleCount < products.length && (
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

      <div className="lg:hidden fixed bottom-6 inset-x-0 flex justify-center z-40 pointer-events-none">
        <button 
          onClick={() => setIsMobileFiltersOpen(true)}
          className="pointer-events-auto bg-black/30 backdrop-blur-2xl text-white px-6 py-3.5 rounded-full flex items-center space-x-2 font-medium text-sm hover:scale-105 transition-transform active:scale-95 border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.2)1"
        >
          <div className="flex items-center space-x-1">
            <Search className="w-4 h-4" />
            <ListFilter className="w-4 h-4" />
          </div>
          <span>{settings.filterAndSortText?.[lang] || 'Search & Filter'}</span>
        </button>
      </div>

      <MobileFilters 
        isOpen={isMobileFiltersOpen}
        onClose={() => setIsMobileFiltersOpen(false)}
        categories={categoriesData}
        settings={settings}
        lang={lang}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        activeCategory={activeCategory}
        sortBy={sortBy}
        updateParams={updateParams}
        productCount={products.length}
      />
    </div>
  );
}
