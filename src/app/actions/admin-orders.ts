'use server';
﻿import { logger } from '@/lib/logger';

import { revalidatePath } from 'next/cache';

import { requireAdminUser } from '@/lib/admin';

type OrderUpdateInput = {
  orderId: string;
  status?: string;
  trackingCarrier?: string;
  trackingNumber?: string;
};

type OrderActionResult = {
  success: boolean;
  message: string;
  error?: string;
};

function sanitizeOptionalText(value: string | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  const sanitized = value.replace(/[<>]/g, '').trim();
  return sanitized.length > 0 ? sanitized : null;
}

export async function updateOrderAction(input: OrderUpdateInput): Promise<OrderActionResult> {
  try {
    const { supabase } = await requireAdminUser();

    if (!input.orderId) {
      throw new Error('Order ID is required.');
    }

    const updates: Record<string, string | null> = {};
    const sanitizedStatus = sanitizeOptionalText(input.status);
    const sanitizedTrackingCarrier = sanitizeOptionalText(input.trackingCarrier);
    const sanitizedTrackingNumber = sanitizeOptionalText(input.trackingNumber);

    if (sanitizedStatus !== undefined) {
      updates.status = sanitizedStatus ?? 'Pending';
    }

    if (Object.keys(updates).length === 0) {
      if (sanitizedTrackingCarrier !== undefined || sanitizedTrackingNumber !== undefined) {
        throw new Error('Tracking fields are not available in the current order schema yet.');
      }

      throw new Error('No order changes were provided.');
    }

    const { error } = await supabase.from('orders').update(updates).eq('id', input.orderId);
    if (error) {
      throw error;
    }

    revalidatePath('/admin/orders');

    return {
      success: true,
      message: 'Order updated successfully.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update order.';
    logger.error('[Action Error] updateOrderAction:', error);
    return {
      success: false,
      message,
      error: message,
    };
  }
}

