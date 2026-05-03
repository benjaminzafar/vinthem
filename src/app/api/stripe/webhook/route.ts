import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { getStripeCredentials } from '@/lib/stripe-server';
import { createAdminClient } from '@/utils/supabase/server';
import { sendTransactionalEmail, syncContactToBrevo } from '@/lib/brevo';
import { logger } from '@/lib/logger';

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
            customer_email: session.customer_details?.email ?? null,
            customer_details: {
              name: (session as any).shipping_details?.name || session.customer_details?.name || 'Customer',
              email: session.customer_details?.email ?? null,
              address: {
                line1: (session as any).shipping_details?.address?.line1 ?? null,
                line2: (session as any).shipping_details?.address?.line2 ?? null,
                city: (session as any).shipping_details?.address?.city ?? null,
                state: (session as any).shipping_details?.address?.state ?? null,
                postal_code: (session as any).shipping_details?.address?.postal_code ?? null,
                country: (session as any).shipping_details?.address?.country ?? null,
              }
            },
            payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
            total: typeof session.amount_total === 'number' ? session.amount_total / 100 : null,
          })
          .eq('id', orderId);

        // --- NEW: Brevo Integration ---
        const customerEmail = session.customer_details?.email;
        const customerName = session.customer_details?.name || 'Customer';

        if (customerEmail && session.payment_status === 'paid') {
          // 1. Sync Customer to Brevo Contacts
          syncContactToBrevo(customerEmail, { 
            FIRSTNAME: customerName.split(' ')[0], 
            LASTNAME: customerName.split(' ').slice(1).join(' ') 
          }).catch(err => logger.error('Async Brevo Contact Sync Error:', err));

          // 2. Send Checkout Confirmation Email
          sendTransactionalEmail({
            to: [{ email: customerEmail, name: customerName }],
            subject: `Order Confirmation #${orderId}`,
            htmlContent: `
              <h1>Thank you for your purchase!</h1>
              <p>Hello ${customerName},</p>
              <p>Your order <strong>#${orderId}</strong> is being processed.</p>
              <p>Total amount: ${typeof session.amount_total === 'number' ? (session.amount_total / 100).toFixed(2) : '0.00'} ${session.currency?.toUpperCase()}</p>
            `,
            params: {
              orderId,
              total: session.amount_total ? session.amount_total / 100 : 0
            }
          }).catch(err => logger.error('Async Brevo Email Error:', err));
        }
        // ------------------------------
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
