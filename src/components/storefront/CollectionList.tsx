"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category, StorefrontSettingsType } from '@/types';
import { ArrowRight, ShoppingBag } from 'lucide-react';

export function CollectionList({ categories, lang, settings }: CollectionListProps) {
  const featuredCategories = categories.filter(c => c.isFeatured);

  return (
    <section id="collection" className="py-20 md:py-32 bg-white" style={{ isolation: 'isolate' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Block - Simplified for stability */}
        <div className="flex flex-col items-center mb-16 text-center">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-slate-400 mb-4">
            {settings.collectionTopSubtitle?.[lang] || 'Curated Catalog'}
          </p>
          <h2 className="text-[28px] md:text-[36px] font-bold text-slate-900 tracking-tight mb-6">
            {settings.collectionTitle?.[lang]}
          </h2>
          <div className="w-10 h-[2px] bg-slate-900 mb-6"></div>
          <p className="text-slate-500 max-w-xl text-[15px] font-normal leading-relaxed">
            {settings.collectionSubtitle?.[lang]}
          </p>
        </div>

        {featuredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-slate-100 rounded">
            <ShoppingBag className="w-10 h-10 text-slate-200 mb-4" />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              {settings.noCollectionsFoundText?.[lang] || 'No collections found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {featuredCategories.map((category, index) => {
              const displayName = category.translations?.[lang]?.name || category.name;
              return (
                <Link 
                  key={category.id} 
                  href={`/${lang}/products?category=${encodeURIComponent(category.slug)}`}
                  className="group block"
                  aria-label={`Browse ${displayName} collection`}
                >
                  {/* Stable Media Stage - No shadows or heavy filters */}
                  <div className="relative aspect-[3/4] overflow-hidden rounded bg-slate-50 border border-slate-100 mb-4 transform-gpu">
                    {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt={`${displayName} collection`}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        priority={index < 2} // Only first 2 for mobile balance
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-200 text-2xl font-black bg-zinc-50">
                        {displayName.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    
                    {/* Simplified Action Indicator - Solid BG, no blur */}
                    <div className="absolute bottom-4 right-4 bg-slate-900 w-10 h-10 rounded flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  {/* Minimalist Labeling */}
                  <div className="px-1">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 truncate">
                      {displayName}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

interface CollectionListProps {
  categories: Category[];
  lang: string;
  settings: StorefrontSettingsType;
}
