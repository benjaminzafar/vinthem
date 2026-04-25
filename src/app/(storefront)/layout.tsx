import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { getSettings } from '@/lib/data';
import { getSessionUserWithRole } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const { user, acceptedTermsAt } = await getSessionUserWithRole();
  const headerList = await headers();
  const pathname = headerList.get('x-pathname-no-locale') || '/';

  // Enforcement Wall: If user is logged in but hasn't accepted terms
  // and is NOT already on the consent page or auth page.
  if (user && !acceptedTermsAt && !pathname.includes('/auth/consent') && !pathname.includes('/auth/callback')) {
    redirect('/auth/consent');
  }

  return (
    <>
      <Navigation />
      <main className="flex-grow">
        {children}
      </main>
      <Footer settings={settings} />
    </>
  );
}
