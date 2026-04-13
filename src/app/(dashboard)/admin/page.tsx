import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { AdminClient } from '@/components/admin/AdminClient';

export default async function AdminPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?next=/admin');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = 
    profile?.role === 'admin' || 
    user.email === 'benjaminzafar10@gmail.com' || 
    user.email === 'benjaminzafar7@gmail.com';

  if (!isAdmin) {
    redirect('/');
  }

  return <AdminClient />;
}
