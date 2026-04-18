"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Copy, CheckCircle2, ChevronRight, Share2, ShieldCheck, ShoppingBag, SlidersHorizontal, Star, X } from 'lucide-react';
import { FaThreads } from 'react-icons/fa6';
import { FaFacebook, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { BackButton } from '@/components/BackButton';
import Reviews from '@/components/Reviews';
import { formatPrice } from '@/lib/currency';
import { getClientLocale } from '@/lib/locale';
import { Product, useCartStore } from '@/store/useCartStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useUIStore } from '@/store/useUIStore';

interface ProductClientProps {
  initialProduct: Product;
  relatedProducts: Product[];
}

export function ProductClient({ initialProduct, relatedProducts }: ProductClientProps) {
  const [product] = useState<Product>(initialProduct);
  const [activeImage, setActiveImage] = useState<string>(() => initialProduct.imageUrl || initialProduct.additionalImages?.[0] || '');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initialOptions: Record<string, string> = {};
    initialProduct.options?.forEach((option) => {
      if (option.values?.[0]) {
        initialOptions[option.name] = option.values[0];
      }
    });
    return initialOptions;
  });

  const { addItem } = useCartStore();
  const { settings } = useSettingsStore();
  const { setCartOpen } = useUIStore();
  const lang = getClientLocale();
  const router = useRouter();

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
    product.additionalImages?.forEach((image) => image && uniqueImages.add(image));
    product.variants?.forEach((variant) => variant.imageUrl && uniqueImages.add(variant.imageUrl));
    return [...uniqueImages];
  }, [product]);

  const currentPrice = (selectedVariant?.price && selectedVariant.price > 0) ? selectedVariant.price : (product.price || 0);
  const currentStock = selectedVariant?.stock ?? product.stock ?? 0;

  const handleOptionChange = (optionName: string, value: string) => {
    const nextOptions = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(nextOptions);

    const matchingVariant = product.variants?.find((variant) =>
      variant.options && Object.keys(nextOptions).every((key) => variant.options?.[key] === nextOptions[key]),
    );

    if (matchingVariant?.imageUrl) {
      setActiveImage(matchingVariant.imageUrl);
    }
  };

  const handleAddToCart = () => {
    const productToAdd = selectedVariant
      ? {
          ...product,
          price: selectedVariant.price && selectedVariant.price > 0 ? selectedVariant.price : product.price,
          imageUrl: selectedVariant.imageUrl || product.imageUrl,
          stock: selectedVariant.stock,
          sku: selectedVariant.sku || product.sku,
        }
      : product;

    addItem(productToAdd);
    setCartOpen(true);
    toast.success(settings.addedToCartConfirmationText?.[lang] || 'Added to cart');
  };

  const handleShare = (platform: 'WhatsApp' | 'Telegram' | 'Threads' | 'Facebook') => {
    const url = window.location.href;
    const title = product.translations?.[lang]?.title || product.title;

    const shareUrl = platform === 'WhatsApp'
      ? `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}`
      : platform === 'Telegram'
        ? `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
        : platform === 'Threads'
          ? `https://www.threads.net/intent/post?text=${encodeURIComponent(`${title} ${url}`)}`
          : `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    toast.success(settings.linkCopiedText?.[lang] || 'Link copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOpenProductFilters = () => {
    const categoryParam = product.categoryName ? `&category=${encodeURIComponent(product.categoryName)}` : '';
    router.push(`/products?openSearch=true${categoryParam}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <BackButton label={settings.backToStoreText?.[lang]} className="mb-8" />

      <div className="grid gap-10 lg:grid-cols-[1fr_450px] lg:gap-8">
        <section className="space-y-4">
          <div className="overflow-hidden border border-slate-200 bg-white rounded">
            <div className="relative aspect-[4/5] bg-slate-50">
              {activeImage ? (
                <button onClick={() => setIsLightboxOpen(true)} className="absolute inset-0">
                  <Image
                    src={activeImage}
                    alt={product.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover"
                    priority
                  />
                </button>
              ) : (
                <div className="flex h-full items-center justify-center text-sm uppercase tracking-[0.24em] text-slate-400">
                  Mavren
                </div>
              )}
            </div>
          </div>

          {allImages.length > 1 && (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
              {allImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  onClick={() => setActiveImage(image)}
                  className={`relative aspect-[4/5] overflow-hidden border transition-all rounded ${activeImage === image ? 'border-slate-900' : 'border-slate-200 hover:border-slate-400'}`}
                >
                  <Image src={image} alt={`${product.title} ${index + 1}`} fill sizes="120px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col">
          <div className="border border-slate-200 bg-white p-6 sm:p-8 rounded">
            <div className="flex flex-wrap items-center gap-3">
              {product.categoryName && (
                <span className="border border-slate-200 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 rounded">
                  {product.categoryName}
                </span>
              )}
              {product.sku && (
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  SKU {product.sku}
                </span>
              )}
            </div>

            <h1 className="mt-6 text-4xl font-medium leading-tight tracking-tight text-slate-900 sm:text-5xl">
              {product.translations?.[lang]?.title || product.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, index) => (
                  <Star key={index} className={`h-4 w-4 ${index < Math.floor(product.rating || 5) ? 'fill-current' : ''}`} strokeWidth={1.5} />
                ))}
              </div>
              <span>{product.reviewCount || 0} {settings.reviewsText?.[lang] || 'reviews'}</span>
              <span className="flex items-center gap-2 text-emerald-600">
                <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
                Secure checkout
              </span>
            </div>

            <div className="mt-8 flex flex-wrap items-end gap-4 border-b border-slate-100 pb-8">
              <p className="text-4xl font-medium tracking-tight text-slate-900">
                {formatPrice(currentPrice, lang, product.prices)}
              </p>
              <div className={`inline-flex items-center gap-2 border px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] rounded ${currentStock > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                {currentStock > 0 ? (settings.inStockText?.[lang] || 'In Stock') : (settings.outOfStockText?.[lang] || 'Out of stock')}
              </div>
            </div>

            {product.options?.length ? (
              <div className="mt-8 space-y-6">
                {product.options.map((option) => (
                  <div key={option.name}>
                    <p className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                      {option.name}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((value) => (
                        <button
                          key={value}
                          onClick={() => handleOptionChange(option.name, value)}
                          className={`border px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition-all rounded ${selectedOptions[option.name] === value ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'}`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleAddToCart}
                disabled={currentStock <= 0}
                className="flex min-h-[54px] flex-1 items-center justify-center gap-3 bg-slate-900 px-8 text-[11px] font-black uppercase tracking-[0.22em] text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 rounded"
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                {currentStock > 0 ? (settings.addToCartButtonText?.[lang] || 'Add to Cart') : (settings.outOfStockText?.[lang] || 'Out of Stock')}
              </button>
              <Link
                href="/cart"
                className="flex min-h-[54px] items-center justify-center border border-slate-200 px-6 text-[11px] font-black uppercase tracking-[0.22em] text-slate-700 transition-all hover:border-slate-900 hover:text-slate-900 rounded"
              >
                {settings.cartTitle?.[lang] || 'View Cart'}
              </Link>
            </div>

            <div className="mt-8 text-sm leading-relaxed text-slate-600">
              <p>{product.translations?.[lang]?.description || product.description}</p>
            </div>

            <div className="mt-8 flex items-center gap-1.5 border-t border-slate-100 pt-6">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                <Share2 className="mr-2 inline h-4 w-4" strokeWidth={1.5} />
                {settings.shareProductText?.[lang] || 'Share'}
              </span>
              <button 
                onClick={() => handleShare('WhatsApp')} 
                className="flex h-10 w-10 items-center justify-center border border-slate-200 text-slate-700 transition-all hover:border-slate-900 hover:text-slate-900 rounded"
              >
                <FaWhatsapp />
              </button>
              <button 
                onClick={() => handleShare('Telegram')} 
                className="flex h-10 w-10 items-center justify-center border border-slate-200 text-slate-700 transition-all hover:border-slate-900 hover:text-slate-900 rounded"
              >
                <FaTelegramPlane />
              </button>
              <button 
                onClick={() => handleShare('Threads')} 
                className="flex h-10 w-10 items-center justify-center border border-slate-200 text-slate-700 transition-all hover:border-slate-900 hover:text-slate-900 rounded"
              >
                <FaThreads />
              </button>
              <button 
                onClick={() => handleShare('Facebook')} 
                className="flex h-10 w-10 items-center justify-center border border-slate-200 text-slate-700 transition-all hover:border-slate-900 hover:text-slate-900 rounded"
              >
                <FaFacebook />
              </button>
              
              <button 
                onClick={handleCopyLink} 
                className={`flex h-10 w-10 items-center justify-center border transition-all rounded ${isCopied ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'border-slate-200 text-slate-700 hover:border-slate-900 hover:text-slate-900'}`}
                title="Copy product link"
              >
                {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="mt-6 border border-slate-200 bg-white p-6 sm:p-8 rounded">
            <Reviews productId={product.id!} />
          </div>
        </section>
      </div>

      <div className="pointer-events-none fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleOpenProductFilters}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-white transition-all hover:-translate-y-0.5 active:scale-95"
          aria-label={settings.filterAndSortText?.[lang] || 'Filter and Sort'}
        >
          <SlidersHorizontal className="h-6 w-6" strokeWidth={1.5} />
        </button>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-slate-200 pt-12">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-medium tracking-tight text-slate-900">
              {settings.relatedProductsTitleText?.[lang] || 'Related Products'}
            </h2>
            <Link href="/products" className="inline-flex items-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 transition-all hover:text-slate-900">
              Explore more <ChevronRight className="ml-1 h-4 w-4" strokeWidth={1.5} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
            {relatedProducts.filter((item) => Boolean(item?.id)).map((item) => (
              <Link key={item.id} href={`/product/${item.id}`} className="group">
                <div className="relative aspect-[4/5] overflow-hidden border border-slate-200 bg-slate-50 rounded">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.title} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : null}
                </div>
                <h3 className="mt-4 text-sm font-medium text-slate-900 transition-colors group-hover:text-slate-600">
                  {item.translations?.[lang]?.title || item.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{formatPrice(item.price || 0, lang, item.prices)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <AnimatePresence>
        {isLightboxOpen && activeImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-950/90 p-4 md:p-10">
            <button onClick={() => setIsLightboxOpen(false)} className="absolute right-6 top-6 z-[110] flex h-12 w-12 items-center justify-center border border-white/20 text-white transition-all hover:border-white/60 rounded">
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <div className="relative flex h-full w-full items-center justify-center">
              <div className="relative h-full w-full max-w-5xl rounded overflow-hidden">
                <Image src={activeImage} alt={product.title} fill sizes="100vw" className="object-contain" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
