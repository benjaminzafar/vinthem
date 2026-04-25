
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { StorefrontSettings } from '@/store/useSettingsStore';

interface FutureSectionsProps {
  lang: string;
  settings: StorefrontSettings;
}

export function FutureSections({ lang, settings }: FutureSectionsProps) {
  return (
    <section id="future" className="py-20 md:py-28 bg-[#f5f6ee]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-[24px] md:text-[32px] font-bold text-brand-ink mb-6 whitespace-pre-line tracking-tight">{settings.futureTitle?.[lang]}</h2>
          <p className="text-brand-muted max-w-2xl mx-auto text-sm md:text-base font-normal leading-relaxed">{settings.futureSubtitle?.[lang]}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <Link href={settings.futureProduct1Link || '/products'} className="relative aspect-[4/3] overflow-hidden rounded bg-gray-100 group block">
            {settings.futureImage1 && (
              <Image 
                src={settings.futureImage1} 
                alt={settings.futureProduct1Title?.[lang] || "Future Product Showcase"} 
                fill 
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105" 
              />
            )}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/50 to-transparent opacity-80 pointer-events-none"></div>
            <div className="absolute top-8 left-8 right-8">
              <p className="text-white/90 font-medium text-sm tracking-widest uppercase mb-2">{settings.futureProduct1Date?.[lang]}</p>
              <h3 className="text-white text-[18px] sm:text-[24px] font-bold tracking-tight">{settings.futureProduct1Title?.[lang]}</h3>
            </div>
            <div className="absolute bottom-8 right-8 bg-white/20 backdrop-blur-md border border-white/30 p-4 rounded transition-transform duration-500 group-hover:scale-110 hover:bg-white/30">
              <ArrowRight className="w-6 h-6 text-white" />
            </div>
          </Link>
          <Link href={settings.futureProduct2Link || '/products'} className="relative aspect-[4/3] overflow-hidden rounded bg-gray-100 group block">
            {settings.futureImage2 && (
              <Image 
                src={settings.futureImage2} 
                alt={settings.futureProduct2Title?.[lang] || "Future Product Showcase"} 
                fill 
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105" 
              />
            )}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/50 to-transparent opacity-80 pointer-events-none"></div>
            <div className="absolute top-8 left-8 right-8">
              <p className="text-white/90 font-medium text-sm tracking-widest uppercase mb-2">{settings.futureProduct2Date?.[lang]}</p>
              <h3 className="text-white text-[18px] sm:text-[24px] font-bold tracking-tight">{settings.futureProduct2Title?.[lang]}</h3>
            </div>
            <div className="absolute bottom-8 right-8 bg-white/20 backdrop-blur-md border border-white/30 p-4 rounded transition-transform duration-500 group-hover:scale-110 hover:bg-white/30">
              <ArrowRight className="w-6 h-6 text-white" />
            </div>
          </Link>
        </div>

        <div className="mt-16 md:mt-24 text-center">
          <Link 
            href="/products" 
            className="group inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-brand-ink hover:opacity-70 transition-all border-b-2 border-brand-ink pb-1"
          >
            {settings.futureViewAllText?.[lang] || 'View All Classics'} 
          </Link>
        </div>
      </div>
    </section>
  );
}

