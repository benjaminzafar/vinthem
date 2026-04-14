import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { getSettings } from '@/lib/data';

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

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
