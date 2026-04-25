"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category, StorefrontSettingsType } from '@/types';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface CollectionListProps {
  categories: Category[];
  lang: string;
  settings: StorefrontSettingsType;
}

export function CollectionList({ categories, lang, settings }: CollectionListProps) {
  const featuredCategories = categories.filter(c => c.isFeatured);

  return (
    <section id="collection" className="py-20 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center mb-12 md:mb-20 text-center gap-4">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-slate-400">
            {settings.collectionTopSubtitle?.[lang] || 'Curated Catalog'}
          </p>
          <h2 className="text-[24px] md:text-[32px] font-bold text-brand-ink mb-6 max-w-4xl leading-tight tracking-tight">
            {settings.collectionTitle?.[lang]}
          </h2>
          <div className="w-12 h-1 bg-brand-ink"></div>
          <p className="text-brand-muted max-w-2xl text-base font-normal leading-relaxed">
            {settings.collectionSubtitle?.[lang]}
          </p>
        </div>

        {featuredCategories.length === 0 ? (
          <div className="text-center py-24 bg-slate-50 rounded border border-slate-100">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-6" />
            <h3 className="!text-[12px] !font-bold !uppercase !tracking-widest mb-3 text-slate-900">{settings.noCollectionsFoundText?.[lang]}</h3>
            <p className="text-slate-500 text-sm">{settings.checkBackLaterText?.[lang]}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {featuredCategories.map((category) => (
              <div 
                key={category.id} 
                className="group relative"
              >
                <Link href={`/products?category=${encodeURIComponent(category.name)}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden rounded bg-gray-100 mb-4 transition-all">
                    <div className="h-full w-full">
                      {category.imageUrl && category.imageUrl.trim() !== "" ? (
                        <Image
                          src={category.imageUrl}
                          alt={category.name}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.classList.add('hidden');
                            const fallback = target.parentElement?.querySelector('.category-fallback');
                            if (fallback) fallback.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`category-fallback h-full w-full flex items-center justify-center text-slate-200 font-sans text-2xl bg-zinc-50 uppercase tracking-tighter font-black ${category.imageUrl && category.imageUrl.trim() !== "" ? 'hidden' : ''}`}>
                        {category.name.substring(0, 2)}
                      </div>
                    </div>
                    
                    {/* Action Button - Exact match to FeaturedProducts */}
                    <div className="absolute bottom-3 right-3 bg-brand-ink/90 backdrop-blur-md border border-white/10 w-10 h-10 md:w-12 md:h-12 rounded opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 flex items-center justify-center hover:scale-110">
                      <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                  </div>
                  
                  <div className="px-1">
                    <h3 className="text-[12px] font-bold uppercase tracking-widest text-brand-ink truncate group-hover:text-brand-muted transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-16 md:mt-24 text-center">
          <Link 
            href="/products" 
            className="group inline-flex items-center text-xs font-black uppercase tracking-[0.2em] text-brand-ink hover:opacity-70 transition-all border-b-2 border-brand-ink pb-1"
          >
            {settings.viewAllText?.[lang] || 'View All'} 
          </Link>
        </div>
      </div>
    </section>
  );
}
