import type { Metadata } from 'next';

import PaymentClient from './PaymentClient';
import { getSettings } from '@/lib/data';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import type { StorefrontSettings } from '@/store/useSettingsStore';

export const metadata: Metadata = {
  title: 'Checkout | Vinthem',
  description: 'Enter shipping details, review estimated taxes, and continue to secure Stripe checkout.',
};

export default async function PaymentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth?next=/payment');
  }

  const settings = (await getSettings()) as Partial<StorefrontSettings>;
  const { getUserAddressesAction } = await import('@/app/actions/profile');
  const addresses = await getUserAddressesAction();

  return <PaymentClient initialSettings={settings} initialAddresses={addresses} />;
}
