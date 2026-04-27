import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import { getSessionUserWithRole } from '@/lib/admin';
import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isAdmin } = await getSessionUserWithRole();

  if (!user) {
    redirect('/auth?next=/admin');
  }

  if (!isAdmin) {
    redirect('/');
  }

  return (
    <AdminShell activeUserEmail={user.email ?? undefined}>
      {children}
    </AdminShell>
  );
}
