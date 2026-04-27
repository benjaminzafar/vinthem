"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Copy, Minus, Plus, ShoppingBag, Star, X } from 'lucide-react';
import { FaFacebookF, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';
import { SiThreads } from 'react-icons/si';
import { toast } from 'sonner';
import { usePathname } from 'next/navigation';

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
  initialProduct: product,
  relatedProducts,
  categories,
  initialSettings,
}: ProductClientProps) {
  const [activeImage, setActiveImage] = useState<string>(product.imageUrl || '');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initialOptions: Record<string, string> = {};
    product.options?.forEach((option) => {
      if (option.values?.[0]) initialOptions[option.name] = option.values[0];
    });
    return initialOptions;
  });

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

  const handleAddToCart = () => {
    const productToAdd = {
      ...product,
      price: currentPrice,
      imageUrl: activeImage || product.imageUrl,
      quantity
    };
    addItem(productToAdd);
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
                src={activeImage}
                alt={displayTitle}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 600px"
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
                    <Image src={img} alt={displayTitle} fill className="object-cover" sizes="150px" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{displayTitle}</h1>
            <p className="mt-4 text-2xl font-semibold text-slate-950">{formatPrice(currentPrice, lang, product.prices)}</p>
            
            <div className="mt-10">
              <button
                onClick={handleAddToCart}
                className="flex h-14 w-full items-center justify-center gap-3 bg-slate-950 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-slate-800"
              >
                <ShoppingBag className="w-5 h-5" />
                {settings.addToCartButtonText?.[lang] || 'Add to cart'}
              </button>
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
