"use server";

import { createAdminClient, createClient } from '@/utils/supabase/server';

import { revalidatePath } from 'next/cache';
import { requireAdminUser } from '@/lib/admin';

export type ProductVariantInput = {
  options: Record<string, string>;
  price: number;
  stock: number;
  sku: string;
  imageUrl?: string;
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
  stripeTaxCode?: string;
  translations?: Record<string, unknown>;
};

function sanitizeText(value: string | undefined, maxLength = 500): string | undefined {
  if (typeof value !== 'string') {
    return value;
  }

  return value.replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function sanitizeTags(tags: string[] | undefined): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .map((tag) => sanitizeText(tag, 60))
    .filter((tag): tag is string => Boolean(tag));
}

export async function saveProductAction(input: SaveProductInput) {
  await requireAdminUser();
  // We use createAdminClient() to bypass RLS for administrative writes.
  const supabase = createAdminClient();




  const productData = {
    title: sanitizeText(input.title, 200),
    description: sanitizeText(input.description, 5000),
    price: Number(input.price) || 0,
    stock: Number(input.stock) || 0,
    sku: sanitizeText(input.sku, 120),
    image_url: sanitizeText(input.imageUrl, 1000),
    category_id: input.categoryId || null,
    options: input.options || [],
    variants: (input.variants || []).map((variant) => ({
      ...variant,
      image_url: sanitizeText(variant.imageUrl || (variant as any).image_url, 1000) || '',
    })),
    tags: sanitizeTags(input.tags),
    is_featured: input.isFeatured || false,
    is_new: input.isNewArrival || false,
    is_sale: input.isSale || false,
    sale_price: Number(input.discountPrice) || 0,
    status: input.status,
    additional_images: (input.additionalImages || []).map((image) => sanitizeText(image, 1000)).filter(Boolean),
    weight: Number(input.weight) || 0,
    shipping_class: sanitizeText(input.shippingClass, 80) || '',
    prices: {},
    stripe_tax_code: sanitizeText(input.stripeTaxCode, 40) || null,
    translations: input.translations || {}
  };

  try {
    if (!productData.title) {
      throw new Error('Product title is required.');
    }

    if (productData.price <= 0) {
      throw new Error('Valid product price is required.');
    }

    if (input.id) {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      revalidatePath('/admin');
      revalidatePath('/admin/products');
      revalidatePath(`/admin/products/${input.id}`);
      return { success: true, data };
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;
      revalidatePath('/admin');
      revalidatePath('/admin/products');
      return { success: true, data };
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in saveProductAction:', err);
    return { 
      success: false, 
      error: err?.message || 'Failed to save product.' 
    };
  }

}
