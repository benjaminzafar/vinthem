"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ListFilter, Search } from 'lucide-react';

import { useDebounce } from '@/hooks/useDebounce';
import { Product } from '@/store/useCartStore';
import { Category } from '@/types';
import { MobileFilters } from '@/components/storefront/MobileFilters';
import { SidebarFilters } from '@/components/storefront/SidebarFilters';
import { ProductCard } from '@/components/product/ProductCard';
import { getClientLocale } from '@/lib/locale';
import { useSettingsStore } from '@/store/useSettingsStore';

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
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(18);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  const activeCategory = searchParams.get('category') || 'All';
  const sortBy = searchParams.get('sort') || 'newest';
  const activeSearch = searchParams.get('search') || '';

  const { settings } = useSettingsStore();
  const lang = getClientLocale();

  const [searchInput, setSearchInput] = useState(activeSearch);
  const debouncedSearch = useDebounce(searchInput, 400);

  const updateParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (!value || value === 'All') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  useEffect(() => {
    updateParams({ search: debouncedSearch || null });
  }, [debouncedSearch]);

  useEffect(() => {
    setProducts(initialProducts.filter((product) => Boolean(product?.id)));
    setVisibleCount(18);
  }, [initialProducts]);

  useEffect(() => {
    setCategoriesData(initialCategories);
  }, [initialCategories]);

  const displayedProducts = useMemo(() => products.slice(0, visibleCount), [products, visibleCount]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 600) {
        setVisibleCount((current) => (current < products.length ? current + 18 : current));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [products.length]);

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24 font-sans">
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
          <aside className="hidden w-64 shrink-0 lg:block">
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
          </aside>

          <main className="min-w-0 flex-1">
            {products.length === 0 ? (
              <div className="border border-slate-200 bg-white px-6 py-20 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                  <Search className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="mt-8 text-2xl font-medium text-slate-900">
                  {settings.noProductsFoundText?.[lang] || 'No products found'}
                </h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500">
                  {settings.noProductsDescription?.[lang] || 'No products match the current search or collection filters.'}
                </p>
                <button
                  onClick={() => {
                    setSearchInput('');
                    updateParams({ search: null, category: null, sort: null });
                  }}
                  className="mt-8 border border-slate-900 px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 transition-all hover:bg-slate-900 hover:text-white"
                >
                  {settings.clearFiltersText?.[lang] || 'Clear Filters'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-8 md:gap-y-14">
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
              <div className="mt-14 flex justify-center">
                <button
                  onClick={() => setVisibleCount((current) => Math.min(current + 18, products.length))}
                  className="border border-slate-900 px-8 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 transition-all hover:bg-slate-900 hover:text-white"
                >
                  Show More
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center lg:hidden">
        <button
          onClick={() => setIsMobileFiltersOpen(true)}
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3.5 text-sm font-medium text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Search className="h-4 w-4" />
          <ListFilter className="h-4 w-4" />
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
