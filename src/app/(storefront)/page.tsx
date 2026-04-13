import React from 'react';
import { createClient } from '@/utils/supabase/server';
import StorefrontClient from './StorefrontClient';
import { Product } from '@/store/useCartStore';
import { Category } from '@/types';

export default async function StorefrontPage() {
  const supabase = await createClient();

  // Fetch products and categories on the server
  const [productsRes, categoriesRes] = await Promise.all([
    supabase
      .from('products')
      .select('*, imageUrl:image_url, isFeatured:is_featured, createdAt:created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('*, imageUrl:image_url, isFeatured:is_featured, showInHero:show_in_hero')
      .order('name')
  ]);

  const products = (productsRes.data || []) as Product[];
  const categories = (categoriesRes.data || []) as Category[];

  // If there are errors, we could log them here
  if (productsRes.error) console.error("Error fetching products:", productsRes.error);
  if (categoriesRes.error) console.error("Error fetching categories:", categoriesRes.error);

  return (
    <StorefrontClient 
      initialProducts={products} 
      initialCategories={categories} 
    />
  );
}
