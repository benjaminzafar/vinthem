"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/store/useCartStore';
import { StorefrontSettingsType } from '@/types';
import { formatPrice } from '@/lib/currency';
import { ArrowRight, Package } from 'lucide-react';

export function FeaturedProducts({ products, lang, settings }: FeaturedProductsProps) {
  if (!Array.isArray(products) || products.length === 0) return null;

  const featuredProducts = products
    .filter(p => p && p.isFeatured)
    .slice(0, 4);

  if (featuredProducts.length === 0) return null;

  return (
    <section id="featured" className="py-20 md:py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Standard Header Block */}
        <div className="flex flex-col items-center mb-16 text-center gap-4">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-slate-400">
            {settings?.featuredTopSubtitle?.[lang] || 'Curated Selection'}
          </p>
          <h2 className="text-[28px] md:text-[36px] font-bold text-slate-900 tracking-tight">
            {settings?.featuredTitle?.[lang] || 'Featured Pieces'}
          </h2>
          <div className="w-10 h-[2px] bg-slate-900"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {featuredProducts.map((product, index) => {
            if (!product) return null;
            const title = product.translations?.[lang]?.title || product.title || 'Product';
            
            return (
              <Link key={product.id} href={`/${lang}/product/${product.id}`} className="group block">
                {/* Standard Next.js Aspect Ratio Wrapper */}
                <div className="relative aspect-[3/4] overflow-hidden rounded bg-slate-50 border border-slate-100 mb-4">
                  {product.imageUrl ? (
                    <Image 
                      src={product.imageUrl} 
                      alt={title} 
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      priority={index < 4}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 text-zinc-200">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                  
                  {/* Clean Action Indicator - No backdrop-blur */}
                  <div className="absolute bottom-4 right-4 bg-slate-900 w-10 h-10 rounded shadow-xl flex items-center justify-center opacity-100 md:opacity-0 md:translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-20">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="px-1">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 truncate mb-1">
                    {title}
                  </h3>
                  <p className="text-[13px] font-medium text-slate-500">
                    {formatPrice(product.price || 0, lang, product.prices)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

interface FeaturedProductsProps {
  products: Product[];
  lang: string;
  settings: StorefrontSettingsType;
}
