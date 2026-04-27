"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category, StorefrontSettingsType } from '@/types';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export function CollectionList({ categories, lang, settings }: CollectionListProps) {
  const featuredCategories = categories.filter(c => c.isFeatured);

  return (
    <section id="collection" className="py-20 md:py-32 bg-white" style={{ isolation: 'isolate' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center mb-12 md:mb-20 text-center gap-4">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-slate-500">
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
            {featuredCategories.map((category, index) => (
              <CollectionCard 
                key={category.id} 
                category={category} 
                lang={lang} 
                index={index} 
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CollectionCard({ category, lang, index }: { category: Category; lang: string; index: number }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const displayName = category.translations?.[lang]?.name || category.name;

  return (
    <div className="group relative" style={{ transform: 'translateZ(0)', willChange: 'transform' }}>
      <Link href={`/products?category=${encodeURIComponent(category.slug)}`} className="group block">
        <div 
          className="relative w-full overflow-hidden rounded bg-slate-100 mb-4 border border-slate-100"
          style={{ paddingBottom: '133.33%' }}
        >
          {category.imageUrl && category.imageUrl.trim() !== "" ? (
            <Image
              src={category.imageUrl}
              alt={displayName}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className={`object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setIsLoaded(true)}
              priority={index < 2}
              // @ts-ignore
              decoding="sync"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-sans text-2xl bg-slate-50 uppercase tracking-tighter font-black">
              {displayName.substring(0, 2)}
            </div>
          )}
          
          {/* Simplified button: Removed backdrop-blur to fix mobile menu lag */}
          <div className="absolute bottom-3 right-3 bg-brand-ink w-10 h-10 rounded opacity-100 transition-transform duration-300 z-20 flex items-center justify-center group-hover:scale-110">
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
        </div>
        
        <div className="px-1">
          <h3 className="text-[12px] font-bold uppercase tracking-widest text-brand-ink truncate">
            {displayName}
          </h3>
        </div>
      </Link>
    </div>
  );
}

interface CollectionListProps {
  categories: Category[];
  lang: string;
  settings: StorefrontSettingsType;
}
