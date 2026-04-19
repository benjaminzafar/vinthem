import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { getStripeCredentials } from '@/lib/stripe-server';
import { createAdminClient } from '@/utils/supabase/server';

type CheckoutSessionWithPresentment = Stripe.Checkout.Session & {
  presentment_details?: {
    presentment_amount?: number;
    presentment_currency?: string;
  };
};

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 });
  }

  const body = await req.text();

  try {
    const { secretKey, webhookSecret } = await getStripeCredentials();

    if (!secretKey || !webhookSecret) {
      throw new Error('Stripe webhook is not configured.');
    }

    const stripe = new Stripe(secretKey);
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    const adminClient = createAdminClient();

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as CheckoutSessionWithPresentment;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        await adminClient
          .from('orders')
          .update({
            status: session.payment_status === 'paid' ? 'Processing' : 'Pending',
            payment_method: 'Stripe Checkout',
            payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
            total: typeof session.amount_total === 'number' ? session.amount_total / 100 : null,
            shipping_cost: typeof session.total_details?.amount_shipping === 'number'
              ? session.total_details.amount_shipping / 100
              : null,
            presentment_currency: session.presentment_details?.presentment_currency ?? null,
            presentment_total: typeof session.presentment_details?.presentment_amount === 'number'
              ? session.presentment_details.presentment_amount / 100
              : null,
            tax_amount: typeof session.total_details?.amount_tax === 'number'
              ? session.total_details.amount_tax / 100
              : null,
          })
          .eq('id', orderId);
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        await adminClient
          .from('orders')
          .update({ status: 'Cancelled' })
          .eq('id', orderId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Stripe webhook failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
