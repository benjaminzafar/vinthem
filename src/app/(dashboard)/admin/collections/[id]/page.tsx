import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { CollectionEditor } from '@/components/admin/CollectionEditor';
import type { StorefrontSettingsType } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCollectionPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  const [categoryRes, categoriesRes, settingsRes] = await Promise.all([
    supabase.from('categories').select('*').eq('id', id).single(),
    supabase.from('categories').select('*').order('name'),
    supabase.from('settings').select('data').eq('id', 'primary').single(),
  ]);

  const category = categoryRes.data;

  if (!category) {
    notFound();
  }

  const categories = categoriesRes.data || [];
  const settings = (settingsRes.data?.data || { languages: ['sv', 'en'] }) as StorefrontSettingsType;

  // Map database fields to Category type
  const mappedCategory = {
    ...category,
    isFeatured: category.is_featured,
    showInHero: category.show_in_hero,
    pinnedInSearch: category.pinned_in_search,
    parentId: category.parent_id,
    imageUrl: category.image_url,
    iconUrl: category.icon_url,
    translations: category.translations || {}
  };

  return <CollectionEditor initialCollection={mappedCategory} categories={categories as any} settings={settings} />;
}
