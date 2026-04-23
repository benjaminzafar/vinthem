import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { ProductClient } from '@/components/product/ProductClient';
import { Product } from '@/store/useCartStore';
import { Category } from '@/types';
import { getSettings } from '@/lib/data';
import type { StorefrontSettings } from '@/store/useSettingsStore';

const PUBLIC_PRODUCT_STATUS_FILTER = 'status.eq.published,status.eq.active,status.is.null';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from('products')
    .select('title, description')
    .eq('id', id)
    .single();

  if (!product) return { title: 'Product Not Found' };

  return {
    title: `${product.title} | Vinthem`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const settings = (await getSettings()) as Partial<StorefrontSettings>;

  // Fetch product with cleaned up naming for frontend
  const { data: productData, error } = await supabase
    .from('products')
    .select('*, imageUrl:image_url, additionalImages:additional_images, isFeatured:is_featured, categoryId:category_id, createdAt:created_at, prices, stripe_tax_code, categories(name)')
    .eq('id', id)
    .or(PUBLIC_PRODUCT_STATUS_FILTER)
    .single();

  if (error || !productData) {
    notFound();
  }

  const product = {
    ...productData,
    categoryName: productData.categories?.name
  } as unknown as Product;

  // Fetch related products
  const { data: relatedData } = await supabase
    .from('products')
    .select('*, imageUrl:image_url, additionalImages:additional_images, isFeatured:is_featured, categoryId:category_id, createdAt:created_at, prices, stripe_tax_code, categories(name)')
    .eq('category_id', product.categoryId)
    .neq('id', product.id)
    .or(PUBLIC_PRODUCT_STATUS_FILTER)
    .limit(4);

  let relatedProducts = (relatedData || []).map((p) => ({
    ...p,
    categoryName: p.categories?.name
  })) as unknown as Product[];

  if (relatedProducts.length === 0) {
    const { data: fallbackData } = await supabase
      .from('products')
      .select('*, imageUrl:image_url, additionalImages:additional_images, isFeatured:is_featured, categoryId:category_id, createdAt:created_at, prices, stripe_tax_code, categories(name)')
      .neq('id', product.id)
      .or(PUBLIC_PRODUCT_STATUS_FILTER)
      .limit(4);
    relatedProducts = (fallbackData || []).map((p) => ({
      ...p,
      categoryName: p.categories?.name
    })) as unknown as Product[];
  }

  // Fetch all categories for the universal filter drawer
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('*, imageUrl:image_url, iconUrl:icon_url, parentId:parent_id, pinnedInSearch:pinned_in_search')
    .order('name');

  const categories = (categoriesData || []).map(cat => ({
    ...cat,
    imageUrl: cat.image_url,
    iconUrl: cat.icon_url,
    parentId: cat.parent_id,
    pinnedInSearch: cat.pinned_in_search
  }));

  return (
    <div className="animate-in fade-in duration-700">
      <ProductClient 
        initialProduct={product} 
        relatedProducts={relatedProducts} 
        categories={categories as unknown as Category[]}
        initialSettings={settings}
      />
    </div>
  );
}
