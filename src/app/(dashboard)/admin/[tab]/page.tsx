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

  if (tab === 'integrations') {
    const response = await getIntegrationsAction();
    return <IntegrationsManager initialConfig={response.data || {}} />;
  }

  if (tab === 'storefront') {
    return <StorefrontSettings />;
  }

  // Generic fallback for other managers (we can specialize these later)
  if (tab === 'orders') return <OrderManager />;
  if (tab === 'products') return <ProductManager selectedProductId={sParams.id as string} />;
  if (tab === 'collections') return <CollectionManager />;
  if (tab === 'customers') return <CustomersAndCRMManager />;
  if (tab === 'blogs') return <BlogManager />;
  if (tab === 'pages') return <PageManager />;
  if (tab === 'database') return <DatabaseManager />;
  if (tab === 'media') return <MediaManager />;

  return (
    <div className="p-8 text-center bg-white rounded-xl border border-zinc-200">
      <h3 className="text-lg font-medium text-zinc-900">Module {tab} is coming soon</h3>
      <p className="text-zinc-500">We are currently migrating this section to the new Next.js system.</p>
    </div>
  );
}
