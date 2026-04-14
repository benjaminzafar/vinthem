import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { ProductClient } from '@/components/product/ProductClient';
import { Product } from '@/store/useCartStore';

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
    title: `${product.title} | Mavren Shop`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch product with cleaned up naming for frontend
  const { data: productData, error } = await supabase
    .from('products')
    .select('*, imageUrl:image_url, isFeatured:is_featured, categoryId:category_id, createdAt:created_at, categories(name)')
    .eq('id', id)
    .single();

  if (error || !productData) {
    notFound();
  }

  const product = {
    ...(productData as any),
    categoryName: (productData as any).categories?.name
  } as Product;

  // Fetch related products
  const { data: relatedData } = await supabase
    .from('products')
    .select('*, imageUrl:image_url, isFeatured:is_featured, categoryId:category_id, createdAt:created_at, categories(name)')
    .eq('category_id', product.categoryId)
    .neq('id', product.id)
    .limit(4);

  let relatedProducts = (relatedData || []).map((p: any) => ({
    ...p,
    categoryName: p.categories?.name
  })) as Product[];

  if (relatedProducts.length === 0) {
    const { data: fallbackData } = await supabase
      .from('products')
      .select('*, imageUrl:image_url, isFeatured:is_featured, categoryId:category_id, createdAt:created_at, categories(name)')
      .neq('id', product.id)
      .limit(4);
    relatedProducts = (fallbackData || []).map((p: any) => ({
      ...p,
      categoryName: p.categories?.name
    })) as Product[];
  }

  return (
    <div className="animate-in fade-in duration-700">
      <ProductClient initialProduct={product} relatedProducts={relatedProducts} />
    </div>
  );
}
