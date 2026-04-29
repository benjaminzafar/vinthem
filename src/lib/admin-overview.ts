import { createAdminClient } from '@/utils/supabase/server';

export interface RawOverviewStats {
  orders: Record<string, unknown>[];
  products: Record<string, unknown>[];
  refunds: Record<string, unknown>[];
}

export async function fetchAdminOverviewStats(): Promise<RawOverviewStats> {
  const supabase = createAdminClient();

  const [ordersRes, productsRes, refundsRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total, status, created_at, order_id, customer_email, items')
      .order('created_at', { ascending: false }),
    supabase
      .from('products')
      .select('id, stock, title, variants, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('refund_requests')
      .select('id, status, created_at')
      .order('created_at', { ascending: false }),
  ]);

  if (ordersRes.error) {
    throw ordersRes.error;
  }

  if (productsRes.error) {
    throw productsRes.error;
  }

  if (refundsRes.error) {
    throw refundsRes.error;
  }

  return {
    orders: (ordersRes.data ?? []) as Record<string, unknown>[],
    products: (productsRes.data ?? []) as Record<string, unknown>[],
    refunds: (refundsRes.data ?? []) as Record<string, unknown>[],
  };
}
