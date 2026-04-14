import React, { Suspense } from 'react';
import { createClient } from '@/utils/supabase/server';
import { Product } from '@/store/useCartStore';
import { Category } from '@/types';
import { getSettings } from '@/lib/data';
import { HeroSlider } from '@/components/HeroSlider';
import { FeaturedProducts } from '@/components/storefront/FeaturedProducts';
import dynamic from 'next/dynamic';

const FutureSections = dynamic(() => import('@/components/storefront/FutureSections').then(mod => mod.FutureSections), { ssr: true });
const CollectionList = dynamic(() => import('@/components/storefront/CollectionList').then(mod => mod.CollectionList), { ssr: true });
const NewsletterSection = dynamic(() => import('@/components/storefront/NewsletterSection').then(mod => mod.NewsletterSection), { ssr: true });

// high-performance skeletons
const SectionSkeleton = () => (
  <div className="w-full h-[400px] bg-zinc-50 animate-pulse flex items-center justify-center">
    <div className="w-12 h-1 bg-zinc-200"></div>
  </div>
);

async function ProductsList({ lang, settings }: { lang: string, settings: any }) {
  const supabase = await createClient();
  const { data: productsData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  
  const products = (productsData || []).map(p => ({
    ...p,
    imageUrl: p.image_url,
    isFeatured: p.is_featured,
    isNewArrival: p.is_new_arrival,
    createdAt: p.created_at
  })) as Product[];

  if (products.length === 0) return (
    <div className="bg-white py-24 text-center border-t border-zinc-100">
       <p className="text-zinc-500 italic text-sm">Add your first products in the dashboard to see them featured here.</p>
    </div>
  );

  return <FeaturedProducts products={products} lang={lang} settings={settings} />;
}

async function CollectionsWrapper({ lang, settings, categories }: { lang: string, settings: any, categories: Category[] }) {
  if (categories.length === 0) return null;
  return <CollectionList categories={categories} lang={lang} settings={settings} />;
}

export default async function StorefrontPage() {
  const supabase = await createClient();
  const settings = await getSettings();

  // Fetch only what's needed for the Hero LCP immediately
  const categoriesRes = await supabase.from('categories').select('*').order('name');

  const categories = (categoriesRes.data || []).map(c => ({
    ...c,
    imageUrl: c.image_url,
    isFeatured: c.is_featured,
    showInHero: c.show_in_hero
  })) as Category[];

  const lang = 'en'; 

  return (
    <div className="w-full bg-white">
      {/* 
        HERO SECTION (High Priority - Rendered Immediately) 
      */}
      {categories.length > 0 ? (
        <HeroSlider categories={categories} lang={lang} settings={settings} />
      ) : (
        <section className="h-[60vh] flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
          <h2 className="text-4xl font-sans font-black text-brand-ink mb-4 tracking-tight">Welcome to {settings.storeName?.[lang] || 'Mavren Shop'}</h2>
          <p className="text-brand-muted max-w-md mx-auto mb-8">We are currently setting up our collections. Please check back shortly for our premium Scandinavian designs.</p>
          <div className="w-12 h-1 bg-brand-ink"></div>
        </section>
      )}

      {/* 
        STREAMED SECTIONS (Low Priority - Non-blocking)
      */}

      <Suspense fallback={<SectionSkeleton />}>
        <CollectionsWrapper lang={lang} settings={settings} categories={categories} />
      </Suspense>
      
      <Suspense fallback={<SectionSkeleton />}>
        <FutureSections lang={lang} settings={settings} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <ProductsList lang={lang} settings={settings} />
      </Suspense>
      
      <NewsletterSection settings={settings} lang={lang} />
    </div>
  );
}
