"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Check } from 'lucide-react';
import { useCartStore, Product } from '@/store/useCartStore';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  lang: string;
  settings: any;
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
          <mark key={i} className="bg-amber-100 text-amber-900 rounded-2xl px-0.5 font-medium">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export function ProductCard({ product, lang, settings, priority }: ProductCardProps) {
  const { addItem } = useCartStore();
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
      className="group flex flex-col h-full"
    >
      <Link href={href} className="block relative aspect-[4/5] mb-4 overflow-hidden bg-gray-50 rounded-2xl shadow-sm border border-gray-100">
        {product.isFeatured && (
          <div className="absolute top-3 left-3 md:top-4 md:left-4 z-20">
            <span className="bg-white/95 backdrop-blur-sm text-brand-ink text-[10px] md:text-xs font-bold px-3 py-1 md:px-4 md:py-1.5 rounded-2xl uppercase tracking-wider shadow-sm">
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
            <div className="absolute inset-0">
              <Image 
                src={product.imageUrl} 
                alt={product.title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority={priority}
              />
            </div>
          )
        )}
        
        {/* Quick Add Overlay */}
        <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 z-20 md:opacity-0 group-hover:opacity-100 transition-all duration-300 md:translate-y-2 group-hover:translate-y-0">
          <button 
            onClick={(e) => {
              e.preventDefault();
              addItem(product);
              toast.success(`${product.title} added to cart!`, {
                className: 'bg-black text-white text-xs rounded-full h-9 px-4 flex items-center gap-2',
                duration: 1500,
                icon: <Check className="w-3 h-3" />
              });
            }}
            className="bg-white/95 backdrop-blur-sm text-brand-ink hover:bg-brand-ink hover:text-white p-3 md:px-5 md:py-3 rounded-full shadow-xl transition-all duration-300 flex items-center justify-center gap-2 border border-black/5"
          >
            <ShoppingBag className="w-4 h-4 md:w-4 md:h-4" />
            <span className="hidden md:block text-xs font-bold uppercase tracking-wider">
              {settings.quickAddText?.[lang] || 'Quick Add'}
            </span>
          </button>
        </div>
      </Link>
      
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between text-[10px] md:text-xs uppercase tracking-wider font-medium mb-1.5">
          <span className="text-brand-muted truncate pr-2">{product.categoryName}</span>
        </div>
        <h3 className="text-sm md:text-base font-sans font-medium text-brand-ink group-hover:text-brand-muted transition-colors line-clamp-2 mb-2">
          <Link href={href}>
            {product.title}
          </Link>
        </h3>
        <div className="mt-auto pt-2">
          <span className="text-sm md:text-base font-medium text-brand-ink">{formatPrice(product.price || 0, lang, product.prices)}</span>
        </div>
      </div>
    </motion.div>
  );
}
