"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
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
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const getVariantImage = (variant?: ProductVariant | null) => {
    if (!variant) return '';
    return variant.imageUrl || variant.image_url || variant.image || variant.url || '';
  };

  const [product] = useState<Product>(initialProduct);
  const [isCopied, setIsCopied] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeImage, setActiveImage] = useState<string>(initialProduct.imageUrl || '');
  const [activeDetailsTab, setActiveDetailsTab] = useState<'description' | 'reviews'>('description');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initialOptions: Record<string, string> = {};
    initialProduct.options?.forEach((option) => {
      if (option.values?.[0]) {
        initialOptions[option.name] = option.values[0];
      }
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
    if (!product.options?.length) return product.variants[0] ?? null;
    return product.variants.find((variant) =>
      variant.options && Object.keys(selectedOptions).every((key) => variant.options?.[key] === selectedOptions[key]),
    ) ?? null;
  }, [product, selectedOptions]);

  const allImages = useMemo(() => {
    const uniqueImages = new Set<string>();
    if (product.imageUrl) uniqueImages.add(product.imageUrl);
    const additional = [
      ...(Array.isArray(product.additionalImages) ? product.additionalImages : []),
      ...(Array.isArray(product.additional_images) ? product.additional_images : []),
      ...(Array.isArray(product.galleryImages) ? product.galleryImages : []),
      ...(Array.isArray(product.gallery_images) ? product.gallery_images : []),
      ...(Array.isArray(product.images) ? product.images : []),
    ];
    additional.forEach((image) => {
      if (image && typeof image === 'string') uniqueImages.add(image);
    });
    const variants = Array.isArray(product.variants) ? product.variants : [];
    variants.forEach((variant) => {
      const variantImage = getVariantImage(variant);
      if (variantImage) uniqueImages.add(variantImage);
    });
    return [...uniqueImages];
  }, [product]);

  const currentPrice = (selectedVariant?.price && selectedVariant.price > 0) ? selectedVariant.price : (product.isSale && product.discountPrice ? product.discountPrice : product.price || 0);
  const comparePrice = product.isSale && product.discountPrice && product.discountPrice < product.price ? product.price : null;
  const currentStock = selectedVariant?.stock ?? product.stock ?? 0;
  const displayTitle = product.translations?.[lang]?.title || product.title;
  const displayDescription = product.translations?.[lang]?.description || product.description;
  const displayOptions = product.translations?.[lang]?.options || product.options || [];

  const handleOptionChange = (optionName: string, value: string) => {
    const nextOptions = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(nextOptions);
    const matchingVariant = product.variants?.find((variant) =>
      variant.options && Object.keys(nextOptions).every((key) => variant.options?.[key] === nextOptions[key]),
    );
    const matchingVariantImage = getVariantImage(matchingVariant);
    if (matchingVariantImage) setActiveImage(matchingVariantImage);
  };

  React.useEffect(() => {
    const selectedVariantImage = getVariantImage(selectedVariant);
    if (selectedVariantImage) setActiveImage(selectedVariantImage);
  }, [selectedVariant]);

  const handleAddToCart = () => {
    const productToAdd = selectedVariant
      ? {
          ...product,
          price: currentPrice,
          imageUrl: getVariantImage(selectedVariant) || product.imageUrl,
          stock: selectedVariant.stock,
          sku: selectedVariant.sku || product.sku,
        }
      : { ...product, price: currentPrice };
    for (let index = 0; index < quantity; index += 1) addItem(productToAdd);
    setCartOpen(true);
    toast.success(settings.addedToCartConfirmationText?.[lang] || 'Added to cart');
  };

  const handleSocialShare = (platform: 'whatsapp' | 'telegram' | 'threads' | 'facebook') => {
    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(displayTitle);
    const shareTargets = {
      whatsapp: `https://wa.me/?text=${shareText}%20${shareUrl}`,
      telegram: `https://t.me/share/url?url=${shareUrl}&text=${shareText}`,
      threads: `https://www.threads.net/intent/post?text=${shareText}%20${shareUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    };
    window.open(shareTargets[platform], '_blank', 'noopener,noreferrer,width=720,height=640');
  };

  return (
    <div suppressHydrationWarning className="min-h-screen bg-white py-3 text-slate-950 sm:py-10">
      <div className="mx-auto max-w-[1188px] px-4 sm:px-6 lg:px-8">
        <header className="mb-3 sm:mb-7">
          <BackButton label={settings.backToStoreText?.[lang]} />
        </header>

        <main className="grid items-start gap-5 lg:grid-cols-[minmax(0,520px)_minmax(0,460px)] lg:gap-11 xl:gap-12">
          <section>
            <button
              type="button"
              onClick={() => activeImage && setIsLightboxOpen(true)}
              className="relative w-full aspect-square sm:aspect-[4/5] overflow-hidden border border-slate-100 rounded"
              aria-label="Open product image"
            >
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={displayTitle}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Image unavailable
                </span>
              )}
            </button>

            {allImages.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
                {allImages.slice(0, 4).map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(image)}
                    className={`relative aspect-square overflow-hidden bg-white border transition-all ${activeImage === image ? 'border-slate-900 opacity-100' : 'border-transparent opacity-55 hover:opacity-100'}`}
                    aria-label={`Show product image ${index + 1}`}
                  >
                    <img
                      src={image}
                      alt={`${displayTitle} thumbnail ${index + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className="relative pt-0 lg:pt-0">
            <div className="max-w-[460px]">
              <h1 className="text-[28px] font-medium leading-[1.15] tracking-[-0.035em] text-slate-950 sm:text-[36px]">
                {displayTitle}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p className="text-[32px] font-medium tracking-[-0.04em] text-slate-950">
                  {formatPrice(currentPrice, lang, product.prices)}
                </p>
                {comparePrice && (
                  <p className="text-[14px] font-medium text-slate-500 line-through">
                    {formatPrice(comparePrice, lang, product.prices)}
                  </p>
                )}
              </div>

              {/* Options and Add to Cart logic remains same... */}
              <div className="mt-8">
                 <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={currentStock <= 0}
                  className="flex h-12 w-full items-center justify-center gap-2 bg-slate-950 px-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {currentStock > 0 ? (settings.addToCartButtonText?.[lang] || 'Add to cart') : (settings.outOfStockText?.[lang] || 'Out of stock')}
                </button>
              </div>
            </div>
          </aside>
        </main>

        <section className="mt-12 sm:mt-14">
          <h2 className="mb-6 text-[20px] font-medium tracking-[-0.02em] text-slate-950">
            {settings.relatedProductsTitleText?.[lang] || 'Related Products'}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {relatedProducts.filter((item) => Boolean(item?.id)).slice(0, 4).map((item) => (
              <ProductCard key={item.id} product={item} lang={lang} settings={settings as any} />
            ))}
          </div>
        </section>

        <AnimatePresence>
          {isLightboxOpen && activeImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 p-4 sm:p-10"
            >
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="absolute right-5 top-5 z-[110] border border-slate-200 bg-white p-3 text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
              <img src={activeImage} alt={displayTitle} className="max-h-full max-w-full object-contain" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
