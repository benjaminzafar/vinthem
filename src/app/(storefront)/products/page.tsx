import React from 'react';
import { createClient } from '@/utils/supabase/server';
import ProductsClient from './ProductsClient';
import { Product } from '@/store/useCartStore';
import { Category } from '@/types';

interface ProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const activeCategory = (params.category as string) || 'All';
  const searchQuery = (params.search as string) || '';
  const sortBy = (params.sort as string) || 'newest';

  const supabase = await createClient();

  // Build the product query on the server
  let productQuery = supabase
    .from('products')
    .select('*, imageUrl:image_url, isFeatured:is_featured, createdAt:created_at');

  if (activeCategory !== 'All') {
    productQuery = productQuery.eq('category_name', activeCategory);
  }

  if (searchQuery) {
    productQuery = productQuery.ilike('title', `%${searchQuery}%`);
  }

  if (sortBy === 'price-asc') {
    productQuery = productQuery.order('price', { ascending: true });
  } else if (sortBy === 'price-desc') {
    productQuery = productQuery.order('price', { ascending: false });
  } else {
    productQuery = productQuery.order('created_at', { ascending: false });
  }

  const [productsRes, categoriesRes] = await Promise.all([
    productQuery,
    supabase
      .from('categories')
      .select('*, imageUrl:image_url, isFeatured:is_featured, iconUrl:icon_url, parentId:parent_id')
      .order('name', { ascending: true })
  ]);

  const products = (productsRes.data || []) as Product[];
  const categories = (categoriesRes.data || []) as Category[];

  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-ink"></div>
      </div>
    }>
      <ProductsClient 
        initialProducts={products} 
        initialCategories={categories} 
      />
    </React.Suspense>
  );
}
