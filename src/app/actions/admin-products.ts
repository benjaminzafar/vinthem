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

    // Fetch product to get media URLs for cleanup
    const { data: product } = await supabase
      .from('products')
      .select('image_url, additional_images')
      .eq('id', productId)
      .single();

    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      throw error;
    }

    // Background cleanup of media files to avoid "unused data"
    if (product) {
      const { deleteMediaFromStorage, bulkDeleteMediaFromStorage } = await import('@/lib/storage-cleanup');
      void deleteMediaFromStorage(product.image_url);
      if (product.additional_images?.length) {
        void bulkDeleteMediaFromStorage(product.additional_images);
      }
    }

    revalidatePath('/', 'layout');

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
    const cleanedProducts = products.map((p, index) => {
      const title = p.title?.trim() || 'Untitled Product';
      const sku = p.sku?.trim() || `SKU-${Date.now()}-${index}-${Math.random().toString(36).substring(7)}`;
      
      return {
        title,
        sku,
        description: p.description?.trim() || null,
        price: parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 0,
        stock: parseInt(String(p.stock).replace(/[^0-9]/g, '')) || 0,
        category_id: (p.category_id || p.categoryId)?.trim() || null,
        image_url: (p.image_url || p.imageUrl)?.trim() || null,
        is_featured: String(p.is_featured).toLowerCase() === 'true' || p.isFeatured === true,
        is_new: String(p.is_new).toLowerCase() === 'true' || p.isNew === true,
        is_sale: String(p.is_sale).toLowerCase() === 'true' || p.isSale === true,
        sale_price: p.sale_price ? parseFloat(String(p.sale_price).replace(/[^0-9.]/g, '')) : null,
      };
    });

    // Check for duplicate SKUs within the import set itself
    const seenSkus = new Set();
    const finalProducts: any[] = [];
    for (const prod of cleanedProducts) {
      if (!seenSkus.has(prod.sku)) {
        seenSkus.add(prod.sku);
        finalProducts.push(prod);
      } else {
        logger.warn(`[bulkImportProductsAction] Skipping duplicate SKU in import set: ${prod.sku}`);
      }
    }

    // Perform bulk upsert based on SKU
    const { error } = await supabase
      .from('products')
      .upsert(finalProducts, { onConflict: 'sku' });

    if (error) {
      logger.error('[bulkImportProductsAction] Database Error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    revalidatePath('/', 'layout');

    return {
      success: true,
      message: `Successfully imported ${finalProducts.length} products.`,
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
