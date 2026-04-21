import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getSettings } from '@/lib/data';
import { ProfileClient } from './ProfileClient';
import { getServerLocale } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const settings = await getSettings();
  const storeName = settings.storeName?.en || 'Vinthem';

  if (!user) return { title: `Profile | ${storeName}` };

  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  const name = profile?.full_name || user.email?.split('@')[0] || 'User';

  return {
    title: `${name}'s Profile | ${storeName}`,
    description: 'Manage your orders, addresses, and account details.',
  };
}

export default async function ProfilePage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth?redirect=/profile');
  }

  const settings = await getSettings();
  const lang = await getServerLocale();

  // Fetch initial data on the server for speed
  const [ordersRes, addressesRes, profileRes, ticketsRes, refundsRes] = await Promise.all([
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
      .maybeSingle(),
    supabase
      .from('support_tickets')
      .select('id, subject, message, status, created_at, updated_at, messages')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('refund_requests')
      .select('id, order_id, reason, status, created_at, comments')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  const orders = ordersRes.data || [];
  const addresses = addressesRes.data || [];
  const profile = profileRes.data || { full_name: null };
  const supportTickets = ticketsRes.data || [];
  const refundRequests = refundsRes.data || [];

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24">
        <ProfileClient 
          initialOrders={orders} 
          initialAddresses={addresses} 
          initialSupportTickets={supportTickets}
          initialRefundRequests={refundRequests}
          profile={profile}
          settings={settings} 
          lang={lang} 
        />
      </div>
    </div>
  );
}
