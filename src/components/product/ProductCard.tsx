"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

const Highlight = ({ text, query }: { text: string; query: string }) => {
  if (!text) return null;
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-amber-100 text-amber-900 rounded px-0.5 font-medium">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export function ProductCard({ product, lang, settings, priority }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { setCartOpen } = useUIStore();
  const href = product.id ? `/product/${product.id}` : '/products';
  
  const isVideo = (url: string) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.mov');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group flex flex-col h-full bg-white"
    >
      <Link href={href} className="block relative aspect-[4/5] mb-5 overflow-hidden bg-slate-50 border border-slate-200 rounded transition-all duration-500">
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
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          )
        ) : (
          product.imageUrl && product.imageUrl.trim() !== "" && (
            <div className="absolute inset-0">
              <Image 
                src={product.imageUrl} 
                alt={product.title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                priority={priority}
              />
            </div>
          )
        )}
        
        {/* Quick Add Overlay - Desktop Only */}
        <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none md:block hidden">
          <div className="absolute inset-0 bg-slate-900/10 pointer-events-none" />
          <div className="absolute bottom-5 left-5 right-5 pointer-events-auto">
            <button 
              onClick={(e) => {
                e.preventDefault();
                addItem(product);
                setCartOpen(true);
                toast.success(`${product.title} added to cart!`, {
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
      <div className="md:hidden block mb-4">
        <button 
          onClick={(e) => {
            e.preventDefault();
            addItem(product);
            setCartOpen(true);
            toast.success(`${product.title} added to cart!`, {
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
            {product.translations?.[lang]?.title || product.title}
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
