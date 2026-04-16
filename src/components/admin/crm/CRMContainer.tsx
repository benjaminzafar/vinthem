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
  Megaphone
} from 'lucide-react';
import type { CRMCustomer, CRMOrder, RefundRecord, ReviewRecord, SupportTicket } from './types';

export function CRMContainer() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'customers' | 'tickets' | 'refunds' | 'newsletter' | 'reviews'>('customers');
  
  const [customers, setCustomers] = useState<Array<Record<string, unknown>>>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [tickets, setTickets] = useState<Array<Record<string, unknown>>>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [refunds, setRefunds] = useState<Array<Record<string, unknown>>>([]);
  const [loadingRefunds, setLoadingRefunds] = useState(true);
  const [reviews, setReviews] = useState<Array<Record<string, unknown>>>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [subscribers, setSubscribers] = useState<Array<Record<string, unknown>>>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  const [campaigns, setCampaigns] = useState<Array<Record<string, unknown>>>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  const [selectedCustomer, setSelectedCustomer] = useState<CRMCustomer | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (!error) setCustomers((data ?? []) as Array<Record<string, unknown>>);
      setLoadingCustomers(false);
    };
    fetchCustomers();
    const channel = supabase.channel('crm_users').on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchCustomers).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!error) setOrders((data ?? []) as Array<Record<string, unknown>>);
      setLoadingOrders(false);
    };
    fetchOrders();
    const channel = supabase.channel('crm_orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  useEffect(() => {
    const fetchTickets = async () => {
      const { data, error } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
      if (!error) setTickets((data ?? []) as Array<Record<string, unknown>>);
      setLoadingTickets(false);
    };
    fetchTickets();
    const channel = supabase.channel('crm_tickets').on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, fetchTickets).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  useEffect(() => {
    const fetchRefunds = async () => {
      const { data, error } = await supabase.from('refund_requests').select('*').order('created_at', { ascending: false });
      if (!error) setRefunds((data ?? []) as Array<Record<string, unknown>>);
      setLoadingRefunds(false);
    };
    fetchRefunds();
    const channel = supabase.channel('crm_refunds').on('postgres_changes', { event: '*', schema: 'public', table: 'refund_requests' }, fetchRefunds).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (!error) setReviews((data ?? []) as Array<Record<string, unknown>>);
      setLoadingReviews(false);
    };
    fetchReviews();
    const channel = supabase.channel('crm_reviews').on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, fetchReviews).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  useEffect(() => {
    const fetchNewsletter = async () => {
      const { data: subs } = await supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false });
      const { data: camps } = await supabase.from('newsletter_campaigns').select('*').order('sent_at', { ascending: false });
      if (subs) setSubscribers(subs as Array<Record<string, unknown>>);
      if (camps) setCampaigns(camps as Array<Record<string, unknown>>);
      setLoadingSubscribers(false);
      setLoadingCampaigns(false);
    };
    fetchNewsletter();
    const channel = supabase.channel('crm_newsletter').on('postgres_changes', { event: '*', schema: 'public', table: 'newsletter_subscribers' }, fetchNewsletter).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const customerMap = useMemo(() => {
    return new Map(
      customers.map((customer) => [
        String(customer.id),
        {
          id: String(customer.id),
          email: typeof customer.email === 'string' ? customer.email : '',
          name: typeof customer.full_name === 'string'
            ? customer.full_name
            : typeof customer.display_name === 'string'
              ? customer.display_name
              : typeof customer.name === 'string'
                ? customer.name
                : '',
          role: typeof customer.role === 'string' ? customer.role : 'client',
          createdAt: typeof customer.created_at === 'string' ? customer.created_at : null,
        },
      ])
    );
  }, [customers]);

  const normalizedOrders = useMemo<CRMOrder[]>(() => {
    return orders.map((order) => {
      const shippingDetails = typeof order.shipping_details === 'object' && order.shipping_details !== null
        ? order.shipping_details as Record<string, unknown>
        : {};

      return {
        id: String(order.id),
        orderId: typeof order.order_id === 'string' ? order.order_id : String(order.id),
        customerEmail: typeof order.customer_email === 'string'
          ? order.customer_email
          : typeof shippingDetails.email === 'string'
            ? shippingDetails.email
            : null,
        createdAt: typeof order.created_at === 'string' ? order.created_at : null,
        status: typeof order.status === 'string' ? order.status : 'Processing',
        total: Number(order.total ?? 0),
        currency: typeof order.currency === 'string' ? order.currency : 'SEK',
        userId: typeof order.user_id === 'string' ? order.user_id : null,
        items: Array.isArray(order.items) ? order.items as CRMOrder['items'] : [],
      };
    });
  }, [orders]);

  const normalizedTickets = useMemo<SupportTicket[]>(() => {
    return tickets.map((ticket) => {
      const userId = typeof ticket.user_id === 'string' ? ticket.user_id : null;
      const customer = userId ? customerMap.get(userId) : null;

      return {
        id: String(ticket.id),
        userId,
        customerEmail: typeof ticket.customer_email === 'string' ? ticket.customer_email : customer?.email ?? null,
        customerName: customer?.name ?? null,
        subject: typeof ticket.subject === 'string' ? ticket.subject : 'Support request',
        description: typeof ticket.description === 'string'
          ? ticket.description
          : typeof ticket.message === 'string'
            ? ticket.message
            : null,
        status: ticket.status === 'resolved' || ticket.status === 'in-progress' ? ticket.status : 'open',
        priority: typeof ticket.priority === 'string' ? ticket.priority : 'NORMAL',
        messages: Array.isArray(ticket.messages) ? ticket.messages as SupportTicket['messages'] : [],
        imageUrl: typeof ticket.image_url === 'string' ? ticket.image_url : null,
        createdAt: typeof ticket.created_at === 'string' ? ticket.created_at : null,
        updatedAt: typeof ticket.updated_at === 'string' ? ticket.updated_at : null,
      };
    });
  }, [tickets, customerMap]);

  const normalizedRefunds = useMemo<RefundRecord[]>(() => {
    return refunds.map((refund) => {
      const userId = typeof refund.user_id === 'string' ? refund.user_id : null;
      const customer = userId ? customerMap.get(userId) : null;

      return {
        id: String(refund.id),
        userId,
        customerEmail: customer?.email ?? null,
        customerName: customer?.name ?? null,
        orderId: typeof refund.order_id === 'string' ? refund.order_id : null,
        status: refund.status === 'Approved' || refund.status === 'Rejected' || refund.status === 'Refunded' ? refund.status : 'Pending',
        reason: typeof refund.reason === 'string' ? refund.reason : null,
        createdAt: typeof refund.created_at === 'string' ? refund.created_at : null,
      };
    });
  }, [refunds, customerMap]);

  const normalizedReviews = useMemo<ReviewRecord[]>(() => {
    return reviews.map((review) => {
      const userId = typeof review.user_id === 'string' ? review.user_id : null;
      const customer = userId ? customerMap.get(userId) : null;

      return {
        id: String(review.id),
        productId: typeof review.product_id === 'string' ? review.product_id : null,
        userId,
        userName: typeof review.user_name === 'string'
          ? review.user_name
          : customer?.name || customer?.email || 'Anonymous',
        customerEmail: customer?.email ?? null,
        rating: Number(review.rating ?? 0),
        comment: typeof review.comment === 'string' ? review.comment : null,
        createdAt: typeof review.created_at === 'string' ? review.created_at : null,
        adminReply: typeof review.admin_reply === 'string' ? review.admin_reply : null,
        adminReplyAt: typeof review.admin_reply_at === 'string' ? review.admin_reply_at : null,
      };
    });
  }, [reviews, customerMap]);

  const normalizedCampaigns = useMemo(() => {
    return campaigns.map((campaign) => ({
      ...campaign,
      sentAt: typeof campaign.sent_at === 'string' ? campaign.sent_at : null,
      recipientCount: Number(campaign.recipient_count ?? 0),
    }));
  }, [campaigns]);

  const customerSummaries = useMemo<CRMCustomer[]>(() => {
    return customers.map((customer) => {
      const id = String(customer.id);
      const email = typeof customer.email === 'string' ? customer.email : '';
      const name = typeof customer.full_name === 'string'
        ? customer.full_name
        : typeof customer.display_name === 'string'
          ? customer.display_name
          : typeof customer.name === 'string'
            ? customer.name
            : email.split('@')[0] || 'Customer';

      const customerOrders = normalizedOrders.filter((order) => order.userId === id || (!!email && order.customerEmail === email));
      const customerTickets = normalizedTickets.filter((ticket) => ticket.userId === id || (!!email && ticket.customerEmail === email));
      const customerRefunds = normalizedRefunds.filter((refund) => refund.userId === id || (!!email && refund.customerEmail === email));
      const customerReviews = normalizedReviews.filter((review) => review.userId === id || (!!email && review.customerEmail === email));
      const lastActivityCandidates = [
        customer.created_at,
        ...customerOrders.map((order) => order.createdAt),
        ...customerTickets.map((ticket) => ticket.updatedAt || ticket.createdAt),
        ...customerRefunds.map((refund) => refund.createdAt),
        ...customerReviews.map((review) => review.createdAt),
      ].filter((value): value is string => typeof value === 'string');

      return {
        id,
        email,
        name,
        role: typeof customer.role === 'string' ? customer.role : 'client',
        createdAt: typeof customer.created_at === 'string' ? customer.created_at : null,
        orderCount: customerOrders.length,
        ticketCount: customerTickets.length,
        refundCount: customerRefunds.length,
        reviewCount: customerReviews.length,
        totalSpent: customerOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0),
        lastActiveAt: lastActivityCandidates.sort().at(-1) ?? null,
      };
    });
  }, [customers, normalizedOrders, normalizedRefunds, normalizedReviews, normalizedTickets]);

  const normalizedSubscribers = useMemo(() => {
    return subscribers.map((subscriber) => {
      const email = typeof subscriber.email === 'string' ? subscriber.email : '';
      const linkedCustomer = customerSummaries.find((customer) => customer.email?.toLowerCase() === email.toLowerCase());

      return {
        ...subscriber,
        email,
        status: subscriber.status === 'unsubscribed' ? 'unsubscribed' : 'subscribed',
        source: typeof subscriber.source === 'string' ? subscriber.source : 'unknown',
        subscribedAt: typeof subscriber.subscribed_at === 'string' ? subscriber.subscribed_at : null,
        unsubscribedAt: typeof subscriber.unsubscribed_at === 'string' ? subscriber.unsubscribed_at : null,
        consentedAt: typeof subscriber.consented_at === 'string' ? subscriber.consented_at : null,
        customerName: linkedCustomer?.name ?? null,
      };
    });
  }, [customerSummaries, subscribers]);

  const filteredCustomers = useMemo<CRMCustomer[]>(() => {
    return customerSummaries.filter((customer) => {
      const q = debouncedSearch.toLowerCase();
      return (
        customer.email?.toLowerCase().includes(q) ||
        customer.name?.toLowerCase().includes(q)
      );
    });
  }, [customerSummaries, debouncedSearch]);

  if (selectedCustomer) {
    return (
      <CRMDetailView
        customer={selectedCustomer}
        orders={normalizedOrders.filter((order) => order.userId === selectedCustomer.id || (!!selectedCustomer.email && order.customerEmail === selectedCustomer.email))}
        tickets={normalizedTickets.filter((ticket) => ticket.userId === selectedCustomer.id || (!!selectedCustomer.email && ticket.customerEmail === selectedCustomer.email))}
        refunds={normalizedRefunds.filter((refund) => refund.userId === selectedCustomer.id || (!!selectedCustomer.email && refund.customerEmail === selectedCustomer.email))}
        reviews={normalizedReviews.filter((review) => review.userId === selectedCustomer.id || (!!selectedCustomer.email && review.customerEmail === selectedCustomer.email))}
        onBack={() => setSelectedCustomer(null)}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* 1. Overview Style Analytics */}
      <CRMAnalytics 
        tickets={normalizedTickets} 
        customers={customerSummaries} 
        refunds={normalizedRefunds} 
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
                  loading={loadingCustomers || loadingOrders}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSelectCustomer={setSelectedCustomer}
                />
              )}
              {activeTab === 'tickets' && (
                <SupportManager tickets={normalizedTickets} loading={loadingTickets} />
              )}
              {activeTab === 'refunds' && (
                <OperationsManager type="refunds" data={normalizedRefunds} loading={loadingRefunds} />
              )}
              {activeTab === 'newsletter' && (
                <OperationsManager type="newsletter" data={{ subscribers: normalizedSubscribers, campaigns: normalizedCampaigns }} loading={loadingSubscribers || loadingCampaigns} />
              )}
              {activeTab === 'reviews' && (
                <OperationsManager type="reviews" data={normalizedReviews} loading={loadingReviews} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
