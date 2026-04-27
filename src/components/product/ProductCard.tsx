"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Check } from 'lucide-react';
import { useCartStore, Product } from '@/store/useCartStore';
import { useUIStore } from '@/store/useUIStore';
import { StorefrontSettingsType } from '@/types';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  lang: string;
  settings: StorefrontSettingsType;
  priority?: boolean;
}

export function ProductCard({ product, lang, settings, priority }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { setCartOpen } = useUIStore();
  const [isLoaded, setIsLoaded] = useState(false);
  
  const href = product.id ? `/${lang}/product/${product.id}` : `/${lang}/products`;
  const title = product.translations?.[lang]?.title || product.title || 'Premium Vinthem Product';

  const isVideo = (url: string) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.mov');
  };

  return (
    <div className="group flex flex-col h-full bg-white" style={{ contain: 'layout style' }}>
      <Link 
        href={href} 
        className="block relative w-full mb-5 overflow-hidden border border-slate-100 rounded bg-slate-100"
        style={{ paddingBottom: '125%' }} // Stable 4:5 aspect ratio
        aria-label={`View details for ${title}`}
      >
        {product.isFeatured && (
          <div className="absolute top-4 left-4 z-20">
            <span className="bg-white/90 backdrop-blur-sm border border-slate-100 text-brand-ink text-[12px] font-semibold px-4 py-1.5 rounded">
              {settings.featuredBadgeText?.[lang] || 'Featured'}
            </span>
          </div>
        )}
        
        <div className="absolute inset-0">
          {isVideo(product.imageUrl) ? (
            product.imageUrl && product.imageUrl.trim() !== "" && (
              <video 
                src={product.imageUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                aria-label={`Video of ${title}`}
              />
            )
          ) : (
            product.imageUrl && product.imageUrl.trim() !== "" && (
              <Image 
                src={product.imageUrl} 
                alt={title}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className={`object-cover transition-all duration-700 ease-out group-hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsLoaded(true)}
                priority={priority}
              />
            )
          )}
        </div>
        
        <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 md:block hidden">
          <div className="absolute inset-0 bg-black/5" />
          <div className="absolute bottom-5 left-5 right-5">
            <button 
              onClick={(e) => {
                e.preventDefault();
                addItem(product);
                setCartOpen(true);
                toast.success(`${title} added to cart!`, {
                  className: 'rounded bg-slate-900 text-white !text-[12px] !font-bold !uppercase !tracking-widest border-none px-6 py-3',
                  duration: 2000,
                  icon: <Check className="w-5 h-5" />
                });
              }}
              aria-label={`Quick add ${title} to cart`}
              className="w-full h-11 bg-white text-brand-ink border border-slate-100 px-6 !text-[12px] !font-black !uppercase !tracking-widest transition-all duration-300 hover:bg-slate-900 hover:text-white flex items-center justify-center gap-2 rounded"
            >
              <ShoppingBag className="w-4 h-4" />
              {settings.quickAddText?.[lang] || 'Quick add'}
            </button>
          </div>
        </div>
      </Link>
      
      <div className="flex flex-col flex-1 px-1">
        <h3 className="text-[12px] font-bold uppercase tracking-widest text-brand-ink group-hover:text-brand-muted transition-colors truncate mb-2">
          <Link href={href} aria-label={`View ${title}`}>{title}</Link>
        </h3>
        <div className="mt-auto">
          <p className="text-[14px] font-medium text-brand-ink">
            {formatPrice(product.price || 0, lang, product.prices)}
          </p>
        </div>
      </div>
    </div>
  );
}
