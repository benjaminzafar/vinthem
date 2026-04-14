
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/store/useCartStore';
import { formatPrice } from '@/lib/currency';
import { ArrowRight } from 'lucide-react';

interface FeaturedProductsProps {
  products: Product[];
  lang: string;
  settings: any;
}

export function FeaturedProducts({ products, lang, settings }: FeaturedProductsProps) {
  const featuredProducts = (products || [])
    .filter(p => p && p.isFeatured)
    .slice(0, 4);

  // Skip rendering if no products are featured to avoid empty layout bugs
  if (featuredProducts.length === 0) return null;

  return (
    <section id="featured" className="py-32 bg-[#E6E6E4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-20">
          <div className="text-center mx-auto">
            <p className="text-xs font-medium tracking-widest uppercase mb-5 text-brand-muted">{settings.featuredTopSubtitle?.[lang]}</p>
            <h2 className="text-4xl md:text-5xl font-sans mb-6 text-brand-ink tracking-tight">{settings.featuredTitle?.[lang]}</h2>
            <p className="text-brand-muted max-w-xl mx-auto text-sm md:text-base font-normal leading-relaxed">{settings.featuredSubtitle?.[lang]}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {featuredProducts.map((product, index) => (
            <Link key={product.id} href={`/product/${product.id}`} className="group">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100 mb-4">
                {product.imageUrl && product.imageUrl.trim() !== "" && (
                  <Image 
                    src={product.imageUrl} 
                    alt={product.title} 
                    fill 
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105" 
                    priority={index < 2}
                  />
                )}
                <div className="absolute bottom-3 right-3 bg-brand-ink/90 backdrop-blur-md border border-white/10 w-12 h-12 rounded-full shadow-lg opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 flex items-center justify-center hover:scale-110">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-brand-ink">{product.translations?.[lang]?.title || product.title}</h3>
              <p className="text-xs text-brand-muted">{formatPrice(product.price || 0, lang, product.prices)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
