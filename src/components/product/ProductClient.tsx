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
              <p className="text-[15px] text-slate-600 leading-relaxed font-normal">{displayDescription}</p>
            </div>

            {product.options?.map((option) => {
              const isColor = option.name.toLowerCase().includes('color') || option.name.toLowerCase().includes('färg');
              
              return (
                <div key={option.name} className="mt-10 first:mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{option.name}</h3>
                    <div className="h-[1px] flex-1 bg-slate-100" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900">{selectedOptions[option.name]}</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {option.values?.map((value) => {
                      if (isColor) {
                        return (
                          <button
                            key={value}
                            onClick={() => setSelectedOptions(prev => ({ ...prev, [option.name]: value }))}
                            className={`group relative flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-500 ${
                              selectedOptions[option.name] === value 
                                ? 'border-slate-900 scale-110 shadow-sm' 
                                : 'border-transparent hover:border-slate-200'
                            }`}
                            title={value}
                          >
                            <span 
                              className="w-6 h-6 rounded-full border border-black/5 shadow-inner" 
                              style={{ 
                                backgroundColor: value.toLowerCase(),
                              }} 
                            />
                          </button>
                        );
                      }
                      return (
                        <button
                          key={value}
                          onClick={() => setSelectedOptions(prev => ({ ...prev, [option.name]: value }))}
                          className={`h-11 px-6 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 border ${
                            selectedOptions[option.name] === value
                              ? 'bg-slate-950 text-white border-slate-950 shadow-md shadow-slate-950/10'
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

            <div className="mt-10">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Quantity</h3>
                <div className="h-[1px] flex-1 bg-slate-100" />
              </div>
              <div className="flex h-11 w-32 items-center border border-slate-200 rounded-full overflow-hidden bg-white hover:border-slate-400 transition-colors">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-full w-10 items-center justify-center text-slate-400 hover:text-slate-900 transition-all"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="flex-1 text-center text-[12px] font-bold text-slate-950">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex h-full w-10 items-center justify-center text-slate-400 hover:text-slate-900 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-12">
              <button
                onClick={handleAddToCart}
                className="group relative flex h-14 w-full items-center justify-center overflow-hidden bg-slate-950 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-all duration-500 hover:bg-black hover:shadow-xl active:scale-[0.98]"
              >
                <div className="flex items-center gap-3 relative z-10">
                  <ShoppingBag className="w-4.5 h-4.5" />
                  {settings.addToCartButtonText?.[lang] || 'Add to cart'}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              </button>
              <div className="mt-6 flex items-center justify-center gap-4 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
                <span className="flex items-center gap-1.5"><Check className="w-3 h-3" /> Secure Payment</span>
                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                <span className="flex items-center gap-1.5"><Check className="w-3 h-3" /> Worldwide Shipping</span>
              </div>
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
