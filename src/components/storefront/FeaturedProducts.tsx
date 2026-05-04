import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/store/useCartStore';
import { formatPrice } from '@/lib/currency';
import { getOptimizedImageUrl } from '@/utils/image-utils';
import { ArrowRight, Package } from 'lucide-react';

export function FeaturedProducts({ products, lang, labels }: FeaturedProductsProps) {
  if (!Array.isArray(products) || products.length === 0) return null;

  return (
    <section id="featured" className="py-20 md:py-32 bg-white" style={{ isolation: 'isolate' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center mb-16 text-center">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-slate-400 mb-4">
            {labels.topSubtitle}
          </p>
          <h2 className="text-[28px] md:text-[36px] font-bold text-slate-900 tracking-tight mb-6">
            {labels.title}
          </h2>
          {labels.subtitle && (
            <p className="text-slate-500 max-w-xl text-[15px] font-normal leading-relaxed mb-6">
              {labels.subtitle}
            </p>
          )}
          <div className="w-10 h-[2px] bg-slate-900"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {products.map((product, index) => {
            if (!product) return null;
            const title = product.translations?.[lang]?.title || product.title || 'Product';
            
            return (
              <Link key={product.id} href={`/${lang}/product/${product.id}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-none bg-slate-50 border border-slate-100 mb-4 transform-gpu">
                  {product.imageUrl ? (
                    <Image 
                      src={getOptimizedImageUrl(product.imageUrl, 500, 75)} 
                      alt={title} 
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority={index < 2}
                      unoptimized={true}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 text-zinc-200">
                      <Package className="w-8 h-8" />
                    </div>
                  )}

                  {product.stock <= 0 && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
                      <span className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-none">
                        Out of Stock
                      </span>
                    </div>
                  )}
                  
                  <div className="absolute bottom-4 right-4 bg-slate-900 w-10 h-10 rounded-full flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 shadow-lg">
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
  labels: {
    topSubtitle: string;
    title: string;
    subtitle?: string;
  };
}
