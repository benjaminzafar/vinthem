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
import { Category } from '@/types';
import { Product } from '@/store/useCartStore';

interface TabPageProps {
  params: Promise<{ tab: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminTabPage({ params, searchParams }: TabPageProps) {
  const { tab } = await params;
  const sParams = await searchParams;
  const supabase = await createClient();

  // Defense-in-depth: check role server-side even if middleware is active
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user?.id || '')
    .single();

  if (profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-500">Access Denied. Admin privileges required.</p>
      </div>
    );
  }

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
    
    const initialOrders = (data || []).map((o) => {
      const order = o as Record<string, any>;
      return {
        ...order,
        createdAt: order.created_at,
        orderId: order.order_id,
        customerEmail: order.shipping_details?.email
      };
    });

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
    
    const initialProducts = (productsRes.data || []).map((p) => {
      const product = p as any;
      return {
        ...product,
        imageUrl: product.image_url,
        categoryId: product.category_id,
        isFeatured: product.is_featured,
        isNewArrival: product.is_new_arrival,
        isSale: product.is_sale,
        discountPrice: product.sale_price,
        prices: product.prices,
        stripeTaxCode: product.stripe_tax_code,
        createdAt: product.created_at
      } as unknown as Product;
    });

    const initialCategories = (categoriesRes.data || []).map((c) => {
      const cat = c as any;
      return {
        ...cat,
        isFeatured: cat.is_featured,
        showInHero: cat.show_in_hero,
        pinnedInSearch: cat.pinned_in_search,
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
      const cat = c as any;
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
      const prod = p as Record<string, any>;
      return {
        id: prod.id,
        categoryId: prod.category_id
      };
    });

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
