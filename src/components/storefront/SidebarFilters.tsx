"use client";

import React from 'react';
import { Search, ChevronRight, ChevronDown, Check } from 'lucide-react';
import Image from 'next/image';
import { Category } from '@/types';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface SidebarFiltersProps {
  categories: Category[];
  settings: any;
  lang: string;
  searchInput: string;
  setSearchInput: (val: string) => void;
  selectedColors: string[];
  setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  selectedSizes: string[];
  setSelectedSizes: React.Dispatch<React.SetStateAction<string[]>>;
}

export function SidebarFilters({
  categories,
  settings,
  lang,
  searchInput,
  setSearchInput,
  selectedColors,
  setSelectedColors,
  selectedSizes,
  setSelectedSizes,
}: SidebarFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

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

  const rootCategories = categories.filter(c => !c.parentId);
  const categoryTree = rootCategories.map(root => ({
    ...root,
    children: categories.filter(c => c.parentId === root.id)
  }));

  return (
    <div className="sticky top-32 space-y-10">
      {/* Search */}
      <section>
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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
            onClick={() => updateParams({ category: 'All' })}
            className={`text-left text-sm py-1.5 transition-all flex items-center justify-between group ${activeCategory === 'All' ? 'text-brand-ink font-medium' : 'text-brand-muted hover:text-brand-ink'}`}
          >
            <span>{settings.allCategoriesText?.[lang] || 'All Collections'}</span>
            {activeCategory === 'All' && <ChevronRight className="w-4 h-4" />}
          </button>
          {categoryTree.map((cat) => {
            const hasChildren = cat.children.length > 0;
            const isExpanded = activeCategory === cat.slug || cat.children.some(c => c.slug === activeCategory);
            return (
              <div key={cat.id} className="flex flex-col">
                <button
                  onClick={() => updateParams({ category: cat.slug })}
                  className={`text-left text-sm py-1.5 transition-all flex items-center justify-between group ${activeCategory === cat.slug ? 'text-brand-ink font-medium' : 'text-brand-muted hover:text-brand-ink'}`}
                >
                  <div className="flex items-center gap-3">
                    {(() => {
                      const iconOrImage = cat.iconUrl || cat.imageUrl;
                      if (iconOrImage && iconOrImage !== '') {
                        return iconOrImage.startsWith('lucide:') || iconOrImage.startsWith('icon:') ? (
                          <div className="w-4 h-4 text-zinc-600 flex items-center justify-center">
                             {/* Simple icon fallback since IconRenderer is complex */}
                             <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0">
                            <Image src={iconOrImage} alt={cat.name} fill className="object-cover" />
                          </div>
                        );
                      }
                      return null;
                    })()}
                    <span>{cat.name}</span>
                  </div>
                  {hasChildren ? (
                    isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                  ) : (
                    activeCategory === cat.slug && <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                {hasChildren && isExpanded && (
                  <div className="pl-4 flex flex-col space-y-1 mt-1 border-l-2 border-gray-50 ml-1">
                    {cat.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => updateParams({ category: child.slug })}
                        className={`text-left text-sm py-1 transition-all ${activeCategory === child.slug ? 'text-brand-ink font-medium' : 'text-brand-muted hover:text-brand-ink'}`}
                      >
                        {child.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
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
              onClick={() => updateParams({ sort: option.id })}
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
            { id: 'Black', hex: '#000000' },
            { id: 'White', hex: '#FFFFFF' },
            { id: 'Beige', hex: '#F5F5DC' },
            { id: 'Navy', hex: '#000080' },
            { id: 'Grey', hex: '#808080' }
          ].map((colorObj) => (
            <button
              key={colorObj.id}
              onClick={() => {
                setSelectedColors(prev => 
                  prev.includes(colorObj.id) ? prev.filter(c => c !== colorObj.id) : [...prev, colorObj.id]
                );
              }}
              className="group/color relative"
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
          {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
            <button
              key={size}
              onClick={() => {
                setSelectedSizes(prev => 
                  prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
                );
              }}
              className={`w-10 h-10 rounded-2xl text-xs font-medium transition-all flex items-center justify-center border ${
                selectedSizes.includes(size) 
                  ? 'bg-brand-ink text-white border-brand-ink' 
                  : 'bg-white text-brand-ink border-gray-200 hover:border-brand-ink'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
