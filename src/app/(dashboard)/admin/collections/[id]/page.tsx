import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { CollectionEditor } from '@/components/admin/CollectionEditor';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCollectionPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (!category) {
    notFound();
  }

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

  return <CollectionEditor initialCollection={mappedCategory} />;
}
