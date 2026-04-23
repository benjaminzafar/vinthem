
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
          <p className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-slate-400">
            {settings.collectionTopSubtitle?.[lang] || 'Curated Catalog'}
          </p>
          <h2 className="text-3xl md:text-5xl font-sans font-black text-brand-ink tracking-tight leading-tight max-w-4xl">
            {settings.collectionTitle?.[lang]}
          </h2>
          <div className="w-12 h-1 bg-brand-ink"></div>
          <p className="text-brand-muted max-w-2xl text-sm md:text-base font-medium leading-relaxed">
            {settings.collectionSubtitle?.[lang]}
          </p>
          <div className="mt-4">
            <Link 
              href="/products" 
              className="group inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-brand-ink hover:opacity-70 transition-all border-b-2 border-brand-ink pb-1"
            >
              {settings.viewAllText?.[lang] || 'Explore All'} 
              <ArrowRight className="ml-3 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {featuredCategories.length === 0 ? (
          <div className="text-center py-24 bg-slate-50 rounded-2xl border border-slate-100">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-6" />
            <h3 className="text-xl font-sans font-bold mb-3 text-slate-900">{settings.noCollectionsFoundText?.[lang]}</h3>
            <p className="text-slate-500 text-sm">{settings.checkBackLaterText?.[lang]}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
            {featuredCategories.map((category) => (
              <div 
                key={category.id} 
                className="group relative flex flex-col"
              >
                <Link href={`/products?category=${encodeURIComponent(category.name)}`} className="block flex-1 group">
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-50 mb-6 rounded-xl border border-slate-100">
                    {category.imageUrl && category.imageUrl.trim() !== "" ? (
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover object-center transition-transform duration-1000 group-hover:scale-110"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-200 font-sans text-2xl bg-slate-50 uppercase tracking-tighter font-black">
                        {category.name.substring(0, 2)}
                      </div>
                    )}
                    
                    {/* Button Overlay - Refined for both mobile and desktop */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500 z-10" />
                    
                    <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 flex justify-center translate-y-4 md:translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                      <span className="bg-white text-brand-ink w-full py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-2xl hover:bg-slate-50 active:scale-95 transition-all">
                        {settings.shopNowText?.[lang] || 'Discover'} <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                  
                  <div className="px-2 text-center md:text-left">
                    <h3 className="text-base md:text-lg font-black text-brand-ink mb-1 tracking-tight group-hover:text-slate-600 transition-colors">
                      {category.name}
                    </h3>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       <span>Explore Collection</span>
                       <span className="w-4 h-[1px] bg-slate-200" />
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
