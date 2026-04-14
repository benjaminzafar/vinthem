import React from 'react';
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

export default async function StorefrontPage() {
  const supabase = await createClient();
  const settings = await getSettings();

  // Fetch products and categories on the server
  const [productsRes, categoriesRes] = await Promise.all([
    supabase.from('products').select('*').order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('name')
  ]);

  const products = (productsRes.data || []).map(p => ({
    ...p,
    imageUrl: p.image_url,
    isFeatured: p.is_featured,
    isNewArrival: p.is_new_arrival,
    createdAt: p.created_at
  })) as Product[];

  const categories = (categoriesRes.data || []).map(c => ({
    ...c,
    imageUrl: c.image_url,
    isFeatured: c.is_featured,
    showInHero: c.show_in_hero
  })) as Category[];

  const lang = 'en'; // Default for server render

  if (productsRes.error) console.error('Error fetching products:', productsRes.error);
  if (categoriesRes.error) console.error('Error fetching categories:', categoriesRes.error);

  return (
    <div className="w-full bg-white">
      {categories.length > 0 ? (
        <HeroSlider categories={categories} lang={lang} settings={settings} />
      ) : (
        <section className="h-[60vh] flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
          <h2 className="text-4xl font-sans font-black text-brand-ink mb-4 tracking-tight">Welcome to {settings.storeName?.[lang] || 'Mavren Shop'}</h2>
          <p className="text-brand-muted max-w-md mx-auto mb-8">We are currently setting up our collections. Please check back shortly for our premium Scandinavian designs.</p>
          <div className="w-12 h-1 bg-brand-ink"></div>
        </section>
      )}

      {products.length > 0 ? (
        <FeaturedProducts products={products} lang={lang} settings={settings} />
      ) : null}

      {categories.length > 0 && (
        <CollectionList categories={categories} lang={lang} settings={settings} />
      )}
      
      <FutureSections lang={lang} settings={settings} />

      {products.length === 0 && (
        <div className="bg-white py-24 text-center border-t border-zinc-100">
           <p className="text-zinc-400 italic text-sm">Add your first products in the dashboard to see them featured here.</p>
        </div>
      )}

      <NewsletterSection settings={settings} lang={lang} />
    </div>
  );
}
