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
  const [ordersRes, addressesRes, profileRes] = await Promise.all([
    supabase
      .from('orders')
      .select('*, orderId:order_id, createdAt:created_at, shippingCost:shipping_cost')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('addresses')
      .select('*, userId:user_id, firstName:first_name, lastName:last_name, postalCode:postal_code, isDefault:is_default')
      .eq('user_id', user.id),
    supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()
  ]);

  const orders = ordersRes.data || [];
  const addresses = addressesRes.data || [];
  const profile = profileRes.data || { full_name: null };

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24">
        <ProfileClient 
          initialOrders={orders} 
          initialAddresses={addresses} 
          profile={profile}
          settings={settings} 
          lang={lang} 
        />
      </div>
    </div>
  );
}
