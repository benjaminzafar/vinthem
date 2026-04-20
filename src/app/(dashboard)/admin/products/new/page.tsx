import { createClient } from '@/utils/supabase/server';
import { ProductEditor } from '@/components/admin/ProductEditor';
import type { StorefrontSettingsType } from '@/types';

export default async function NewProductPage() {
  const supabase = await createClient();
  
  // Fetch initial data for the editor
  const [categoriesRes, settingsRes] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.from('settings').select('data').eq('id', 'primary').single()
  ]);

  const categories = categoriesRes.data || [];
  const settings = (settingsRes.data?.data || { languages: ['sv', 'en'] }) as StorefrontSettingsType;

  return (
    <div className="bg-slate-50 min-h-screen">
      <ProductEditor 
        categories={categories}
        settings={settings}
      />
    </div>
  );
}
