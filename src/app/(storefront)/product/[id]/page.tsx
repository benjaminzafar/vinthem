"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { BackButton } from '@/components/BackButton';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

import { Product, ProductVariant, useCartStore } from '@/store/useCartStore';
import { ArrowLeft, ShoppingBag, Share2, Star, CheckCircle2, X } from 'lucide-react';
import { FaTelegramPlane, FaFacebook, FaWhatsapp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import Reviews from '@/components/Reviews';

import { useSettingsStore } from '@/store/useSettingsStore';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '@/lib/currency';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const { addItem } = useCartStore();
  const { settings } = useSettingsStore();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const supabase = createClient();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data: productData, error } = await supabase
          .from('products')
          .select('*, imageUrl:image_url, isFeatured:is_featured, createdAt:created_at')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        const data = productData as Product;
        setProduct(data);
        setActiveImage(data.imageUrl || '');
        
        // Initialize selected options and variant
        if (data.options && data.options.length > 0) {
          const initialOptions: Record<string, string> = {};
          data.options.forEach(opt => {
            if (opt.values && opt.values.length > 0) {
              initialOptions[opt.name] = opt.values[0];
            }
          });
          setSelectedOptions(initialOptions);
          
          if (data.variants && data.variants.length > 0) {
            const matchingVariant = data.variants.find(v => 
              v.options && Object.keys(initialOptions).every(k => v.options![k] === initialOptions[k])
            );
            if (matchingVariant) {
              setSelectedVariant(matchingVariant);
              if (matchingVariant.imageUrl) setActiveImage(matchingVariant.imageUrl);
            }
          }
        } else if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
          if (data.variants[0].imageUrl) {
            setActiveImage(data.variants[0].imageUrl);
          }
        }

        // Fetch related products
        const { data: relatedData } = await supabase
          .from('products')
          .select('*, imageUrl:image_url, isFeatured:is_featured, createdAt:created_at')
          .eq('category', data.category)
          .neq('id', data.id)
          .limit(4);

        if (relatedData) {
          setRelatedProducts(relatedData as Product[]);
        } else {
          // Fallback
          const { data: fallbackData } = await supabase
            .from('products')
            .select('*, imageUrl:image_url, isFeatured:is_featured, createdAt:created_at')
            .neq('id', data.id)
            .limit(4);
          if (fallbackData) setRelatedProducts(fallbackData as Product[]);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

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
        await navigator.share({
          title,
          url
        });
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

    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  const isVideo = (url: string) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.mov');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-ink"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-3xl font-sans font-bold text-brand-ink mb-4">{settings.productNotFoundText?.[lang]}</h2>
        <BackButton label={settings.backToStoreText?.[lang]} className="text-brand-accent hover:underline" />
      </div>
    );
  }

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
            {/* Gallery Thumbnails (Side) */}
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
                      <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                  <video
                    src={activeImage}
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                    muted
                    loop
                  />
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
                  Nordic
                </div>
              )}
              
              {/* Zoom Indicator */}
              {!isVideo(activeImage) && activeImage && (
                <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-bold text-brand-ink uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 shadow-sm border border-gray-100 pointer-events-none">
                  {isZoomed ? 'Move to explore' : 'Click to expand'}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Lightbox Modal */}
        <AnimatePresence>
          {isLightboxOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-4 md:p-12"
            >
              <button 
                onClick={() => setIsLightboxOpen(false)}
                className="absolute top-8 right-8 p-3 text-brand-ink hover:bg-gray-100 rounded-2xl transition-colors z-[110]"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="relative w-full h-full flex items-center justify-center">
                <motion.img
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  src={activeImage}
                  alt={product.title}
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Lightbox Thumbnails */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-3 bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-lg">
                {allImages.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-12 h-16 rounded-2xl overflow-hidden border-2 transition-all ${activeImage === img ? 'border-brand-ink scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="lg:w-1/2 flex flex-col justify-start pt-4"
        >
          <div className="mb-6 flex items-center justify-between">
            <span className="inline-block text-xs font-medium tracking-wider uppercase text-brand-muted">
              {product.category}
            </span>
            {product.sku && (
              <span className="text-xs text-brand-muted font-mono tracking-widest uppercase">{settings.skuLabelText?.[lang]}: {product.sku}</span>
            )}
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-sans text-brand-ink mb-6 leading-[1.1] tracking-tight">
            {product.translations?.[lang]?.title || product.title}
          </h1>

          {/* Rating */}
          {(product.rating !== undefined || product.reviewCount !== undefined) && (
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.floor(product.rating || 5) ? 'fill-current' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-sm font-medium text-brand-ink">{product.rating || 5.0}</span>
              <span className="text-sm text-gray-500">({product.reviewCount || Math.floor(Math.random() * 50) + 10} {settings.reviewsText?.[lang]})</span>
            </div>
          )}
          
          <div className="flex items-center justify-between mb-8">
            <p className="text-3xl font-sans text-brand-ink font-medium">
              {formatPrice((selectedVariant?.price !== undefined && selectedVariant.price > 0) ? selectedVariant.price : (product.price || 0), lang, product.prices)}
            </p>
            {/* Stock Status */}
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

          {/* Options & Variants */}
          {product.options && product.options.length > 0 ? (
            <div className="space-y-6 mb-8">
              {product.options.map((option, idx) => {
                const isColorOption = option.name.toLowerCase() === 'color' || option.name.toLowerCase() === 'colour' || option.name.toLowerCase() === 'färg';
                
                return (
                  <div key={idx}>
                    <h3 className="text-sm font-semibold text-brand-ink mb-3 uppercase tracking-wider">{option.name}</h3>
                    <div className="flex flex-wrap gap-3">
                      {option.values.map((val, vIdx) => {
                        let swatchImage = null;
                        if (isColorOption && product.variants) {
                          const matchingVariant = product.variants.find(v => v.options && v.options[option.name] === val && v.imageUrl);
                          if (matchingVariant) {
                            swatchImage = matchingVariant.imageUrl;
                          }
                        }

                        return (
                          <button
                            key={vIdx}
                            onClick={() => handleOptionChange(option.name, val)}
                            className={isColorOption && swatchImage ? `w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all ${
                              selectedOptions[option.name] === val
                                ? 'border-brand-ink ring-2 ring-brand-ink/20'
                                : 'border-transparent hover:border-gray-300'
                            }` : `px-5 py-2.5 rounded-2xl text-sm font-medium transition-all border ${
                              selectedOptions[option.name] === val
                                ? 'bg-brand-ink text-white border-brand-ink'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                            }`}
                            title={val}
                          >
                            {isColorOption && swatchImage ? (
                              <img src={swatchImage} alt={val} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              val
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : product.variants && product.variants.length > 0 ? (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-brand-ink mb-3">{settings.colorLabelText?.[lang]}: {getTranslatedColor(selectedVariant?.color)}</h3>
              <div className="flex gap-4">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => handleVariantChange(variant)}
                    className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all ${selectedVariant?.id === variant.id ? 'border-brand-ink' : 'border-transparent hover:border-gray-300'}`}
                  >
                    {variant.imageUrl && variant.imageUrl.trim() !== "" && <img src={variant.imageUrl} alt={getTranslatedColor(variant.color)} className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

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

          {/* Features */}
          {product.features && product.features.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-brand-ink mb-3">{settings.featuresTitleText?.[lang]}</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                {product.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Specifications */}
          {product.specifications && product.specifications.length > 0 && (
            <div className="mb-10">
              <h3 className="text-lg font-semibold text-brand-ink mb-3">{settings.specificationsTitleText?.[lang]}</h3>
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <tbody className="divide-y divide-gray-200">
                    {product.specifications.map((spec, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <th className="px-4 py-3 font-medium text-gray-900 w-1/3">{spec.name}</th>
                        <td className="px-4 py-3 text-gray-600">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-brand-ink mb-3 flex items-center">
              <Share2 className="w-4 h-4 mr-2" /> {settings.shareProductText?.[lang] || 'Share Product'}
            </h4>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => handleShare('WhatsApp')} className="flex items-center justify-center w-10 h-10 bg-green-50 hover:bg-green-100 text-green-600 rounded-full transition-colors" title="WhatsApp">
                <FaWhatsapp className="w-5 h-5" />
              </button>
              <button onClick={() => handleShare('Telegram')} className="flex items-center justify-center w-10 h-10 bg-blue-50 hover:bg-blue-100 text-blue-500 rounded-full transition-colors" title="Telegram">
                <FaTelegramPlane className="w-5 h-5" />
              </button>
              <button onClick={() => handleShare('Facebook')} className="flex items-center justify-center w-10 h-10 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full transition-colors" title="Facebook">
                <FaFacebook className="w-5 h-5" />
              </button>

            </div>
          </div>
        </motion.div>
      </div>

      <Reviews productId={product.id!} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-8 border-t border-gray-100 pt-8">
          <h2 className="text-lg font-sans font-bold text-brand-ink mb-4">{settings.relatedProductsTitleText?.[lang]}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {relatedProducts.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} className="group">
                <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-2">
                  {p.imageUrl && p.imageUrl.trim() !== "" && <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />}
                </div>
                <h3 className="font-sans font-semibold text-brand-ink text-xs group-hover:text-brand-accent transition-colors truncate">{p.translations?.[lang]?.title || p.title}</h3>
                <p className="text-xs text-brand-muted">{formatPrice(p.price || 0, lang, p.prices)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
