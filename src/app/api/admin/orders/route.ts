import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { requireAdminUser } from '@/lib/admin';
import type { AdminOrder, OrderItem } from '@/types';

type OrderRow = {
  id: string;
  user_id?: string | null;
  items?: OrderItem[];
  total?: number;
  subtotal?: number;
  shipping_cost?: number;
  tax_amount?: number;
  status?: AdminOrder['status'];
  customer_email?: string | null;
  created_at: string;
  order_id?: string;
  trackingCarrier?: string;
  trackingNumber?: string;
};

const ITEMS_PER_PAGE = 50;

function toAdminOrder(row: OrderRow): AdminOrder {
  return {
    id: row.id,
    user_id: row.user_id ?? null,
    items: Array.isArray(row.items) ? row.items : [],
    total: Number(row.total ?? 0),
    subtotal: Number(row.subtotal ?? 0),
    shipping_cost: Number(row.shipping_cost ?? 0),
    tax_amount: Number(row.tax_amount ?? 0),
    status: row.status ?? 'Pending',
    shipping_details: undefined,
    created_at: row.created_at,
    createdAt: row.created_at,
    orderId: row.order_id,
    customerEmail: row.customer_email ?? null,
    trackingCarrier: row.trackingCarrier,
    trackingNumber: row.trackingNumber,
  };
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminUser();
    const supabase = createAdminClient();
    const search = req.nextUrl.searchParams.get('search')?.trim() ?? '';
    const page = Number.parseInt(req.nextUrl.searchParams.get('page') ?? '0', 10);
    const safePage = Number.isFinite(page) && page >= 0 ? page : 0;
    const from = safePage * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase.from('orders').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`order_id.ilike.%${search}%,id.ilike.%${search}%`);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      orders: (data ?? []).map((row) => toAdminOrder(row as OrderRow)),
      count: count ?? 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load orders';
    const status = message === 'Authentication required.' || message === 'Admin access required.' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
