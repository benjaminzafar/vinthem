"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { CRMAnalytics } from './CRMAnalytics';
import { CustomerTable } from './CustomerTable';
import { SupportManager } from './SupportManager';
import { OperationsManager } from './OperationsManager';
import { CRMDetailView } from './CRMDetailView';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, MessageSquare, RefreshCcw, Target, 
  Megaphone, Search
} from 'lucide-react';

export function CRMContainer() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'customers' | 'tickets' | 'refunds' | 'newsletter' | 'reviews'>('customers');
  
  // Shared Data State
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loadingRefunds, setLoadingRefunds] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // Detail View State
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Search Logic
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Data Fetching logic (optimized/modularized)
  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (!error) setCustomers((data ?? []).map((u: any) => ({ ...u, createdAt: u.created_at, displayName: u.display_name })));
      setLoadingCustomers(false);
    };
    fetchCustomers();
    const channel = supabase.channel('crm_users').on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchCustomers).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const fetchTickets = async () => {
      const { data, error } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
      if (!error) setTickets((data ?? []).map((t: any) => ({ ...t, customerEmail: t.customer_email, createdAt: t.created_at, updatedAt: t.updated_at })));
      setLoadingTickets(false);
    };
    fetchTickets();
    const channel = supabase.channel('crm_tickets').on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, fetchTickets).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const fetchRefunds = async () => {
      const { data, error } = await supabase.from('refund_requests').select('*').order('created_at', { ascending: false });
      if (!error) setRefunds((data ?? []).map((r: any) => ({ ...r, userId: r.user_id, orderId: r.order_id, createdAt: r.created_at })));
      setLoadingRefunds(false);
    };
    fetchRefunds();
    const channel = supabase.channel('crm_refunds').on('postgres_changes', { event: '*', schema: 'public', table: 'refund_requests' }, fetchRefunds).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (!error) setReviews((data ?? []).map((r: any) => ({ ...r, productId: r.product_id, userId: r.user_id, userName: r.user_name, createdAt: r.created_at, adminReply: r.admin_reply, adminReplyAt: r.admin_reply_at })));
      setLoadingReviews(false);
    };
    fetchReviews();
    const channel = supabase.channel('crm_reviews').on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, fetchReviews).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const fetchNewsletter = async () => {
      const { data: subs } = await supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false });
      const { data: camps } = await supabase.from('newsletter_campaigns').select('*').order('sent_at', { ascending: false });
      if (subs) setSubscribers(subs.map(s => ({ ...s, subscribedAt: s.subscribed_at })));
      if (camps) setCampaigns(camps.map(c => ({ ...c, sentAt: c.sent_at, recipientCount: c.recipient_count })));
      setLoadingSubscribers(false);
      setLoadingCampaigns(false);
    };
    fetchNewsletter();
    const channel = supabase.channel('crm_newsletter').on('postgres_changes', { event: '*', schema: 'public', table: 'newsletter_subscribers' }, fetchNewsletter).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = debouncedSearch.toLowerCase();
      return (c.email?.toLowerCase().includes(q) || c.displayName?.toLowerCase().includes(q));
    });
  }, [customers, debouncedSearch]);

  if (selectedCustomer) {
    return <CRMDetailView customer={selectedCustomer} onBack={() => setSelectedCustomer(null)} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* 1. Overview Style Analytics */}
      <CRMAnalytics 
        tickets={tickets} 
        customers={customers} 
        refunds={refunds} 
      />

      {/* 2. Management Hub (Unified border-bottom tabs) */}
      <div className="bg-white border border-slate-300 rounded overflow-hidden">
        <div className="px-6 border-b border-slate-300 bg-white flex items-center justify-between h-14 overflow-x-auto no-scrollbar">
          <div className="flex gap-8 h-full">
            {[
              { id: 'customers', label: 'Customers', icon: Users },
              { id: 'tickets', label: 'Tickets', icon: MessageSquare },
              { id: 'refunds', label: 'Refunds', icon: RefreshCcw },
              { id: 'newsletter', label: 'Email', icon: Megaphone },
              { id: 'reviews', label: 'Reviews', icon: Target },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`h-full flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === tab.id 
                    ? 'text-slate-900 border-slate-900' 
                    : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'customers' && (
                <CustomerTable 
                  customers={filteredCustomers} 
                  loading={loadingCustomers}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSelectCustomer={setSelectedCustomer}
                />
              )}
              {activeTab === 'tickets' && (
                <SupportManager tickets={tickets} loading={loadingTickets} />
              )}
              {activeTab === 'refunds' && (
                <OperationsManager type="refunds" data={refunds} loading={loadingRefunds} />
              )}
              {activeTab === 'newsletter' && (
                <OperationsManager type="newsletter" data={{ subscribers, campaigns }} loading={loadingSubscribers} />
              )}
              {activeTab === 'reviews' && (
                <OperationsManager type="reviews" data={reviews} loading={loadingReviews} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
