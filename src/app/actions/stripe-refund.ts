'use server';

import Stripe from 'stripe';
import { createAdminClient } from '@/utils/supabase/server';
import { requireAdminUser } from '@/lib/admin';
import { logger } from '@/lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15' as any,
});

export async function createStripeRefundAction(orderId: string, amount?: number) {
  try {
    await requireAdminUser();
    const supabase = createAdminClient();

    // 1. Fetch Order to get PaymentIntent ID
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, payment_intent_id, total')
      .eq('id', orderId)
      .single();

    if (orderError || !order?.payment_intent_id) {
      throw new Error('Order or Payment Intent not found.');
    }

    // 2. Execute Refund via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.payment_intent_id,
      amount: amount ? Math.round(amount * 100) : undefined, // Amount in cents
    });

    logger.info(`[Stripe Refund] Success for Order ${orderId}: ${refund.id}`);

    return {
      success: true,
      message: 'Financial refund processed successfully via Stripe.',
      refundId: refund.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Stripe communication failure';
    logger.error('[Stripe Refund Error]:', error);
    return {
      success: false,
      message: errorMessage,
    };
  }
}
