import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Profile | Mavren Shop',
  description: 'Manage your personal information, view order history, and update shipping addresses.',
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
