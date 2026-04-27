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
  if (!Array.isArray(products) || products.length === 0) return null;

  const featuredProducts = products
    .filter(p => p && p.isFeatured)
    .slice(0, 4);

  if (featuredProducts.length === 0) return null;

  return (
    <section id="featured" className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-20 text-center mx-auto">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase mb-5 text-brand-muted">
              {settings?.featuredTopSubtitle?.[lang] || 'Curated Selection'}
            </p>
            <h2 className="text-[24px] md:text-[32px] font-bold text-brand-ink mb-6 tracking-tight">
              {settings?.featuredTitle?.[lang] || 'Featured Pieces'}
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {featuredProducts.map((product, index) => {
            if (!product) return null;
            const title = product.translations?.[lang]?.title || product.title || 'Product';
            
            return (
              <div key={product.id}>
                <Link href={`/${lang}/product/${product.id}`} className="group">
                  <div 
                    className="relative w-full overflow-hidden rounded bg-slate-100 mb-4 border border-slate-100"
                    style={{ paddingBottom: '133.33%' }}
                  >
                    {product.imageUrl && product.imageUrl.trim() !== "" ? (
                      <Image 
                        src={product.imageUrl} 
                        alt={title} 
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        priority={index < 4}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 text-zinc-200">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                    {/* Removed Backdrop-blur to fix mobile menu lag */}
                    <div className="absolute bottom-3 right-3 bg-brand-ink w-10 h-10 md:w-12 md:h-12 rounded opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 flex items-center justify-center shadow-lg">
                      <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="text-[12px] font-bold uppercase tracking-widest text-brand-ink truncate">{title}</h3>
                  <p className="text-[14px] font-medium text-brand-muted">{formatPrice(product.price || 0, lang, product.prices)}</p>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
