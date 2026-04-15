"use server";

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export type ProductVariantInput = {
  options: Record<string, string>;
  price: number;
  stock: number;
  sku: string;
};

export type ProductOptionInput = {
  name: string;
  values: string[];
};

export type SaveProductInput = {
  id?: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  sku?: string;
  imageUrl?: string;
  categoryId?: string | null;
  options?: ProductOptionInput[];
  variants?: ProductVariantInput[];
  tags?: string[];
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isSale?: boolean;
  discountPrice?: number;
  status: 'published' | 'draft';
  additionalImages?: string[];
  weight?: number;
  shippingClass?: string;
  translations?: Record<string, any>;
};

export async function saveProductAction(input: SaveProductInput) {
  const supabase = await createClient();

  const productData = {
    title: input.title,
    description: input.description,
    price: input.price,
    stock: input.stock,
    sku: input.sku,
    image_url: input.imageUrl,
    category_id: input.categoryId || null,
    options: input.options || [],
    variants: input.variants || [],
    tags: input.tags || [],
    is_featured: input.isFeatured || false,
    is_new: input.isNewArrival || false,
    is_sale: input.isSale || false,
    sale_price: input.discountPrice || 0,
    status: input.status,
    additional_images: input.additionalImages || [],
    weight: input.weight || 0,
    shipping_class: input.shippingClass || '',
    translations: input.translations || {}
  };

  try {
    if (input.id) {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      revalidatePath('/admin/products');
      return { success: true, data };
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;
      revalidatePath('/admin/products');
      return { success: true, data };
    }
  } catch (error: any) {
    console.error('Error in saveProductAction:', error);
    return { success: false, error: error.message };
  }
}
