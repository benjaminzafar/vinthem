"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product, useCartStore } from '@/store/useCartStore';
import { Category } from '@/types';
import { motion } from 'motion/react';
import { ArrowRight, ShoppingBag, Check } from 'lucide-react';
import { toast } from 'sonner';
import { HeroSlider } from '@/components/HeroSlider';
import { formatPrice } from '@/lib/currency';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTranslation } from 'react-i18next';

interface StorefrontClientProps {
  initialProducts: Product[];
  initialCategories: Category[];
}

export default function StorefrontClient({ initialProducts, initialCategories }: StorefrontClientProps) {
  const { settings: storefrontSettings } = useSettingsStore();
  const { addItem } = useCartStore();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';

  return (
    <div className="w-full bg-white">
      {/* Hero Slider Section */}
      <HeroSlider categories={initialCategories} lang={lang} />

      {/* Featured Products Section */}
      <section id="featured" className="py-32 bg-[#E6E6E4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-20">
            <div className="text-center mx-auto">
              <p className="text-xs font-medium tracking-widest uppercase mb-5 text-brand-muted">{storefrontSettings.featuredTopSubtitle?.[lang]}</p>
              <h2 className="text-4xl md:text-5xl font-sans mb-6 text-brand-ink tracking-tight">{storefrontSettings.featuredTitle?.[lang]}</h2>
              <p className="text-brand-muted max-w-xl mx-auto text-sm md:text-base font-normal leading-relaxed">{storefrontSettings.featuredSubtitle?.[lang]}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {initialProducts.filter(p => p.isFeatured)
              .slice(0, 4)
              .map((product, index) => (
              <Link key={product.id} href={`/product/${product.id}`} className="group">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100 mb-4">
                {product.imageUrl && product.imageUrl.trim() !== "" && (
                  <Image 
                    src={product.imageUrl} 
                    alt={product.title} 
                    fill 
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105" 
                    priority={index < 2}
                  />
                )}
                  <div className="absolute bottom-3 right-3 bg-brand-ink/90 backdrop-blur-md border border-white/10 w-12 h-12 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 flex items-center justify-center hover:scale-110">
                    <ArrowRight className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-brand-ink">{product.translations?.[lang]?.title || product.title}</h3>
                <p className="text-xs text-brand-muted">{formatPrice(product.price || 0, lang, product.prices)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Future Section */}
      <section id="future" className="py-20 md:py-28 bg-[#f5f6ee]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-3xl md:text-5xl font-sans text-brand-ink tracking-tight mb-6 whitespace-pre-line">{storefrontSettings.futureTitle?.[lang]}</h2>
            <p className="text-brand-muted max-w-2xl mx-auto text-lg font-light">{storefrontSettings.futureSubtitle?.[lang]}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <Link href={storefrontSettings.futureProduct1Link || '/products'} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 group block">
              {storefrontSettings.futureImage1 && (
                <Image 
                  src={storefrontSettings.futureImage1} 
                  alt="Future Product 1" 
                  fill 
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105" 
                />
              )}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/50 to-transparent opacity-80 pointer-events-none"></div>
              <div className="absolute top-8 left-8 right-8">
                <p className="text-white/90 font-medium text-sm tracking-widest uppercase mb-2">{storefrontSettings.futureProduct1Date?.[lang]}</p>
                <h3 className="text-white text-3xl font-bold tracking-tight">{storefrontSettings.futureProduct1Title?.[lang]}</h3>
              </div>
              <div className="absolute bottom-8 right-8 bg-white/20 backdrop-blur-md border border-white/30 p-4 rounded-full transition-transform duration-500 group-hover:scale-110 hover:bg-white/30">
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
            </Link>
            <Link href={storefrontSettings.futureProduct2Link || '/products'} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 group block">
              {storefrontSettings.futureImage2 && (
                <Image 
                  src={storefrontSettings.futureImage2} 
                  alt="Future Product 2" 
                  fill 
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105" 
                />
              )}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/50 to-transparent opacity-80 pointer-events-none"></div>
              <div className="absolute top-8 left-8 right-8">
                <p className="text-white/90 font-medium text-sm tracking-widest uppercase mb-2">{storefrontSettings.futureProduct2Date?.[lang]}</p>
                <h3 className="text-white text-3xl font-bold tracking-tight">{storefrontSettings.futureProduct2Title?.[lang]}</h3>
              </div>
              <div className="absolute bottom-8 right-8 bg-white/20 backdrop-blur-md border border-white/30 p-4 rounded-full transition-transform duration-500 group-hover:scale-110 hover:bg-white/30">
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Collection Section */}
      <section id="collection" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 md:mb-20">
            <div className="text-center mx-auto">
              <p className="text-xs font-medium tracking-widest uppercase mb-5 text-brand-muted">{storefrontSettings.collectionTopSubtitle?.[lang]}</p>
              <h2 className="text-4xl md:text-5xl font-sans mb-6 text-brand-ink tracking-tight">
                {storefrontSettings.collectionTitle?.[lang]}
              </h2>
              <p className="text-brand-muted max-w-xl mx-auto text-sm md:text-base font-normal leading-relaxed">{storefrontSettings.collectionSubtitle?.[lang]}</p>
            </div>
            <div className="mt-10 md:mt-0">
              <Link href="/products" className="inline-flex items-center text-xs font-medium uppercase tracking-wide text-brand-ink hover:opacity-80 transition-all">
                {storefrontSettings.viewAllText?.[lang]} <ArrowRight className="ml-3 w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {initialCategories.filter(c => c.isFeatured).length === 0 ? (
            <div className="text-center py-24 md:py-32 bg-white/50 rounded-2xl border border-white/20">
              <ShoppingBag className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl md:text-2xl font-sans mb-3">{storefrontSettings.noCollectionsFoundText?.[lang]}</h3>
              <p className="text-brand-muted text-base md:text-lg">{storefrontSettings.checkBackLaterText?.[lang]}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-10 md:gap-y-16">
              {initialCategories.filter(c => c.isFeatured).map((category, index) => (
                <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  key={category.id} 
                  className="group relative"
                >
                  <Link href={`/products?category=${encodeURIComponent(category.name)}`} className="block">
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100 mb-4 md:mb-5 rounded-2xl">
                      {category.imageUrl && category.imageUrl.trim() !== "" ? (
                        <Image
                          src={category.imageUrl}
                          alt={category.name}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400 font-sans text-xl md:text-2xl bg-gray-200">
                          {category.name}
                        </div>
                      )}
                      
                      {/* Button Overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 flex justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 bg-gradient-to-t from-black/60 to-transparent">
                        <span className="bg-white text-brand-ink w-full py-3 md:py-4 rounded-full text-xs md:text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                          {storefrontSettings.shopNowText?.[lang] || 'Shop Now'} <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                    <div className="px-1">
                      <h3 className="text-sm md:text-lg font-medium text-brand-ink mb-0.5 md:mb-1">{category.name}</h3>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-[#E6E6E4] text-brand-ink py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-ink/10 to-transparent"></div>
        </div>
        <div className="max-w-2xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-sans mb-6 tracking-tight font-light">
            {storefrontSettings.newsletterPlaceholder?.[lang]}
          </h2>
          <p className="text-brand-ink/70 mb-12 text-sm md:text-base max-w-md mx-auto font-light">
            {storefrontSettings.newsletterSectionSubtitle?.[lang] || 'Subscribe to receive updates, access to exclusive deals, and more.'}
          </p>
          
          <form className="relative max-w-md mx-auto flex items-center" onSubmit={async (e) => { 
            e.preventDefault(); 
            const email = (e.target as any).email.value;
            try {
              const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
              });
              if (response.ok) {
                toast.success(storefrontSettings.subscribedSuccessText?.[lang] || 'Subscribed successfully!');
                (e.target as any).email.value = '';
              } else {
                throw new Error('Failed to subscribe');
              }
            } catch (error) {
              toast.error('Failed to subscribe. Please try again.');
            }
          }}>
            <input 
              type="email" 
              name="email"
              placeholder="Enter your email address" 
              className="w-full bg-white border border-brand-ink/10 rounded-full px-6 py-4 text-brand-ink placeholder:text-brand-muted focus:outline-none focus:border-brand-ink/30 focus:bg-white/50 transition-all text-sm font-sans"
              required
            />
            <button type="submit" className="absolute right-2 top-2 bottom-2 bg-brand-ink text-white px-6 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-brand-ink/90 transition-colors flex items-center justify-center">
              {storefrontSettings.newsletterButtonText?.[lang]}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
