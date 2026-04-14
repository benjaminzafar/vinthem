"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { BackButton } from '@/components/BackButton';
import Link from 'next/link';
import { Product, ProductVariant, useCartStore } from '@/store/useCartStore';
import { ShoppingBag, Share2, Star, CheckCircle2, X } from 'lucide-react';
import { FaTelegramPlane, FaFacebook, FaWhatsapp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import Reviews from '@/components/Reviews';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '@/lib/currency';
import Image from 'next/image';

interface ProductClientProps {
  initialProduct: Product;
  relatedProducts: Product[];
}

export function ProductClient({ initialProduct, relatedProducts }: ProductClientProps) {
  const [product] = useState<Product>(initialProduct);
  const [activeImage, setActiveImage] = useState<string>(initialProduct.imageUrl || '');
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initialOptions: Record<string, string> = {};
    if (initialProduct.options && initialProduct.options.length > 0) {
      initialProduct.options.forEach(opt => {
        if (opt.values && opt.values.length > 0) {
          initialOptions[opt.name] = opt.values[0];
        }
      });
    }
    return initialOptions;
  });

  const { addItem } = useCartStore();
  const { settings } = useSettingsStore();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';

  const matchedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return null;
    }

    if (product.options && product.options.length > 0) {
      return product.variants.find((variant) =>
        variant.options && Object.keys(selectedOptions).every((key) => variant.options![key] === selectedOptions[key])
      ) ?? null;
    }

    return product.variants[0] ?? null;
  }, [product, selectedOptions]);

  useEffect(() => {
    setSelectedVariant(matchedVariant);
  }, [matchedVariant]);

  const handleOptionChange = (optionName: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(newOptions);
    
    if (product?.variants) {
      const matchingVariant = product.variants.find(v => 
        v.options && Object.keys(newOptions).every(k => v.options![k] === newOptions[k])
      );
      if (matchingVariant) {
        setSelectedVariant(matchingVariant);
        if (matchingVariant.imageUrl) setActiveImage(matchingVariant.imageUrl);
      } else {
        setSelectedVariant(null);
      }
    }
  };

  const handleVariantChange = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    if (variant.imageUrl) setActiveImage(variant.imageUrl);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  const allImages = useMemo(() => {
    if (!product) return [];
    const images = [product.imageUrl];
    if (product.additionalImages) {
      images.push(...product.additionalImages);
    }
    if (product.variants) {
      product.variants.forEach(v => {
        if (v.imageUrl && !images.includes(v.imageUrl)) {
          images.push(v.imageUrl);
        }
      });
    }
    return images.filter(img => img && img.trim() !== "");
  }, [product]);

  const getTranslatedColor = (color: string | undefined) => {
    if (!color) return '';
    const colorMap: Record<string, string> = {
      'Black': settings.colorBlackText?.[lang] || 'Black',
      'White': settings.colorWhiteText?.[lang] || 'White',
      'Beige': settings.colorBeigeText?.[lang] || 'Beige',
      'Navy': settings.colorNavyText?.[lang] || 'Navy',
      'Grey': settings.colorGreyText?.[lang] || 'Grey',
    };
    return colorMap[color] || color;
  };

  const handleAddToCart = () => {
    if (product) {
      const variantOptionsString = selectedVariant?.options 
        ? Object.values(selectedVariant.options).join(' / ') 
        : getTranslatedColor(selectedVariant?.color);

      const productToAdd = selectedVariant ? {
        ...product,
        price: (selectedVariant.price !== undefined && selectedVariant.price > 0) ? selectedVariant.price : product.price,
        imageUrl: selectedVariant.imageUrl || product.imageUrl,
        stock: selectedVariant.stock,
        sku: selectedVariant.sku || product.sku
      } : product;
      addItem(productToAdd);
      toast.success(`${product.title} ${selectedVariant ? `(${variantOptionsString})` : ''} ${settings.addedToCartConfirmationText?.[lang]}`, { duration: 600 });
    }
  };

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const title = product?.title || 'Check out this product!';

    if (platform === 'Native' && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        console.log('Error sharing', err);
      }
    }

    let shareUrl = '';
    switch (platform) {
      case 'WhatsApp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`;
        break;
      case 'Telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'Facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      default:
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
        return;
    }

    if (shareUrl) window.open(shareUrl, '_blank');
  };

  const isVideo = (url: string) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.mov');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <BackButton label={settings.backToStoreText?.[lang]} className="mb-12" />

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Product Image */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="lg:w-1/2 flex flex-col gap-6"
        >
          <div className="relative flex flex-col-reverse md:flex-row gap-4">
            {/* Gallery Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[500px] scrollbar-hide md:w-20 shrink-0">
                {allImages.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-16 h-20 md:w-full md:h-24 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all duration-300 ${activeImage === img ? 'border-brand-ink ring-4 ring-brand-ink/5 scale-95' : 'border-transparent hover:border-gray-200'}`}
                  >
                    {isVideo(img) ? (
                      <div className="relative w-full h-full bg-gray-100">
                        <video src={img} className="w-full h-full object-cover opacity-50" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-brand-ink/30 rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-brand-ink border-b-[4px] border-b-transparent ml-0.5"></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-full">
                        <Image 
                          src={img} 
                          alt={`Thumbnail ${idx + 1}`} 
                          fill
                          className="object-cover" 
                          sizes="80px"
                        />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div 
              className="flex-1 aspect-[4/5] bg-gray-50 rounded-2xl overflow-hidden relative group cursor-zoom-in shadow-sm border border-gray-100"
              onMouseEnter={() => !isVideo(activeImage) && setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
              onClick={() => !isVideo(activeImage) && setIsLightboxOpen(true)}
            >
              {activeImage ? (
                isVideo(activeImage) ? (
                  <video src={activeImage} className="w-full h-full object-cover" controls autoPlay muted loop />
                ) : (
                  <img
                    src={activeImage}
                    alt={product.title}
                    style={{
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      transform: isZoomed ? 'scale(2.5)' : 'scale(1)'
                    }}
                    className="w-full h-full object-cover transition-transform duration-300 ease-out"
                    referrerPolicy="no-referrer"
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-sans text-3xl">
                  Mavren
                </div>
              )}
              
              {!isVideo(activeImage) && activeImage && (
                <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-bold text-brand-ink uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 shadow-sm border border-gray-100 pointer-events-none">
                  {isZoomed ? 'Move to explore' : 'Click to expand'}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="lg:w-1/2 flex flex-col justify-start pt-4"
        >
          <div className="mb-6 flex items-center justify-between">
            <span className="inline-block text-xs font-medium tracking-wider uppercase text-brand-muted">
              {product.categoryName}
            </span>
            {product.sku && (
              <span className="text-xs text-brand-muted font-mono tracking-widest uppercase">{settings.skuLabelText?.[lang]}: {product.sku}</span>
            )}
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-sans text-brand-ink mb-6 leading-[1.1] tracking-tight">
            {product.translations?.[lang]?.title || product.title}
          </h1>

          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < Math.floor(product.rating || 5) ? 'fill-current' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="text-sm font-medium text-brand-ink">{product.rating || 5.0}</span>
            <span className="text-sm text-gray-500">({product.reviewCount || 0} {settings.reviewsText?.[lang]})</span>
          </div>
          
          <div className="flex items-center justify-between mb-8">
            <p className="text-3xl font-sans text-brand-ink font-medium">
              {formatPrice((selectedVariant?.price !== undefined && selectedVariant.price > 0) ? selectedVariant.price : (product.price || 0), lang, product.prices)}
            </p>
            <div>
              {(selectedVariant ? selectedVariant.stock : product.stock) > 0 ? (
                <div className="flex items-center text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-2xl">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  {settings.inStockText?.[lang]} {(selectedVariant ? selectedVariant.stock : product.stock) < 10 && <span className="ml-1 text-orange-500">({settings.onlyText?.[lang]} {(selectedVariant ? selectedVariant.stock : product.stock)} {settings.leftText?.[lang]})</span>}
                </div>
              ) : (
                <div className="flex items-center text-red-600 text-sm font-medium bg-red-50 px-3 py-1 rounded-2xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 mr-2"></div>
                  {settings.outOfStockText?.[lang]}
                </div>
              )}
            </div>
          </div>

          {/* Options */}
          {product.options && product.options.length > 0 && (
            <div className="space-y-6 mb-8">
              {product.options.map((option, idx) => {
                const isColorOption = option.name.toLowerCase() === 'color' || option.name.toLowerCase() === 'colour' || option.name.toLowerCase() === 'färg';
                return (
                  <div key={idx}>
                    <h3 className="text-sm font-semibold text-brand-ink mb-3 uppercase tracking-wider">{option.name}</h3>
                    <div className="flex flex-wrap gap-3">
                      {option.values.map((val, vIdx) => (
                        <button
                          key={vIdx}
                          onClick={() => handleOptionChange(option.name, val)}
                          className={`px-5 py-2.5 rounded-2xl text-sm font-medium transition-all border ${
                            selectedOptions[option.name] === val
                              ? 'bg-brand-ink text-white border-brand-ink'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={(selectedVariant ? selectedVariant.stock : product.stock) <= 0}
            className="w-full bg-brand-ink text-white py-4 sm:py-5 rounded-2xl font-medium text-sm uppercase tracking-wide hover:opacity-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center mb-10 active:scale-[0.98]"
          >
            <ShoppingBag className="w-4 h-4 mr-3" /> {(selectedVariant ? selectedVariant.stock : product.stock) > 0 ? settings.addToCartButtonText?.[lang] : settings.outOfStockText?.[lang]}
          </button>
          
          <div className="prose prose-nordic text-gray-600 mb-8">
            <p className="leading-relaxed text-lg">{product.translations?.[lang]?.description || product.description}</p>
          </div>

          <Reviews productId={product.id!} />

          <div>
            <h4 className="text-sm font-medium text-brand-ink mb-3 flex items-center">
              <Share2 className="w-4 h-4 mr-2" /> {settings.shareProductText?.[lang] || 'Share Product'}
            </h4>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => handleShare('WhatsApp')} className="flex items-center justify-center w-10 h-10 bg-green-50 hover:bg-green-100 text-green-600 rounded-full transition-colors"><FaWhatsapp /></button>
              <button onClick={() => handleShare('Telegram')} className="flex items-center justify-center w-10 h-10 bg-blue-50 hover:bg-blue-100 text-blue-500 rounded-full transition-colors"><FaTelegramPlane /></button>
              <button onClick={() => handleShare('Facebook')} className="flex items-center justify-center w-10 h-10 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full transition-colors"><FaFacebook /></button>
            </div>
          </div>
        </motion.div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-8 border-t border-gray-100 pt-8">
          <h2 className="text-lg font-sans font-bold text-brand-ink mb-4">{settings.relatedProductsTitleText?.[lang]}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {relatedProducts.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} className="group">
                <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-2 relative">
                  {p.imageUrl && (
                    <Image 
                      src={p.imageUrl} 
                      alt={p.title} 
                      fill
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  )}
                </div>
                <h3 className="font-sans font-semibold text-brand-ink text-xs truncate">{p.translations?.[lang]?.title || p.title}</h3>
                <p className="text-xs text-brand-muted">{formatPrice(p.price || 0, lang, p.prices)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
          {isLightboxOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-4 md:p-12"
            >
              <button onClick={() => setIsLightboxOpen(false)} className="absolute top-8 right-8 p-3 text-brand-ink hover:bg-gray-100 rounded-2xl transition-colors z-[110]"><X /></button>
              <div className="relative w-full h-full flex items-center justify-center">
                <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} src={activeImage} alt={product.title} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
              </div>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}
