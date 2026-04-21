import type { Metadata } from 'next';

import PaymentClient from './PaymentClient';
import { getSettings } from '@/lib/data';
import type { StorefrontSettings } from '@/store/useSettingsStore';

export const metadata: Metadata = {
  title: 'Checkout | Vinthem',
  description: 'Enter shipping details, review estimated taxes, and continue to secure Stripe checkout.',
};

export default async function PaymentPage() {
  const settings = (await getSettings()) as Partial<StorefrontSettings>;
  return <PaymentClient initialSettings={settings} />;
}
