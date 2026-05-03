import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { requireAdminUser } from '@/lib/admin';
import { Product } from '@/store/useCartStore';

type ProductRow = {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  sku?: string;
  image_url: string;
  category_id?: string;
  is_featured?: boolean;
  is_new?: boolean;
  is_new_arrival?: boolean;
  is_sale?: boolean;
  sale_price?: number;
  prices?: Record<string, number>;
  stripe_tax_code?: string;
  created_at?: string;
  status?: 'draft' | 'published';
};

const ITEMS_PER_PAGE = 50;

function toProduct(row: ProductRow): Product {
  return {
    ...row,
    imageUrl: row.image_url,
    categoryId: row.category_id,
    isFeatured: row.is_featured,
    isNewArrival: row.is_new ?? row.is_new_arrival ?? false,
    isSale: row.is_sale,
    discountPrice: row.sale_price,
    prices: row.prices,
    stripeTaxCode: row.stripe_tax_code,
    createdAt: row.created_at,
  } as unknown as Product;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminUser();
    const supabase = createAdminClient();
    const search = req.nextUrl.searchParams.get('search')?.trim() ?? '';
    const tab = req.nextUrl.searchParams.get('tab') ?? 'all';
    const page = Number.parseInt(req.nextUrl.searchParams.get('page') ?? '0', 10);
    const safePage = Number.isFinite(page) && page >= 0 ? page : 0;
    const from = safePage * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase.from('products').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`title.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    if (tab === 'active') {
      query = query.or('status.eq.published,and(status.is.null,stock.gt.0)');
    } else if (tab === 'drafts') {
      query = query.eq('status', 'draft');
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      products: (data ?? []).map((row) => toProduct(row as ProductRow)),
      count: count ?? 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load products';
    const status = message === 'Authentication required.' || message === 'Admin access required.' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
