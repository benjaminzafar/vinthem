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
  initialSettings,
}: ProductClientProps) {
  const getVariantImage = (variant?: ProductVariant | null) => {
    if (!variant) {
      return '';
    }

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
    if (!product.variants?.length) {
      return null;
    }

    if (!product.options?.length) {
      return product.variants[0] ?? null;
    }

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

  const basePrice = product.isSale && product.discountPrice && product.discountPrice > 0
    ? product.discountPrice
    : product.price || 0;
  const currentPrice = (selectedVariant?.price && selectedVariant.price > 0) ? selectedVariant.price : basePrice;
  const comparePrice = product.isSale && product.discountPrice && product.discountPrice < product.price
    ? product.price
    : null;
  const currentStock = selectedVariant?.stock ?? product.stock ?? 0;
  const displayTitle = product.translations?.[lang]?.title || product.title;
  const displayDescription = product.translations?.[lang]?.description || product.description;
  const displayOptions = product.translations?.[lang]?.options || product.options || [];
  const introText = displayDescription && displayDescription.length > 220
    ? `${displayDescription.slice(0, 220).trim()}...`
    : displayDescription;
  const isColorOption = (optionName: string) => {
    const normalized = optionName.toLowerCase();
    return ['color', 'colour', 'färg', 'farve', 'farge', 'kleur'].some((keyword) => normalized.includes(keyword));
  };
  const getPrimaryOptionName = (optionIndex: number, optionName: string) =>
    product.options?.[optionIndex]?.name || optionName;
  const getPrimaryOptionValue = (optionIndex: number, valueIndex: number, value: string) =>
    product.options?.[optionIndex]?.values?.[valueIndex] || value;
  const getOptionVariantImage = (optionName: string, value: string) => {
    const variant = product.variants?.find((item) => item.options?.[optionName] === value);
    return getVariantImage(variant);
  };
  const optionEntries = displayOptions.map((option, optionIndex) => ({
    option,
    optionIndex,
    primaryOptionName: getPrimaryOptionName(optionIndex, option.name),
  }));
  const colorOptionEntries = optionEntries.filter(({ option }) => isColorOption(option.name));
  const detailOptionEntries = optionEntries.filter(({ option }) => !isColorOption(option.name));

  const handleOptionChange = (optionName: string, value: string) => {
    const nextOptions = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(nextOptions);

    const matchingVariant = product.variants?.find((variant) =>
      variant.options && Object.keys(nextOptions).every((key) => variant.options?.[key] === nextOptions[key]),
    );

    const matchingVariantImage = getVariantImage(matchingVariant);
    if (matchingVariantImage) {
      setActiveImage(matchingVariantImage);
    }
  };

  React.useEffect(() => {
    const selectedVariantImage = getVariantImage(selectedVariant);
    if (selectedVariantImage) {
      setActiveImage(selectedVariantImage);
    }
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

    for (let index = 0; index < quantity; index += 1) {
      addItem(productToAdd);
    }
    setCartOpen(true);
    toast.success(settings.addedToCartConfirmationText?.[lang] || 'Added to cart');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    toast.success(settings.linkCopiedText?.[lang] || 'Link copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
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
              className="relative flex h-[360px] w-full items-start justify-center overflow-hidden bg-white sm:h-[520px] lg:h-[560px]"
              aria-label="Open product image"
            >
              {activeImage ? (
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0, scale: 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="relative h-full w-full"
                >
                  <Image
                    src={activeImage}
                    alt={displayTitle}
                    fill
                    sizes="(max-width: 1024px) 100vw, 520px"
                    className="object-cover object-center sm:object-contain sm:object-top"
                    priority
                  />
                </motion.div>
              ) : (
                <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Image unavailable
                </span>
              )}
            </button>

            {allImages.length > 1 ? (
              <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
                {allImages.slice(0, 4).map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(image)}
                    className={`relative h-[66px] overflow-hidden bg-white transition-opacity sm:h-[98px] ${activeImage === image ? 'opacity-100' : 'opacity-55 hover:opacity-100'}`}
                    aria-label={`Show product image ${index + 1}`}
                  >
                    <Image
                      src={image}
                      alt={`${displayTitle} thumbnail ${index + 1}`}
                      fill
                      sizes="140px"
                      className="object-contain"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <aside className="relative pt-0 lg:pt-0">
            {(product.isSale || comparePrice) ? (
              <span className="absolute right-0 top-0 hidden h-14 w-14 items-center justify-center rounded-full bg-[#ef3b2d] text-[10px] font-semibold uppercase tracking-[0.16em] text-white sm:flex">
                {settings.featuredBadgeText?.[lang] || 'Sale'}
              </span>
            ) : null}

            <div className="max-w-[460px]">
              <h1 className="pr-0 text-[28px] font-medium leading-[1.15] tracking-[-0.035em] text-slate-950 sm:pr-16 sm:text-[36px] lg:mt-[-2px]">
                {displayTitle}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p className="text-[32px] font-medium tracking-[-0.04em] text-slate-950">
                  {formatPrice(currentPrice, lang, product.prices)}
                </p>
                {comparePrice ? (
                  <p className="text-[14px] font-medium text-slate-400 line-through">
                    {formatPrice(comparePrice, lang, product.prices)}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      className={`h-3.5 w-3.5 ${index < (product.rating || 5) ? 'fill-current' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
                <span>({product.reviewCount || 0} {settings.reviewsText?.[lang] || 'reviews'})</span>
                <span className={`ml-1 inline-flex items-center gap-1.5 font-medium ${currentStock > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  <Check className="h-3.5 w-3.5" />
                  {currentStock > 0 ? (settings.inStockText?.[lang] || 'In stock') : (settings.outOfStockText?.[lang] || 'Out of stock')}
                </span>
              </div>

              {colorOptionEntries.length > 0 ? (
                <div className="mt-7 space-y-5">
                  {colorOptionEntries.map(({ option, optionIndex, primaryOptionName }) => {
                    const selectedValue = selectedOptions[primaryOptionName] || '';

                    return (
                      <div key={option.name}>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {option.name}
                          </span>
                          <span className="text-[12px] font-medium text-slate-500">
                            {selectedValue}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          {option.values.map((value, valueIndex) => {
                            const primaryValue = getPrimaryOptionValue(optionIndex, valueIndex, value);
                            const variantImage = getOptionVariantImage(primaryOptionName, primaryValue);
                            const isActive = selectedValue === primaryValue;

                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => handleOptionChange(primaryOptionName, primaryValue)}
                                className={`group relative flex h-14 w-14 items-center justify-center overflow-hidden bg-white text-[11px] font-semibold transition-all ${isActive ? 'ring-2 ring-slate-950 ring-offset-2' : 'opacity-70 hover:opacity-100'}`}
                                aria-pressed={isActive}
                                aria-label={`${option.name} ${value}`}
                              >
                                {variantImage ? (
                                  <Image
                                    src={variantImage}
                                    alt={`${option.name} ${value}`}
                                    fill
                                    sizes="56px"
                                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                                  />
                                ) : (
                                  <span className="relative flex h-full items-center justify-center px-1 text-center">
                                    {value}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {introText ? (
                <p className="mt-5 max-w-[440px] text-[14px] leading-6 text-slate-600">
                  {introText}
                </p>
              ) : null}

              <div className="mt-7 space-y-5">
                {detailOptionEntries.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {detailOptionEntries.map(({ option, optionIndex, primaryOptionName }) => {
                      const selectedValue = selectedOptions[primaryOptionName] || '';

                      return (
                        <label key={option.name} className="block">
                          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {option.name}
                          </span>
                          <select
                            value={selectedValue}
                            onChange={(event) => handleOptionChange(primaryOptionName, event.target.value)}
                            className="h-11 w-full appearance-none border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-800 outline-none transition-colors hover:border-slate-400 focus:border-slate-950 sm:px-4"
                          >
                            {option.values.map((value, valueIndex) => {
                              const primaryValue = getPrimaryOptionValue(optionIndex, valueIndex, value);
                              return (
                                <option key={value} value={primaryValue}>
                                  {value}
                                </option>
                              );
                            })}
                          </select>
                        </label>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 grid w-full grid-cols-[74px_minmax(0,1fr)] items-center gap-2 sm:max-w-[390px] sm:flex sm:gap-3">
                <div className="flex h-12 w-full items-center border border-slate-200 bg-white sm:w-[72px]">
                  <span className="w-8 text-center text-[15px] font-semibold text-slate-950">{quantity}</span>
                  <div className="flex h-full flex-col border-l border-slate-200">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(Math.max(1, currentStock || 1), quantity + 1))}
                      className="flex h-1/2 w-8 items-center justify-center text-slate-500 transition-colors hover:text-slate-950"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex h-1/2 w-8 items-center justify-center border-t border-slate-200 text-slate-500 transition-colors hover:text-slate-950"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={currentStock <= 0}
                  className="flex h-12 min-w-0 items-center justify-center gap-2 bg-slate-950 px-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500 sm:flex-1 sm:px-6 sm:tracking-[0.14em]"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {currentStock > 0 ? (settings.addToCartButtonText?.[lang] || 'Add to cart') : (settings.outOfStockText?.[lang] || 'Out of stock')}
                </button>
              </div>

              <div className="mt-6 border-b border-t border-slate-100 py-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {settings.shareProductText?.[lang] || 'Share'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSocialShare('whatsapp')}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-950 transition-colors hover:border-slate-950 hover:bg-slate-950 hover:text-white"
                    aria-label="Share on WhatsApp"
                  >
                    <FaWhatsapp className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialShare('telegram')}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-950 transition-colors hover:border-slate-950 hover:bg-slate-950 hover:text-white"
                    aria-label="Share on Telegram"
                  >
                    <FaTelegramPlane className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialShare('threads')}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-950 transition-colors hover:border-slate-950 hover:bg-slate-950 hover:text-white"
                    aria-label="Share on Threads"
                  >
                    <SiThreads className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialShare('facebook')}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-950 transition-colors hover:border-slate-950 hover:bg-slate-950 hover:text-white"
                    aria-label="Share on Facebook"
                  >
                    <FaFacebookF className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-950 transition-colors hover:border-slate-950 hover:bg-slate-950 hover:text-white"
                    aria-label="Copy product link"
                  >
                    {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

            </div>
          </aside>
        </main>

        <section className="mt-10 sm:mt-14">
          <div className="border border-slate-200">
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveDetailsTab('description')}
                className={`h-12 border-r border-slate-200 px-4 text-[12px] font-medium transition-colors sm:px-6 ${activeDetailsTab === 'description' ? 'bg-white text-slate-950' : 'bg-[#fafafa] text-slate-400 hover:text-slate-950'}`}
              >
                Description
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailsTab('reviews')}
                className={`h-12 border-r border-slate-200 px-4 text-[12px] font-medium transition-colors sm:px-6 ${activeDetailsTab === 'reviews' ? 'bg-white text-slate-950' : 'bg-[#fafafa] text-slate-400 hover:text-slate-950'}`}
              >
                {settings.customerReviewsText?.[lang] || 'Reviews'} ({product.reviewCount || 0})
              </button>
            </div>

            <div className="p-5 sm:p-6">
              {activeDetailsTab === 'description' ? (
                <motion.div
                  key="description"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {displayDescription ? (
                    <p className="text-[14px] leading-7 text-slate-600">
                      {displayDescription}
                    </p>
                  ) : (
                    <p className="text-[14px] text-slate-400">No description available.</p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Reviews productId={product.id!} initialSettings={initialSettings} lang={lang} />
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {relatedProducts.length > 0 ? (
          <section className="mt-12 sm:mt-14">
            <h2 className="mb-6 text-[20px] font-medium tracking-[-0.02em] text-slate-950">
              {settings.relatedProductsTitleText?.[lang] || 'Related Products'}
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
              {relatedProducts.filter((item) => Boolean(item?.id)).slice(0, 4).map((item) => (
                <Link key={item.id} href={`/${lang}/product/${item.id}`} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#f4f4f2]">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-[13px] font-medium leading-5 text-slate-950">
                    {item.translations?.[lang]?.title || item.title}
                  </h3>
                  <p className="mt-1 text-[13px] font-medium text-slate-700">
                    {formatPrice(item.price || 0, lang, item.prices)}
                  </p>
                  <div className="mt-1 flex text-amber-500">
                    {[...Array(5)].map((_, index) => (
                      <Star key={index} className={`h-3 w-3 ${index < (item.rating || 5) ? 'fill-current' : 'text-slate-200'}`} />
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <AnimatePresence>
          {isLightboxOpen && activeImage ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 p-4 sm:p-10"
            >
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="absolute right-5 top-5 z-[110] border border-slate-200 bg-white p-3 text-slate-500 transition-colors hover:border-slate-950 hover:text-slate-950 sm:right-8 sm:top-8"
                aria-label="Close image preview"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="relative h-full w-full">
                <Image
                  src={activeImage}
                  alt={displayTitle}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
