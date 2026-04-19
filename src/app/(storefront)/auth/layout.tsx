import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Mavren Shop',
  description: 'Access your Mavren Shop account to manage orders, addresses, and wishlist.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
