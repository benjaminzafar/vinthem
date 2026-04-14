"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';

import { ArrowRight } from 'lucide-react';
import { Category } from '@/types';
import { useSettingsStore } from '@/store/useSettingsStore';

interface HeroSliderProps {
  categories: Category[];
  lang: string;
  settings?: any;
}

export function HeroSlider({ categories, lang, settings: propSettings }: HeroSliderProps) {
  const { settings: storeSettings } = useSettingsStore();
  const settings = propSettings || storeSettings;
  const [currentIndex, setCurrentIndex] = useState(0);
  const featuredCategories = categories.filter(c => c.showInHero).slice(0, 3);

  useEffect(() => {
    if (featuredCategories.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredCategories.length);
    }, 30000); // 30 seconds
    return () => clearInterval(timer);
  }, [featuredCategories.length]);

  if (featuredCategories.length === 0) return null;

  const category = featuredCategories[currentIndex];
  // Fallback if the image URL is broken, missing, or just a folder path
  const isValidImage = (url: string | null | undefined) => {
    if (!url || typeof url !== 'string') return false;
    const cleanUrl = url.trim().toLowerCase();
    // Must have a valid image extension and should not end with common folder names
    const hasExtension = cleanUrl.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/i);
    const isFolder = cleanUrl.endsWith('/') || 
                    cleanUrl.endsWith('/uploads') || 
                    cleanUrl.endsWith('products');
    
    return !!hasExtension && !isFolder;
  };

  const imageToShow = isValidImage(category.imageUrl) 
    ? category.imageUrl 
    : 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2000&auto=format&fit=crop';

  return (
    <section className="relative w-full h-[calc(100dvh-70px)] lg:h-[calc(100vh-80px)] flex flex-col justify-center overflow-hidden py-4 lg:py-0" style={{ backgroundColor: settings.heroBackgroundColor || '#ffffff' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={category.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full h-full max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-4 lg:gap-12 px-4 sm:px-8 lg:px-16"
        >
          {/* Text Content */}
          <div className="w-full lg:w-[45%] flex flex-col justify-center order-1 text-center lg:text-left z-10 flex-shrink-0">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 80 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="h-[3px] bg-black mb-3 lg:mb-6 mx-auto lg:mx-0"
            />
            <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-sans font-bold tracking-tight text-black leading-[1.1] mb-3 lg:mb-6 uppercase break-words">
              {category.translations?.[lang]?.name || category.name}
            </h2>
            <p className="text-gray-600 text-sm sm:text-base lg:text-xl font-medium leading-relaxed mb-4 lg:mb-8 max-w-md mx-auto lg:mx-0">
              {category.translations?.[lang]?.description || category.description}
            </p>
            
            {/* Desktop Button */}
            <div className="hidden lg:block">
              <Link 
                href={`/products?category=${encodeURIComponent(category.name)}`}
                className="inline-flex items-center bg-black text-white px-12 py-5 rounded-2xl font-bold hover:bg-gray-800 transition-all duration-300 uppercase tracking-widest text-sm"
              >
                {settings.shopNowText?.[lang] || 'Explore'} <ArrowRight className="ml-3 w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Image Content */}
          <div className="w-full lg:w-[55%] order-2 z-0 flex-1 min-h-0 flex items-center justify-center">
            <div className="relative w-full max-h-[40vh] lg:max-h-none aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3] xl:aspect-[16/10] overflow-hidden rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)]">
              {category.imageUrl && (
                <Image 
                  src={imageToShow || ''} 
                  alt={category.translations?.[lang]?.name || category.name} 
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover"
                />
              )}
            </div>
          </div>

          {/* Mobile Button */}
          <div className="w-full flex justify-center order-3 mt-2 lg:hidden z-10 flex-shrink-0 pb-4">
            <Link 
              href={`/products?category=${encodeURIComponent(category.name)}`}
              className="flex items-center justify-center bg-black text-white px-10 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all duration-300 uppercase tracking-[0.2em] text-sm w-full"
            >
              {settings.shopNowText?.[lang] || 'Explore'} <ArrowRight className="ml-3 w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Slide Indicators */}
      <div className="absolute bottom-2 lg:bottom-12 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {featuredCategories.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-2xl transition-all duration-500 ${i === currentIndex ? 'w-8 bg-black' : 'w-4 bg-gray-300'}`}
          />
        ))}
      </div>
    </section>
  );
}
