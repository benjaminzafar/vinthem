import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';
import { decrypt } from '@/lib/encryption';

export async function POST(req: NextRequest) {
  try {
    const { items, shippingDetails, shippingCost, userId, currency } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // 1. Sanitize input parameters to prevent basic NoSQL injection / XSS on write
    const sanitizedShipping = {
      name: shippingDetails?.name?.replace(/[<>]/g, '') || '',
      email: shippingDetails?.email?.replace(/[<>]/g, '') || '',
      address: shippingDetails?.address?.replace(/[<>]/g, '') || '',
      city: shippingDetails?.city?.replace(/[<>]/g, '') || '',
      postalCode: shippingDetails?.postalCode?.replace(/[<>]/g, '') || '',
      country: shippingDetails?.country?.replace(/[<>]/g, '') || 'SE',
    };

    // 2. Safely verify prices by querying Firestore Backend 
    // "Price calculation always happens on the backend using Firestore prices"
    let validatedSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const productRef = adminDb.collection('products').doc(item.id);
      const productDoc = await productRef.get();
      
      if (!productDoc.exists) {
        return NextResponse.json({ error: `Product not found: ${item.id}` }, { status: 404 });
      }
      
      const productData = productDoc.data();
      const productBasePrice = productData?.price || 0;
      const productMultiCurrencyPrices = productData?.prices || {};

      const safeCurrency = String(currency || 'sek').toLowerCase();
      // Use exact backend price dict lookup or fallback
      const actualPrice = productMultiCurrencyPrices[safeCurrency] || (productBasePrice * (safeCurrency === 'sek' ? 1 : 0.1));
      
      const safeQuantity = Math.max(1, parseInt(item.quantity) || 1);

      validatedSubtotal += (actualPrice * safeQuantity);
      validatedItems.push({
        id: item.id,
        title: productData?.title || item.title,
        quantity: safeQuantity,
        unitPrice: actualPrice,
        subtotal: actualPrice * safeQuantity,
      });
    }

    const safeShippingCost = parseFloat(String(shippingCost)) || 0;
    const finalTotal = validatedSubtotal + safeShippingCost;

    // 3. Save order using Firebase Admin (Server Side)
    // "Order creation is only allowed through the backend, never from the client"
    const orderRef = adminDb.collection('orders').doc();
    const orderData = {
      userId: userId || null,
      items: validatedItems,
      shippingDetails: sanitizedShipping,
      shippingCost: safeShippingCost,
      subtotal: validatedSubtotal,
      total: finalTotal,
      currency: currency || 'sek',
      status: 'Pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await orderRef.set(orderData);

    // 4. Securely fetch Stripe Secret Key from integration settings
    const stripeDoc = await adminDb.collection('integrations').doc('STRIPE_SECRET_KEY').get();
    let stripeSecret = '';
    
    if (stripeDoc.exists) {
      const encryptedValue = stripeDoc.data()?.value;
      if (encryptedValue) {
        try {
           stripeSecret = decrypt(encryptedValue);
        } catch (e) {
           console.error("Failed to decrypt Stripe key during checkout");
        }
      }
    }

    // 5. Connect to Stripe
    if (stripeSecret) {
      const stripe = new Stripe(stripeSecret, {
        apiVersion: '2024-12-18.acacia' as any,
      });

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(finalTotal * 100), // Stripe takes lowest denominator
        currency: currency || 'sek',
        metadata: {
          orderId: orderRef.id,
        },
      });

      // Link payment intent to order
      await orderRef.update({
        paymentIntentId: paymentIntent.id
      });

      return NextResponse.json({ clientSecret: paymentIntent.client_secret, orderId: orderRef.id });
    }

    // If Stripe is not configured, fall back to mock checkout
    return NextResponse.json({ mock: true, orderId: orderRef.id });

  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
