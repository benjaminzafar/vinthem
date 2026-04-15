import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';
import { decrypt } from '@/lib/encryption';

const SHIPPING_RATES: Record<string, number> = {
  SE: 49,
  FI: 59,
  DK: 59,
  NO: 79,
};

const COUNTRY_CURRENCY: Record<string, 'sek' | 'eur' | 'dkk'> = {
  SE: 'sek',
  FI: 'eur',
  DK: 'dkk',
};

export async function POST(req: NextRequest) {
  try {
    const { items, shippingDetails } = await req.json();
    const validatedItems: Array<{
      id: string;
      title: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }> = [];

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // 1. Sanitize shipping input — prevent XSS on write
    const sanitizedShipping = {
      name: shippingDetails?.name?.replace(/[<>]/g, '') || '',
      email: shippingDetails?.email?.replace(/[<>]/g, '') || '',
      address: shippingDetails?.address?.replace(/[<>]/g, '') || '',
      city: shippingDetails?.city?.replace(/[<>]/g, '') || '',
      postalCode: shippingDetails?.postalCode?.replace(/[<>]/g, '') || '',
      country: shippingDetails?.country?.replace(/[<>]/g, '') || 'SE',
    };

    const adminClient = createAdminClient();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Validate prices from the backend — never trust client-side prices
    let validatedSubtotal = 0;

    for (const item of items) {
      const { data: productData, error: productError } = await adminClient
        .from('products')
        .select('id, title, price, sale_price, is_sale')
        .eq('id', item.id)
        .single();

      if (productError || !productData) {
        return NextResponse.json({ error: `Product not found: ${item.id}` }, { status: 404 });
      }

      const actualPrice =
        productData.is_sale && productData.sale_price
          ? Number(productData.sale_price)
          : Number(productData.price);

      const safeQuantity = Math.max(1, parseInt(item.quantity) || 1);
      validatedSubtotal += actualPrice * safeQuantity;

      validatedItems.push({
        id: item.id,
        title: productData.title,
        quantity: safeQuantity,
        unitPrice: actualPrice,
        subtotal: actualPrice * safeQuantity,
      });
    }

    const shippingCountry = sanitizedShipping.country.toUpperCase();
    const safeShippingCost = SHIPPING_RATES[shippingCountry] ?? SHIPPING_RATES.SE;
    const orderCurrency = COUNTRY_CURRENCY[shippingCountry] ?? 'sek';
    const finalTotal = validatedSubtotal + safeShippingCost;

    // 3. Create order on backend only — never from client
    const { data: orderData, error: orderError } = await adminClient
      .from('orders')
      .insert({
        user_id: user?.id ?? null,
        items: validatedItems,
        shipping_details: sanitizedShipping,
        shipping_cost: safeShippingCost,
        subtotal: validatedSubtotal,
        total: finalTotal,
        currency: orderCurrency,
        status: 'Pending',
      })
      .select('id')
      .single();

    if (orderError || !orderData) {
      throw orderError || new Error('Failed to create order');
    }

    const orderId = orderData.id;

    // 4. Fetch encrypted Stripe key from integrations table
    const { data: integrationRow } = await adminClient
      .from('integrations')
      .select('value')
      .eq('key', 'STRIPE_SECRET_KEY')
      .single();

    let stripeSecret = '';
    if (integrationRow?.value) {
      try {
        stripeSecret = decrypt(integrationRow.value);
      } catch (decryptError: unknown) {
        const message = decryptError instanceof Error ? decryptError.message : 'Unknown decryption failure';
        console.error('Failed to decrypt Stripe key during checkout:', message);
      }
    }

    // 5. Create Stripe payment intent if key is available
    if (stripeSecret) {
      const stripe = new Stripe(stripeSecret, {
        // Stripe uses the account default version if not specified, avoiding type conflicts
      });

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(finalTotal * 100),
        currency: orderCurrency,
        metadata: { orderId },
      });

      await adminClient
        .from('orders')
        .update({ payment_intent_id: paymentIntent.id })
        .eq('id', orderId);

      return NextResponse.json({ clientSecret: paymentIntent.client_secret, orderId });
    }

    return NextResponse.json({ mock: true, orderId });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create order';
    console.error('Order creation error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
