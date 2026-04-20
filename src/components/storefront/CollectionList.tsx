
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
    <section id="collection" className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 md:mb-20">
          <div className="text-center mx-auto">
            <p className="text-xs font-medium tracking-widest uppercase mb-5 text-brand-muted">{settings.collectionTopSubtitle?.[lang]}</p>
            <h2 className="text-4xl md:text-5xl font-sans mb-6 text-brand-ink tracking-tight">
              {settings.collectionTitle?.[lang]}
            </h2>
            <p className="text-brand-muted max-w-xl mx-auto text-sm md:text-base font-normal leading-relaxed">{settings.collectionSubtitle?.[lang]}</p>
          </div>
          <div className="mt-10 md:mt-0">
            <Link href="/products" className="inline-flex items-center text-xs font-medium uppercase tracking-wide text-brand-ink hover:opacity-80 transition-all">
              {settings.viewAllText?.[lang]} <ArrowRight className="ml-3 w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {featuredCategories.length === 0 ? (
          <div className="text-center py-24 md:py-32 bg-white/50 rounded-2xl border border-white/20">
            <ShoppingBag className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl md:text-2xl font-sans mb-3">{settings.noCollectionsFoundText?.[lang]}</h3>
            <p className="text-brand-muted text-base md:text-lg">{settings.checkBackLaterText?.[lang]}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-10 md:gap-y-16">
            {featuredCategories.map((category, index) => (
              <div 
                key={category.id} 
                className="group relative"
              >
                <Link href={`/products?category=${encodeURIComponent(category.name)}`} className="block">
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100 mb-4 md:mb-5 rounded-2xl">
                    {category.imageUrl && category.imageUrl.trim() !== "" ? (
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400 font-sans text-xl md:text-2xl bg-gray-200">
                        {category.name}
                      </div>
                    )}
                    
                    {/* Button Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 flex justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 bg-gradient-to-t from-black/60 to-transparent">
                      <span className="bg-white text-brand-ink w-full py-3 md:py-4 rounded-full text-xs md:text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                        {settings.shopNowText?.[lang] || 'Shop Now'} <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                  <div className="px-1">
                    <h3 className="text-sm md:text-lg font-medium text-brand-ink mb-0.5 md:mb-1">{category.name}</h3>
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
