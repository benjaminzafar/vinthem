import { notFound } from 'next/navigation';

import { BlogEditor } from '@/components/admin/BlogEditor';
import { mapBlogRow } from '@/lib/admin-content';
import { createClient } from '@/utils/supabase/server';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('blog_posts').select('*').eq('id', id).single();

  if (!data) {
    notFound();
  }

  return <BlogEditor initialPost={mapBlogRow(data as Record<string, unknown>)} />;
}
