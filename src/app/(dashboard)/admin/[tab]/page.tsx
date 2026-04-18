import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { Overview } from '@/components/admin/Overview';
import { IntegrationsManager } from '@/components/admin/IntegrationsManager';
import { OrderManager } from '@/components/admin/OrderManager';
import { ProductManager } from '@/components/admin/ProductManager';
import { CollectionManager } from '@/components/admin/CollectionManager';
import { CustomersAndCRMManager } from '@/components/admin/CustomersAndCRMManager';
import { BlogManager } from '@/components/admin/BlogManager';
import { PageManager } from '@/components/admin/PageManager';
import { DatabaseManager } from '@/components/admin/DatabaseManager';
import { StorefrontSettings } from '@/components/admin/StorefrontSettings';
import { MediaManager } from '@/components/admin/MediaManager';
import { getIntegrationsAction } from '@/app/actions/integrations';
import { mapBlogRow, mapPageRow } from '@/lib/admin-content';

interface TabPageProps {
  params: Promise<{ tab: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminTabPage({ params, searchParams }: TabPageProps) {
  const { tab } = await params;
  const sParams = await searchParams;
  const supabase = await createClient();

  // Valid tabs check
  const validTabs = [
    'overview', 'database', 'orders', 'products', 
    'collections', 'customers', 'blogs', 'pages', 
    'storefront', 'integrations', 'media'
  ];

  if (!validTabs.includes(tab)) {
    notFound();
  }

  // --- Data Fetching Logic per Tab ---
  
  if (tab === 'overview') {
    const [ordersRes, productsRes, refundsRes] = await Promise.all([
      supabase.from('orders').select('id, total, status, created_at'),
      supabase.from('products').select('id, stock, title'),
      supabase.from('refund_requests').select('id, status')
    ]);
    const initialStats = {
      orders: ordersRes.data || [],
      products: productsRes.data || [],
      refunds: refundsRes.data || []
    };
    return <Overview initialStats={initialStats} />;
  }

  if (tab === 'orders') {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    const initialOrders = (data || []).map((o: any) => ({
      ...o,
      createdAt: o.created_at,
      orderId: o.order_id,
      customerEmail: o.shipping_details?.email
    }));

    return <OrderManager initialOrders={initialOrders} />;
  }

  if (tab === 'integrations') {
    const response = await getIntegrationsAction();
    return <IntegrationsManager initialConfig={response.data || {}} />;
  }

  if (tab === 'storefront') {
    return <StorefrontSettings />;
  }

  if (tab === 'products') {
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name')
    ]);
    
    const initialProducts = (productsRes.data || []).map((p: any) => ({
      ...p,
      imageUrl: p.image_url,
      categoryId: p.category_id,
      isFeatured: p.is_featured,
      isNewArrival: p.is_new_arrival,
      isSale: p.is_sale,
      discountPrice: p.sale_price,
      prices: p.prices,
      stripeTaxCode: p.stripe_tax_code,
      createdAt: p.created_at
    }));

    const initialCategories = (categoriesRes.data || []).map((c: any) => ({
      ...c,
      isFeatured: c.is_featured,
      showInHero: c.show_in_hero,
      parentId: c.parent_id,
      imageUrl: c.image_url,
      iconUrl: c.icon_url
    }));

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

    const initialCategories = (categoriesRes.data || []).map((c: any) => ({
      ...c,
      isFeatured: c.is_featured,
      showInHero: c.show_in_hero,
      parentId: c.parent_id,
      imageUrl: c.image_url,
      iconUrl: c.icon_url
    }));

    const initialProductsShort = (productsRes.data || []).map((p: any) => ({
      id: p.id,
      categoryId: p.category_id
    }));

    return (
      <CollectionManager 
        initialCategories={initialCategories}
        initialProducts={initialProductsShort as any} 
      />
    );
  }

  if (tab === 'customers') return <CustomersAndCRMManager />;
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
  if (tab === 'database') return <DatabaseManager />;
  if (tab === 'media') return <MediaManager />;

  return (
    <div className="p-8 text-center bg-white rounded-xl border border-zinc-200">
      <h3 className="text-lg font-medium text-zinc-900">Module {tab} is coming soon</h3>
      <p className="text-zinc-500">We are currently migrating this section to the new Next.js system.</p>
    </div>
  );
}
