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

  // 1. Fetch categories first to resolve the active category ID and for the sidebar
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('*, imageUrl:image_url, isFeatured:is_featured, iconUrl:icon_url, parentId:parent_id')
    .order('name', { ascending: true });

  const categories = (categoriesData || []) as Category[];

  // 2. Resolve active category ID (from slug or name)
  let activeCategoryId: string | null = null;
  if (activeCategory !== 'All') {
    // Try to find by slug first (preferred), then name
    const category = categories.find(c => c.slug === activeCategory || c.name === activeCategory);
    if (category) {
      activeCategoryId = category.id!;
    }
  }

  // 3. Build the product query
  let productQuery = supabase
    .from('products')
    .select('*, imageUrl:image_url, isFeatured:is_featured, categoryId:category_id, createdAt:created_at');

  if (activeCategoryId) {
    productQuery = productQuery.eq('category_id', activeCategoryId);
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

  const { data: productsData } = await productQuery;
  const products = (productsData || []).map((p: any) => ({
    ...p,
    categoryName: categories.find(c => c.id === p.category_id)?.name
  })) as Product[];

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
