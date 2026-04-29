import { createAdminClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { Overview } from '@/components/admin/Overview';
import { IntegrationsManager } from '@/components/admin/IntegrationsManager';
import { OrderManager } from '@/components/admin/OrderManager';
import { ProductManager } from '@/components/admin/ProductManager';
import { CollectionManager } from '@/components/admin/CollectionManager';
import { CustomersAndCRMManager } from '@/components/admin/CustomersAndCRMManager';
import { BlogManager } from '@/components/admin/BlogManager';
import { PageManager } from '@/components/admin/PageManager';
import { StorefrontSettings } from '@/components/admin/StorefrontSettings';
import { MediaManager } from '@/components/admin/MediaManager';
import { getIntegrationsAction } from '@/app/actions/integrations';
import { getCRMDataAction } from '@/app/actions/crm';
import { mapBlogRow, mapPageRow } from '@/lib/admin-content';
import { fetchAdminOverviewStats } from '@/lib/admin-overview';
import { Category } from '@/types';
import { Product } from '@/store/useCartStore';
import type { AdminOrder, OrderItem } from '@/types';
import { requireAdminUser } from '@/lib/admin';

interface TabPageProps {
  params: Promise<{ tab: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

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

export default async function AdminTabPage({ params, searchParams }: TabPageProps) {
  const { tab } = await params;
  const sParams = await searchParams;
  await requireAdminUser();
  const supabase = createAdminClient();

  const validTabs = [
    'overview', 'orders', 'products', 
    'collections', 'customers', 'blogs', 'pages',
    'storefront', 'integrations', 'media'
  ];

  if (!validTabs.includes(tab)) {
    notFound();
  }

  if (tab === 'overview') {
    const initialStats = await fetchAdminOverviewStats();
    return <Overview initialStats={initialStats} />;
  }

  if (tab === 'orders') {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    const initialOrders: AdminOrder[] = (data || []).map((o) => {
      const order = o as OrderRow;
      return {
        id: order.id,
        user_id: order.user_id ?? null,
        items: Array.isArray(order.items) ? order.items : [],
        total: Number(order.total ?? 0),
        subtotal: Number(order.subtotal ?? 0),
        shipping_cost: Number(order.shipping_cost ?? 0),
        tax_amount: Number(order.tax_amount ?? 0),
        status: order.status ?? 'Pending',
        shipping_details: undefined,
        created_at: order.created_at,
        createdAt: order.created_at,
        orderId: order.order_id,
        customerEmail: order.customer_email ?? null,
        trackingCarrier: order.trackingCarrier,
        trackingNumber: order.trackingNumber,
      };
    });

    return <OrderManager initialOrders={initialOrders} />;
  }

  if (tab === 'integrations') {
    const response = await getIntegrationsAction();
    return (
      <IntegrationsManager 
        initialConfig={response.data || {}} 
        activeLanguages={response.activeLocales}
      />
    );
  }

  if (tab === 'storefront') {
    return <StorefrontSettings />;
  }

  if (tab === 'products') {
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name')
    ]);
    
    const initialProducts = (productsRes.data || []).map((p) => {
      const product = p as Record<string, unknown>;
      return {
        ...product,
        imageUrl: product.image_url,
        categoryId: product.category_id,
        isFeatured: product.is_featured,
        isNewArrival: product.is_new ?? product.is_new_arrival ?? false,
        isSale: product.is_sale,
        discountPrice: product.sale_price,
        prices: product.prices,
        stripeTaxCode: product.stripe_tax_code,
        createdAt: product.created_at
      } as unknown as Product;
    });

    const initialCategories = (categoriesRes.data || []).map((c) => {
      const cat = c as Record<string, unknown>;
      return {
        ...cat,
        isFeatured: cat.is_featured,
        showInHero: cat.show_in_hero,
        pinnedInSearch: false,
        parentId: cat.parent_id,
        imageUrl: cat.image_url,
        iconUrl: cat.icon_url
      } as unknown as Category;
    });

    return (
      <ProductManager 
        selectedProductId={sParams.id as string} 
        initialProducts={initialProducts}
        initialCategories={initialCategories}
      />
    );
  }

  if (tab === 'collections') {
    const [categoriesRes, productsRes] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('products').select('id, category_id')
    ]);

    const initialCategories = (categoriesRes.data || []).map((c) => {
      const cat = c as Record<string, unknown>;
      return {
        ...cat,
        isFeatured: cat.is_featured,
        showInHero: cat.show_in_hero,
        parentId: cat.parent_id,
        imageUrl: cat.image_url,
        iconUrl: cat.icon_url
      } as unknown as Category;
    });

    const initialProductsShort = (productsRes.data || []).map((p) => {
      const prod = p as { id: string; category_id: string | null };
      return {
        id: prod.id,
        categoryId: prod.category_id
      };
    });

    return (
      <CollectionManager 
        initialCategories={initialCategories}
        initialProducts={initialProductsShort as Array<{id: string, categoryId: string | null}>} 
      />
    );
  }

  if (tab === 'customers') {
    const response = await getCRMDataAction();
    return <CustomersAndCRMManager initialData={response.data} />;
  }
  if (tab === 'blogs') {
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
    const initialPosts = (data || []).map((post) => mapBlogRow(post as Record<string, unknown>));
    return <BlogManager initialPosts={initialPosts} />;
  }

  if (tab === 'pages') {
    const { data } = await supabase.from('pages').select('*').order('updated_at', { ascending: false });
    const initialPages = (data || []).map((page) => mapPageRow(page as Record<string, unknown>));
    return <PageManager initialPages={initialPages} />;
  }
  if (tab === 'media') return <MediaManager />;
  notFound();
}
