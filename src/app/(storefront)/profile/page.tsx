import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getSettings } from '@/lib/data';
import { ProfileClient } from './ProfileClient';

export default async function ProfilePage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?next=/profile');
  }

  const settings = await getSettings();
  const lang = 'en'; // Default for server render

  // Fetch initial data on the server for speed
  const [ordersRes, addressesRes] = await Promise.all([
    supabase
      .from('orders')
      .select('*, orderId:order_id, createdAt:created_at, shippingCost:shipping_cost')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('addresses')
      .select('*, userId:user_id, firstName:first_name, lastName:last_name, postalCode:postal_code, isDefault:is_default')
      .eq('user_id', user.id)
  ]);

  const orders = ordersRes.data || [];
  const addresses = addressesRes.data || [];

  return (
    <div className="bg-[#fcfcfc] min-h-screen pb-24 font-sans">
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-sans text-brand-ink tracking-tight mb-4">
          {settings.accountTitleText?.[lang] || 'My Account'}.
        </h1>
        <div className="h-1 bg-brand-ink mb-6 w-24"></div>
        <p className="text-lg text-brand-muted font-normal max-w-2xl">
          {settings.accountDescriptionText?.[lang] || 'Manage your orders, addresses, and profile details.'}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProfileClient 
          initialOrders={orders} 
          initialAddresses={addresses} 
          settings={settings} 
          lang={lang} 
        />
      </div>
    </div>
  );
}
