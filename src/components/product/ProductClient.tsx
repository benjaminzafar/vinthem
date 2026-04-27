"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Check, Copy, Minus, Plus, ShoppingBag, Star, X } from 'lucide-react';
import { FaFacebookF, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';
import { SiThreads } from 'react-icons/si';
import { toast } from 'sonner';
import { usePathname } from 'next/navigation';
import { getOptimizedImageUrl } from '@/utils/image-utils';

import { BackButton } from '@/components/BackButton';
import { ProductCard } from '@/components/product/ProductCard';
import Reviews from '@/components/Reviews';
import { formatPrice } from '@/lib/currency';
import { getClientLocale } from '@/lib/locale';
import { Category } from '@/types';
import { Product, ProductVariant, useCartStore } from '@/store/useCartStore';
import type { StorefrontSettings } from '@/store/useSettingsStore';
import { useUIStore } from '@/store/useUIStore';
import { useStorefrontSettings } from '@/hooks/useStorefrontSettings';

interface ProductClientProps {
  initialProduct: Product;
  relatedProducts: Product[];
  categories: Category[];
  initialSettings: Partial<StorefrontSettings>;
}

export function ProductClient({
  initialProduct,
  relatedProducts,
  categories,
  initialSettings,
}: ProductClientProps) {
  const [product] = useState<Product>(initialProduct);
  const [activeImage, setActiveImage] = useState<string>(initialProduct.imageUrl || '');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initialOptions: Record<string, string> = {};
    initialProduct.options?.forEach((option) => {
      if (option.values?.[0]) initialOptions[option.name] = option.values[0];
    });
    return initialOptions;
  });
  const [quantity, setQuantity] = useState(1);

  const { addItem } = useCartStore();
  const settings = useStorefrontSettings(initialSettings);
  const { setCartOpen } = useUIStore();
  const pathname = usePathname();
  const lang = getClientLocale(pathname);

  const selectedVariant = useMemo(() => {
    if (!product.variants?.length) return null;
    return product.variants.find((variant) =>
      variant.options && Object.keys(selectedOptions).every((key) => variant.options?.[key] === selectedOptions[key]),
    ) ?? null;
  }, [product, selectedOptions]);

  const allImages = useMemo(() => {
    const images = new Set<string>();
    if (product.imageUrl) images.add(product.imageUrl);
    [...(product.additionalImages || []), ...(product.galleryImages || [])].forEach(img => {
      if (img && typeof img === 'string') images.add(img);
    });
    return [...images];
  }, [product]);

  const currentPrice = selectedVariant?.price || (product.isSale && product.discountPrice ? product.discountPrice : product.price || 0);
  const displayTitle = product.translations?.[lang]?.title || product.title;
  const displayDescription = product.translations?.[lang]?.description || product.description;

  const handleAddToCart = () => {
    // @ts-ignore
    addItem({ ...product, price: currentPrice, quantity });
    setCartOpen(true);
    toast.success(settings.addedToCartConfirmationText?.[lang] || 'Added to cart');
  };

  return (
    <div className="min-h-screen bg-white py-3 sm:py-10">
      <div className="mx-auto max-w-[1188px] px-4 sm:px-6 lg:px-8">
        <header className="mb-7">
          <BackButton label={settings.backToStoreText?.[lang]} />
        </header>

        <main className="grid gap-12 lg:grid-cols-2">
          <section>
            <div className="relative aspect-square overflow-hidden rounded border border-slate-100 bg-slate-50">
              <Image
                src={getOptimizedImageUrl(activeImage, 1200, 85)}
                alt={displayTitle}
                fill
                priority
                className="object-cover transition-opacity duration-300"
                sizes="(max-width: 1024px) 100vw, 600px"
                unoptimized={true}
              />
            </div>
            {allImages.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-4">
                {allImages.slice(0, 4).map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveImage(img)}
                    className={`relative aspect-square overflow-hidden rounded border transition-all ${activeImage === img ? 'border-slate-900' : 'border-transparent opacity-60'}`}
                  >
                    <Image src={getOptimizedImageUrl(img, 150, 75)} alt={displayTitle} fill className="object-cover" sizes="150px" unoptimized={true} />
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{displayTitle}</h1>
            <p className="mt-4 text-2xl font-semibold text-slate-950">{formatPrice(currentPrice, lang, product.prices)}</p>
            
            <div className="mt-8 prose prose-slate max-w-none">
              <p className="text-slate-600 leading-relaxed font-medium">{displayDescription}</p>
            </div>

            {product.options?.map((option) => {
              const isColor = option.name.toLowerCase().includes('color') || option.name.toLowerCase().includes('färg');
              
              return (
                <div key={option.name} className="mt-12 first:mt-8">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-950">{option.name}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{selectedOptions[option.name]}</span>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {option.values?.map((value) => {
                      if (isColor) {
                        return (
                          <button
                            key={value}
                            onClick={() => setSelectedOptions(prev => ({ ...prev, [option.name]: value }))}
                            className={`group relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-500 ${
                              selectedOptions[option.name] === value 
                                ? 'border-slate-950 scale-110 shadow-xl shadow-slate-200' 
                                : 'border-transparent hover:border-slate-200'
                            }`}
                            title={value}
                          >
                            <span 
                              className="w-9 h-9 rounded-full border border-black/5 shadow-inner transition-transform group-hover:scale-95" 
                              style={{ 
                                backgroundColor: value.toLowerCase(),
                              }} 
                            />
                            {selectedOptions[option.name] === value && (
                              <div className="absolute -bottom-2 w-1.5 h-1.5 bg-slate-950 rounded-full" />
                            )}
                          </button>
                        );
                      }
                      return (
                        <button
                          key={value}
                          onClick={() => setSelectedOptions(prev => ({ ...prev, [option.name]: value }))}
                          className={`h-14 px-8 text-[12px] font-black uppercase tracking-[0.15em] transition-all duration-500 border-2 ${
                            selectedOptions[option.name] === value
                              ? 'bg-slate-950 text-white border-slate-950 shadow-2xl shadow-slate-950/20 translate-y-[-2px]'
                              : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300 hover:text-slate-950'
                          }`}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="mt-12">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-950 mb-5">Quantity</h3>
              <div className="flex h-16 w-44 items-center border-2 border-slate-100 rounded-none overflow-hidden bg-slate-50/30 group hover:border-slate-200 transition-colors">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-full w-14 items-center justify-center text-slate-400 hover:text-slate-950 hover:bg-white transition-all border-r border-slate-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="flex-1 text-center text-[14px] font-black text-slate-950">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex h-full w-14 items-center justify-center text-slate-400 hover:text-slate-950 hover:bg-white transition-all border-l border-slate-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-16">
              <button
                onClick={handleAddToCart}
                className="group relative flex h-20 w-full items-center justify-center overflow-hidden bg-slate-950 text-[12px] font-black uppercase tracking-[0.3em] text-white transition-all duration-700 hover:bg-black hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] active:scale-[0.98]"
              >
                <div className="flex items-center gap-4 relative z-10">
                  <ShoppingBag className="w-6 h-6 transition-transform duration-500 group-hover:-translate-y-1" />
                  {settings.addToCartButtonText?.[lang] || 'Add to cart'}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              </button>
              <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 animate-pulse">Free Express Worldwide Shipping</p>
            </div>
          </aside>
        </main>

        <section className="mt-20">
          <h2 className="text-xl font-bold mb-8">{settings.relatedProductsTitleText?.[lang] || 'Related Products'}</h2>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {relatedProducts.slice(0, 4).map(item => (
              <ProductCard key={item.id} product={item} lang={lang} settings={settings as any} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
