import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { startCheckout } from '@/lib/checkout-server';

export async function POST(req: NextRequest) {
  try {
    const { items, shippingDetails, locale } = await req.json() as {
      items: Array<{ id: string; quantity: number }>;
      shippingDetails?: Record<string, string>;
      locale?: string;
    };

    const result = await startCheckout(items, shippingDetails, locale);
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create order.';
    logger.error('Order creation error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

