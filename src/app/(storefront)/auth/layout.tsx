import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Vinthem',
  description: 'Access your Vinthem account to manage orders, addresses, and wishlist.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
