import { notFound } from 'next/navigation';

import { PageEditor } from '@/components/admin/PageEditor';
import { mapPageRow } from '@/lib/admin-content';
import { createClient } from '@/utils/supabase/server';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStaticPagePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('pages').select('*').eq('id', id).single();

  if (!data) {
    notFound();
  }

  return <PageEditor initialPage={mapPageRow(data as Record<string, unknown>)} />;
}
