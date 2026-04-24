import React, { Suspense } from 'react';
import { createClient } from '@/utils/supabase/server';
import { Product } from '@/store/useCartStore';
import { Category } from '@/types';
import { getSettings } from '@/lib/data';
import type { StorefrontSettings } from '@/store/useSettingsStore';
import { HeroSlider } from '@/components/HeroSlider';
import { FeaturedProducts } from '@/components/storefront/FeaturedProducts';
import dynamic from 'next/dynamic';
import { getServerLocale } from '@/lib/server-locale';

const FutureSections = dynamic(() => import('@/components/storefront/FutureSections').then(mod => mod.FutureSections), { ssr: true });
const CollectionList = dynamic(() => import('@/components/storefront/CollectionList').then(mod => mod.CollectionList), { ssr: true });
const NewsletterSection = dynamic(() => import('@/components/storefront/NewsletterSection').then(mod => mod.NewsletterSection), { ssr: true });

export async function generateMetadata() {
  const settings = await getSettings();
  const lang = await getServerLocale();
  
  const title = settings.seoTitle?.[lang] || settings.seoTitle?.['en'] || (settings.storeName?.[lang] || 'Vinthem');
  const description = settings.seoDescription?.[lang] || settings.seoDescription?.['en'] || "";
  const ogImage = settings.seoImage || '/og-image.jpg';

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [ogImage],
    },
  };
}


// high-performance skeletons
const SectionSkeleton = () => (
  <div className="w-full h-[400px] bg-zinc-50 animate-pulse flex items-center justify-center">
    <div className="w-12 h-1 bg-zinc-200"></div>
  </div>
);

const PUBLIC_PRODUCT_STATUS_FILTER = 'status.eq.published,status.eq.active,status.is.null';

type FeaturedProductRow = {
  id: string;
  title: string;
  price: number;
  image_url?: string | null;
  is_featured?: boolean | null;
  is_new_arrival?: boolean | null;
  created_at?: string | null;
  status?: string | null;
};

async function ProductsList({ lang, settings }: { lang: string, settings: StorefrontSettings }) {
  const supabase = await createClient();
  
  let query = supabase.from('products').select('*');
  
  if (settings.featuredCategoryId) {
    query = query.eq('category_id', settings.featuredCategoryId);
  } else {
    query = query.eq('is_featured', true);
  }

  const { data: productsData } = await query
    .or(PUBLIC_PRODUCT_STATUS_FILTER)
    .limit(4)
    .order('created_at', { ascending: false });
  
  const products = ((productsData ?? []) as FeaturedProductRow[])
    .filter((product) => Boolean(product.id))
    .map((product) => ({
      ...product,
      imageUrl: product.image_url,
      isFeatured: product.is_featured,
      isNewArrival: product.is_new_arrival,
      createdAt: product.created_at,
    })) as Product[];

  if (products.length === 0) return null; // Simplified: Don't show anything if no featured items

  return <FeaturedProducts products={products} lang={lang} settings={settings} />;
}

async function CollectionsWrapper({ lang, settings, categories }: { lang: string, settings: StorefrontSettings, categories: Category[] }) {
  if (categories.length === 0) return null;
  return <CollectionList categories={categories} lang={lang} settings={settings} />;
}

export default async function StorefrontPage() {
  const supabase = await createClient();
  const settings = await getSettings();
  const lang = await getServerLocale();

  // Fetch only what's needed for the Hero LCP immediately
  const categoriesRes = await supabase.from('categories').select('*').order('name');

  const categories = (categoriesRes.data || []).map(c => ({
    ...c,
    imageUrl: c.image_url,
    isFeatured: c.is_featured,
    showInHero: c.show_in_hero
  })) as Category[];

  return (
    <div className="w-full bg-white">
      {/* 
        HERO SECTION (High Priority - Rendered Immediately) 
      */}
      {categories.length > 0 ? (
        <HeroSlider categories={categories} lang={lang} settings={settings} />
      ) : (
        <section className="h-[60vh] flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
          <h2 className="text-4xl font-sans font-black text-brand-ink mb-4 tracking-tight">Welcome to {settings.storeName?.[lang] || 'Vinthem'}</h2>
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
