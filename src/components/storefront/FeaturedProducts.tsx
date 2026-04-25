"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/store/useCartStore';
import { StorefrontSettingsType } from '@/types';
import { formatPrice } from '@/lib/currency';
import { ArrowRight, Package } from 'lucide-react';

interface FeaturedProductsProps {
  products: Product[];
  lang: string;
  settings: StorefrontSettingsType;
}

export function FeaturedProducts({ products, lang, settings }: FeaturedProductsProps) {
  // Defensive check: Ensure products is an array
  if (!Array.isArray(products) || products.length === 0) return null;

  const featuredProducts = products
    .filter(p => p && p.isFeatured)
    .slice(0, 4);

  if (featuredProducts.length === 0) return null;

  return (
    <section id="featured" className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-20">
          <div className="text-center mx-auto">
            <p className="text-xs font-medium tracking-widest uppercase mb-5 text-brand-muted">
              {settings?.featuredTopSubtitle?.[lang] || (lang === 'en' ? 'Curated Selection' : 'Utvald kollektion')}
            </p>
            <h2 className="mb-6 text-brand-ink tracking-tight font-bold">
              {settings?.featuredTitle?.[lang] || (lang === 'en' ? 'Featured Pieces' : 'Utvalda produkter')}
            </h2>
            <p className="text-brand-muted max-w-xl mx-auto text-sm md:text-base font-normal leading-relaxed">
              {settings?.featuredSubtitle?.[lang]}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {featuredProducts.map((product, index) => {
            if (!product) return null;
            const title = product.translations?.[lang]?.title || product.title || 'Product';
            const price = product.price || 0;
            
            return (
              <Link key={product.id} href={`/product/${product.id}`} className="group">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100 mb-4">
                  <div className="h-full w-full">
                    {product.imageUrl && product.imageUrl.trim() !== "" ? (
                      <Image 
                        src={product.imageUrl} 
                        alt={title} 
                        fill 
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105" 
                        priority={index < 2}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.classList.add('hidden');
                          const fallback = target.parentElement?.querySelector('.product-fallback');
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`product-fallback w-full h-full flex items-center justify-center bg-zinc-50 text-zinc-200 ${product.imageUrl && product.imageUrl.trim() !== "" ? 'hidden' : ''}`}>
                      <Package className="w-8 h-8" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-brand-ink/90 backdrop-blur-md border border-white/10 w-10 h-10 md:w-12 md:h-12 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 flex items-center justify-center hover:scale-110">
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                </div>
                <h3 className="text-sm font-normal text-brand-ink truncate">{title}</h3>
                <p className="text-sm font-normal text-brand-muted">{formatPrice(price, lang, product.prices)}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
