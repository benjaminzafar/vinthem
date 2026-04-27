"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category, StorefrontSettingsType } from '@/types';
import { ArrowRight, ShoppingBag } from 'lucide-react';

export function CollectionList({ categories, lang, settings }: CollectionListProps) {
  const featuredCategories = categories.filter(c => c.isFeatured);

  return (
    <section id="collection" className="py-20 md:py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Standard Header Block */}
        <div className="flex flex-col items-center mb-16 text-center gap-4">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-slate-400">
            {settings.collectionTopSubtitle?.[lang] || 'Curated Catalog'}
          </p>
          <h2 className="text-[28px] md:text-[36px] font-bold text-slate-900 tracking-tight">
            {settings.collectionTitle?.[lang]}
          </h2>
          <div className="w-10 h-[2px] bg-slate-900"></div>
          <p className="text-slate-500 max-w-xl text-[15px] font-normal leading-relaxed">
            {settings.collectionSubtitle?.[lang]}
          </p>
        </div>

        {featuredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded border border-slate-100">
            <ShoppingBag className="w-10 h-10 text-slate-200 mb-4" />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{settings.noCollectionsFoundText?.[lang] || 'No collections found'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {featuredCategories.map((category, index) => {
              const displayName = category.translations?.[lang]?.name || category.name;
              return (
                <Link 
                  key={category.id} 
                  href={`/products?category=${encodeURIComponent(category.slug)}`}
                  className="group block"
                >
                  {/* Standard Next.js Aspect Ratio Wrapper */}
                  <div className="relative aspect-[3/4] overflow-hidden rounded bg-slate-50 border border-slate-100 mb-4">
                    {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt={displayName}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        priority={index < 4}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-200 text-2xl font-black bg-zinc-50">
                        {displayName.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    
                    {/* Clean Action Indicator - No backdrop-blur for max performance */}
                    <div className="absolute bottom-4 right-4 bg-slate-900 w-10 h-10 rounded shadow-xl flex items-center justify-center opacity-100 md:opacity-0 md:translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-20">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  {/* Minimalist Labeling */}
                  <div className="px-1">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 group-hover:text-slate-500 transition-colors truncate">
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
