"use client";

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Check } from 'lucide-react';
import { useCartStore, Product } from '@/store/useCartStore';
import { useUIStore } from '@/store/useUIStore';
import { StorefrontSettingsType } from '@/types';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  lang: string;
  settings: StorefrontSettingsType;
  priority?: boolean;
}

export function ProductCard({ product, lang, settings, priority }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { setCartOpen } = useUIStore();
  const href = product.id ? `/product/${product.id}` : '/products';
  
  const isVideo = (url: string) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.mov');
  };

  const title = product.translations?.[lang]?.title || product.title;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group flex flex-col h-full bg-white"
    >
      <Link 
        href={href} 
        className="block relative aspect-[4/5] mb-5 overflow-hidden border border-slate-100 rounded bg-slate-50"
      >
        {product.isFeatured && (
          <div className="absolute top-4 left-4 z-20">
            <span className="bg-white/90 backdrop-blur-sm border border-slate-100 text-brand-ink text-[12px] font-semibold px-4 py-1.5 rounded">
              {settings.featuredBadgeText?.[lang] || 'Featured'}
            </span>
          </div>
        )}
        
        {isVideo(product.imageUrl) ? (
          product.imageUrl && product.imageUrl.trim() !== "" && (
            <video 
              src={product.imageUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          )
        ) : (
          product.imageUrl && product.imageUrl.trim() !== "" && (
            <img 
              src={product.imageUrl} 
              alt={title}
              loading={priority ? "eager" : "lazy"}
              // @ts-ignore
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            />
          )
        )}
        
        {/* Quick Add Overlay - Desktop Only */}
        <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 md:block hidden">
          <div className="absolute inset-0 bg-slate-900/10 pointer-events-none" />
          <div className="absolute bottom-5 left-5 right-5">
            <button 
              onClick={(e) => {
                e.preventDefault();
                addItem(product);
                setCartOpen(true);
                toast.success(`${title} added to cart!`, {
                  className: 'rounded bg-slate-900 text-white !text-[12px] !font-bold !uppercase !tracking-widest border-none px-6 py-3',
                  duration: 2000,
                  icon: <Check className="w-5 h-5" strokeWidth={1.5} />
                });
              }}
              className="w-full h-11 bg-white text-brand-ink border border-slate-200 px-6 !text-[12px] !font-black !uppercase !tracking-widest transition-all duration-300 hover:bg-slate-900 hover:text-white hover:border-slate-900 flex items-center justify-center gap-2 active:scale-[0.98] rounded"
            >
              <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
              {settings.quickAddText?.[lang] || 'Quick add'}
            </button>
          </div>
        </div>
      </Link>
      
      {/* Mobile Quick Add Button - Below Image */}
      <div className="md:hidden block mb-4 px-1">
        <button 
          onClick={(e) => {
            e.preventDefault();
            addItem(product);
            setCartOpen(true);
            toast.success(`${title} added to cart!`, {
              className: 'rounded bg-slate-900 text-white !text-[12px] !font-bold !uppercase !tracking-widest border-none px-6 py-3',
              duration: 2000,
              icon: <Check className="w-5 h-5" strokeWidth={1.5} />
            });
          }}
          className="w-full h-11 bg-slate-50 text-brand-ink border border-slate-200 px-6 !text-[12px] !font-black !uppercase !tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] rounded"
        >
          <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
          {settings.quickAddText?.[lang] || 'Quick add'}
        </button>
      </div>
      
      <div className="flex flex-col flex-1 px-1">
        <div className="flex items-center gap-2 mb-3">
          {product.status === 'draft' && (
             <span className="text-xs font-black uppercase tracking-widest px-1.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded">Draft</span>
          )}
        </div>
        <h3 className="text-[12px] font-bold uppercase tracking-widest text-brand-ink group-hover:text-brand-muted transition-colors truncate mb-2">
          <Link href={href}>
            {title}
          </Link>
        </h3>
        <div className="mt-auto">
          <p className="text-[14px] font-medium text-brand-ink">
            {formatPrice(product.price || 0, lang, product.prices)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
