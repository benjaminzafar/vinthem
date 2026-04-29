'use server';
﻿import { logger } from '@/lib/logger';

import { revalidatePath } from 'next/cache';

import { requireAdminUser } from '@/lib/admin';
import { createAdminClient, createClient } from '@/utils/supabase/server';

type AdminReviewInput = {
  productId: string;
  rating: number;
  comment: string;
};

type ReviewActionResult = {
  success: boolean;
  message: string;
  error?: string;
};

type CustomerReviewInput = {
  productId: string;
  rating: number;
  comment: string;
};

type OrderItem = {
  id: string;
};

function sanitizeReviewComment(value: string): string {
  return value.replace(/[<>]/g, '').trim();
}

async function hasUserPurchasedProduct(userId: string, productId: string) {
  const adminSupabase = createAdminClient();
  const { data: orders, error: ordersError } = await adminSupabase
    .from('orders')
    .select('items')
    .eq('user_id', userId);

  if (ordersError) {
    throw ordersError;
  }

  return (orders ?? []).some((order) =>
    Array.isArray(order.items) &&
    order.items.some((item: OrderItem) => item.id === productId)
  );
}

export async function checkPurchasedProductAction(productId: string): Promise<{ purchased: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return { purchased: false };
    }

    return {
      purchased: await hasUserPurchasedProduct(user.id, productId.trim()),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify purchase history.';
    logger.error('[Action Error] checkPurchasedProductAction:', error);
    return {
      purchased: false,
      error: message,
    };
  }
}

export async function submitProductReviewAction(input: CustomerReviewInput): Promise<ReviewActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error('Authentication required.');
    }

    const productId = input.productId.trim();
    const rating = Math.max(1, Math.min(5, Math.round(input.rating)));
    const comment = sanitizeReviewComment(input.comment);

    if (!productId) {
      throw new Error('Product ID is required.');
    }

    if (!comment) {
      throw new Error('Review comment is required.');
    }

    const hasPurchased = await hasUserPurchasedProduct(user.id, productId);

    if (!hasPurchased) {
      throw new Error('Only customers who purchased this product can leave a review.');
    }

    const { error } = await supabase.from('reviews').insert({
      product_id: productId,
      user_id: user.id,
      user_name: sanitizeReviewComment(user.user_metadata?.full_name || 'Anonymous') || 'Anonymous',
      rating,
      comment,
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    revalidatePath(`/product/${productId}`);
    revalidatePath('/profile');

    return {
      success: true,
      message: 'Review submitted successfully!',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit review.';
    logger.error('[Action Error] submitProductReviewAction:', error);
    return {
      success: false,
      message,
      error: message,
    };
  }
}

export async function createAdminReviewAction(input: AdminReviewInput): Promise<ReviewActionResult> {
  try {
    const { supabase } = await requireAdminUser();

    if (!input.productId) {
      throw new Error('Product ID is required.');
    }

    const rating = Math.max(1, Math.min(5, Math.round(input.rating)));
    const comment = input.comment.replace(/[<>]/g, '').trim();

    if (!comment) {
      throw new Error('Review comment is required.');
    }

    const { error } = await supabase.from('reviews').insert({
      product_id: input.productId,
      user_id: null,
      rating,
      comment,
    });

    if (error) {
      throw error;
    }

    revalidatePath('/admin/customers');
    revalidatePath('/product/[id]');

    return {
      success: true,
      message: 'Fake review generated.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create review.';
    logger.error('[Action Error] createAdminReviewAction:', error);
    return {
      success: false,
      message,
      error: message,
    };
  }
}

