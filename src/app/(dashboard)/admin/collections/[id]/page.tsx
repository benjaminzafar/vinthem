import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { CollectionEditor } from '@/components/admin/CollectionEditor';
import type { Category, StorefrontSettingsType } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

type RawCategoryRecord = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  translations?: Category['translations'];
  is_featured?: boolean | null;
  isFeatured?: boolean | null;
  show_in_hero?: boolean | null;
  showInHero?: boolean | null;
  parent_id?: string | null;
  parentId?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  icon_url?: string | null;
  iconUrl?: string | null;
};

function mapCategoryRecord(category: RawCategoryRecord): Category {
  return {
    id: category.id,
    name: category.name || '',
    slug: category.slug || '',
    description: category.description || '',
    translations: category.translations || {},
    isFeatured: category.is_featured ?? category.isFeatured ?? false,
    showInHero: category.show_in_hero ?? category.showInHero ?? false,
    parentId: category.parent_id ?? category.parentId ?? '',
    imageUrl: category.image_url ?? category.imageUrl ?? '',
    iconUrl: category.icon_url ?? category.iconUrl ?? '',
  };
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

  const categories = (categoriesRes.data || []).map((entry) => mapCategoryRecord(entry as RawCategoryRecord));
  const settings = (settingsRes.data?.data || { languages: ['sv', 'en'] }) as StorefrontSettingsType;

  return <CollectionEditor initialCollection={mapCategoryRecord(category as RawCategoryRecord)} categories={categories} settings={settings} />;
}
