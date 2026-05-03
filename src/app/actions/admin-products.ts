'use server';
﻿import { logger } from '@/lib/logger';

import { revalidatePath } from 'next/cache';

import { requireAdminUser } from '@/lib/admin';

type ProductActionResult = {
  success: boolean;
  message: string;
  error?: string;
};

export async function deleteProductAction(productId: string): Promise<ProductActionResult> {
  try {
    const { supabase } = await requireAdminUser();

    if (!productId) {
      throw new Error('Product ID is required.');
    }

    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      throw error;
    }

    revalidatePath('/admin/products');
    revalidatePath('/products');

    return {
      success: true,
      message: 'Product deleted successfully.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete product.';
    logger.error('[Action Error] deleteProductAction:', error);
    return {
      success: false,
      message,
      error: message,
    };
  }
}

export async function bulkImportProductsAction(products: any[]): Promise<ProductActionResult> {
  try {
    const { supabase } = await requireAdminUser();

    if (!products || products.length === 0) {
      throw new Error('No products provided for import.');
    }

    // Clean and validate data before insertion
    const cleanedProducts = products.map((p) => ({
      title: p.title?.trim() || 'Untitled Product',
      description: p.description?.trim() || null,
      price: parseFloat(p.price) || 0,
      stock: parseInt(p.stock) || 0,
      sku: p.sku?.trim() || `SKU-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      category_id: p.category_id || p.categoryId || null,
      image_url: p.image_url || p.imageUrl || null,
      is_featured: p.is_featured === 'true' || p.isFeatured === true || false,
      is_new: p.is_new === 'true' || p.isNew === true || false,
      is_sale: p.is_sale === 'true' || p.isSale === true || false,
      sale_price: p.sale_price ? parseFloat(p.sale_price) : null,
    }));

    // Perform bulk upsert based on SKU
    const { error } = await supabase
      .from('products')
      .upsert(cleanedProducts, { onConflict: 'sku' });

    if (error) {
      throw error;
    }

    revalidatePath('/admin/products');
    revalidatePath('/products');

    return {
      success: true,
      message: `Successfully imported ${cleanedProducts.length} products.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import products.';
    logger.error('[Action Error] bulkImportProductsAction:', error);
    return {
      success: false,
      message,
      error: message,
    };
  }
}
