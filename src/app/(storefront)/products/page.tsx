import React from 'react';
import { createClient } from '@/utils/supabase/server';
import ProductsClient from './ProductsClient';
import { Product } from '@/store/useCartStore';
import { Category } from '@/types';
import { getSettings } from '@/lib/data';
import type { StorefrontSettings } from '@/store/useSettingsStore';

const PUBLIC_PRODUCT_STATUS_FILTER = 'status.eq.published,status.eq.active,status.is.null';

interface ProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

type ProductRow = {
  id: string;
  title: string;
  price: number;
  image_url?: string | null;
  is_featured?: boolean | null;
  category_id?: string | null;
  created_at?: string | null;
  status?: string | null;
  prices?: Record<string, number> | null;
  stripe_tax_code?: string | null;
};

export async function generateMetadata({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const category = (params.category as string) || 'All';
  const search = (params.search as string) || '';

  const title = search 
    ? `Search: ${search} | Vinthem`
    : category !== 'All' 
      ? `${category} | Vinthem` 
      : 'All Products | Vinthem';

  return {
    title,
    description: `Explore our ${category !== 'All' ? category.toLowerCase() : 'full'} collection of premium Scandinavian interior decor and furniture.`,
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const activeCategory = (params.category as string) || 'All';
  const searchQuery = (params.search as string) || '';
  const sortBy = (params.sort as string) || 'newest';

  const supabase = await createClient();
  const settings = (await getSettings()) as Partial<StorefrontSettings>;

  // 1. Fetch categories first to resolve the active category ID and for the sidebar
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('*, imageUrl:image_url, isFeatured:is_featured, iconUrl:icon_url, parentId:parent_id')
    .order('name', { ascending: true });

  const categories = (categoriesData || []) as Category[];

  // 2. Resolve active category ID and all descendant IDs (recursive)
  const categoryIds: string[] = [];
  if (activeCategory !== 'All') {
    const category = categories.find(c => c.slug === activeCategory || c.name === activeCategory);
    if (category && category.id) {
      // Collect this category + all sub-categories recursively
      const collectIds = (parentId: string) => {
        categoryIds.push(parentId);
        categories
          .filter(c => c.parentId === parentId)
          .forEach(child => collectIds(child.id!));
      };
      collectIds(category.id);
    }
  }

  // 3. Build the product query
  let productQuery = supabase
    .from('products')
    .select('*, imageUrl:image_url, isFeatured:is_featured, categoryId:category_id, createdAt:created_at, prices, stripe_tax_code')
    .or(PUBLIC_PRODUCT_STATUS_FILTER);

  if (categoryIds.length > 0) {
    productQuery = productQuery.in('category_id', categoryIds);
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
  const products = ((productsData ?? []) as ProductRow[])
    .filter((product) => Boolean(product.id))
    .map((product) => ({
      ...product,
      categoryName: categories.find((category) => category.id === product.category_id)?.name,
    })) as Product[];

  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <div className="animate-spin rounded-none h-12 w-12 border-b-2 border-brand-ink"></div>
      </div>
    }>
      <ProductsClient 
        initialProducts={products} 
        initialCategories={categories} 
        initialSettings={settings}
      />
    </React.Suspense>
  );
}
