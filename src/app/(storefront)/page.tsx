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

import { CollectionList } from '@/components/storefront/CollectionList';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
const FutureSections = dynamic(() => import('@/components/storefront/FutureSections').then(mod => mod.FutureSections), { ssr: true });
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
  is_new?: boolean | null;
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
      isNewArrival: product.is_new ?? product.is_new_arrival ?? false,
      createdAt: product.created_at,
    })) as Product[];

  if (products.length === 0) return null;

  return (
    <FeaturedProducts 
      products={products} 
      lang={lang} 
      labels={{
        topSubtitle: settings.featuredTopSubtitle?.[lang] || 'Curated Selection',
        title: settings.featuredTitle?.[lang] || 'Featured Pieces'
      }} 
    />
  );
}

async function CollectionsWrapper({ lang, settings, categories }: { lang: string, settings: StorefrontSettings, categories: Category[] }) {
  const featuredCategories = categories.filter(c => c.isFeatured);
  if (featuredCategories.length === 0) return null;
  
  return (
    <CollectionList 
      categories={featuredCategories} 
      lang={lang} 
      labels={{
        topSubtitle: settings.collectionTopSubtitle?.[lang] || 'Curated Catalog',
        title: settings.collectionTitle?.[lang],
        subtitle: settings.collectionSubtitle?.[lang],
        noCollectionsFound: settings.noCollectionsFoundText?.[lang] || 'No collections found'
      }} 
    />
  );
}

export default async function StorefrontPage() {
  const supabase = await createClient();
  const settings = await getSettings();
  const lang = await getServerLocale();

  // Fetch categories once for the whole page
  const { data: categoriesData } = await supabase.from('categories').select('*').order('name');

  const categories = (categoriesData || []).map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    translations: c.translations,
    imageUrl: c.image_url,
    isFeatured: c.is_featured,
    showInHero: c.show_in_hero
  })) as Category[];

  // Filter for Hero explicitly to reduce payload
  const heroCategories = categories.filter(c => c.showInHero);

  return (
    <div className="w-full bg-white">
      {/* 
        HERO SECTION (High Priority - Rendered Immediately) 
      */}
      {heroCategories.length > 0 ? (
        <HeroSlider categories={heroCategories} lang={lang} settings={settings} />
      ) : (
        <section className="h-[60vh] flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
          <h2 className="text-4xl font-sans font-black text-brand-ink mb-4 tracking-tight">Welcome to {settings.storeName?.[lang] || 'Vinthem'}</h2>
          <p className="text-brand-muted max-w-md mx-auto mb-8">We are currently setting up our collections. Please check back shortly for our quality everyday essentials.</p>
          <div className="w-12 h-1 bg-brand-ink"></div>
        </section>
      )}

      {/* 
        MAIN CONTENT SECTIONS with ScrollReveal
      */}
      <ScrollReveal>
        <CollectionsWrapper lang={lang} settings={settings} categories={categories} />
      </ScrollReveal>
      
      <ScrollReveal threshold={0.05}>
        <Suspense fallback={<SectionSkeleton />}>
          <FutureSections lang={lang} settings={settings} />
        </Suspense>
      </ScrollReveal>

      <ScrollReveal threshold={0.05}>
        <Suspense fallback={<SectionSkeleton />}>
          <ProductsList lang={lang} settings={settings} />
        </Suspense>
      </ScrollReveal>

      <ScrollReveal>
        <NewsletterSection settings={settings} lang={lang} />
      </ScrollReveal>
    </div>
  );
}
