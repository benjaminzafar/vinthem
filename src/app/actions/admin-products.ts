'use server';

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
    console.error('[Action Error] deleteProductAction:', error);
    return {
      success: false,
      message,
      error: message,
    };
  }
}
