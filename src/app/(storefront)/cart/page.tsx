import type { Metadata } from 'next';

import CartClient from './CartClient';
import { getSettings } from '@/lib/data';
import type { StorefrontSettings } from '@/store/useSettingsStore';

export const metadata: Metadata = {
  title: 'Cart | Mavren Shop',
  description: 'Review your selected products, update quantities, and continue to secure checkout.',
};

export default async function CartPage() {
  const settings = (await getSettings()) as Partial<StorefrontSettings>;
  return <CartClient initialSettings={settings} />;
}
