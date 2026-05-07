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

async function hasUserPurchasedProduct(userId: string, productId: string, userEmail?: string | null) {
  const adminSupabase = createAdminClient();
  
  // 1. Fetch orders where user_id matches OR customer_email matches (for guest checkouts)
  let query = adminSupabase
    .from('orders')
    .select('items, status, user_id, customer_email');
    
  if (userEmail) {
    query = query.or(`user_id.eq.${userId},customer_email.eq.${userEmail}`);
  } else {
    query = query.eq('user_id', userId);
  }

  const { data: orders, error: ordersError } = await query;

  if (ordersError) {
    logger.error('[Reviews] Error fetching orders for purchase check:', ordersError);
    throw ordersError;
  }

  if (!orders || orders.length === 0) {
    return false;
  }

  // 2. Check if any non-cancelled order contains the target product
  return orders.some((order) => {
    // Only allow reviews for orders that are not cancelled
    if (order.status === 'Cancelled') return false;
    
    if (!Array.isArray(order.items)) return false;

    return order.items.some((item: any) => {
      // Robust ID check: handle 'id', 'product_id', and ensure string comparison
      const itemId = String(item.id || item.product_id || '').trim();
      const targetId = String(productId || '').trim();
      
      return itemId !== '' && itemId === targetId;
    });
  });
}

export async function checkPurchasedProductAction(productId: string): Promise<{ purchased: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: authData, error: userError } = await supabase.auth.getUser();
    const user = authData?.user;

    if (userError) {
      throw userError;
    }

    if (!user) {
      return { purchased: false };
    }

    return {
      purchased: await hasUserPurchasedProduct(user.id, productId.trim(), user.email),
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

    const hasPurchased = await hasUserPurchasedProduct(user.id, productId, user.email);

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

