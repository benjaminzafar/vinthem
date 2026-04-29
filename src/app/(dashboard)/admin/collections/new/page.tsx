import { createClient } from '@/utils/supabase/server';
import { CollectionEditor } from '@/components/admin/CollectionEditor';
import type { StorefrontSettingsType } from '@/types';

export default async function NewCollectionPage() {
  const supabase = await createClient();
  const [categoriesRes, settingsRes] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.from('settings').select('data').eq('id', 'primary').single(),
  ]);

  const categories = categoriesRes.data || [];
  const settings = (settingsRes.data?.data || { languages: ['sv', 'en'] }) as StorefrontSettingsType;

  return <CollectionEditor categories={categories as any} settings={settings} />;
}
