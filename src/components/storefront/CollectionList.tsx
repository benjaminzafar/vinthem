
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category, StorefrontSettingsType } from '@/types';
import { ShoppingBag } from 'lucide-react';

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
          <p className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-slate-400">
            {settings.collectionTopSubtitle?.[lang] || 'Curated Catalog'}
          </p>
          <h2 className="text-3xl md:text-5xl font-sans text-brand-ink tracking-tight mb-6 max-w-4xl leading-tight">
            {settings.collectionTitle?.[lang]}
          </h2>
          <div className="w-12 h-1 bg-brand-ink"></div>
          <p className="text-brand-muted max-w-2xl text-lg font-light leading-relaxed">
            {settings.collectionSubtitle?.[lang]}
          </p>
        </div>

        {featuredCategories.length === 0 ? (
          <div className="text-center py-24 bg-slate-50 rounded-2xl border border-slate-100">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-6" />
            <h3 className="text-xl font-sans font-bold mb-3 text-slate-900">{settings.noCollectionsFoundText?.[lang]}</h3>
            <p className="text-slate-500 text-sm">{settings.checkBackLaterText?.[lang]}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {featuredCategories.map((category) => (
              <div 
                key={category.id} 
                className="group relative"
              >
                <Link href={`/products?category=${encodeURIComponent(category.name)}`} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 group block">
                {category.imageUrl && category.imageUrl.trim() !== "" ? (
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-200 font-sans text-2xl bg-slate-50 uppercase tracking-tighter font-black">
                    {category.name.substring(0, 2)}
                  </div>
                )}
                
                {/* Visual Overlays matching FutureSections */}
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/50 to-transparent opacity-80 pointer-events-none"></div>
                
                <div className="absolute top-8 left-8 right-8">
                  <p className="text-white/90 font-medium text-sm tracking-widest uppercase mb-2">Collection</p>
                  <h3 className="text-white text-3xl font-bold tracking-tight">{category.name}</h3>
                </div>
                </Link>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-16 md:mt-24 text-center">
          <Link 
            href="/products" 
            className="group inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-brand-ink hover:opacity-70 transition-all border-b-2 border-brand-ink pb-1"
          >
            {settings.viewAllText?.[lang] || 'Explore All'} 
          </Link>
        </div>
      </div>
    </section>
  );
}
