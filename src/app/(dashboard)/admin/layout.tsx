import { ReactNode } from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminNavHeader from '@/components/admin/AdminNavHeader';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth?next=/admin');
  }

  // Admin check logic
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

  return (
    <div className="min-h-screen bg-slate-50 flex w-full font-sans selection:bg-slate-900/10">
      <AdminSidebar activeUserEmail={user.email} />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <AdminNavHeader />
        
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 lg:px-12 lg:py-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full pb-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
