"use server";
import { logger } from '@/lib/logger';

import { estimateCheckout, startCheckout, type CheckoutItemInput, type CheckoutShippingInput } from '@/lib/checkout-server';

export async function estimateCheckoutAction(input: {
  items: CheckoutItemInput[];
  shippingDetails?: CheckoutShippingInput;
  locale?: string;
}) {
  try {
    const estimate = await estimateCheckout(input.items, input.shippingDetails, input.locale);
    return { success: true, estimate };
  } catch (error: unknown) {
    logger.error('estimateCheckoutAction failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to estimate checkout.',
    };
  }
}

export async function startCheckoutAction(input: {
  items: CheckoutItemInput[];
  shippingDetails?: CheckoutShippingInput;
  locale?: string;
}) {
  try {
    return await startCheckout(input.items, input.shippingDetails, input.locale);
  } catch (error: unknown) {
    logger.error('startCheckoutAction failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start checkout.',
    };
  }
}

