import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { ProductEditor } from '@/components/admin/ProductEditor';
import { getIntegrationsAction } from '@/app/actions/integrations';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch product data, categories, and settings
  const [productRes, categoriesRes, settingsRes] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('categories').select('*').order('name'),
    supabase.from('settings').select('data').eq('id', 'primary').single()
  ]);

  if (!productRes.data) {
    notFound();
  }

  const categories = categoriesRes.data || [];
  const settings = settingsRes.data?.data || { languages: ['sv', 'en'] };

  return (
    <div className="bg-slate-50 min-h-screen">
      <ProductEditor 
        initialProduct={productRes.data as any}
        categories={categories}
        settings={settings as any}
      />
    </div>
  );
}
