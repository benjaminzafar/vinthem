"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getCRMDataAction } from '@/app/actions/crm';
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
import { 
  CRMUser, 
  SupportTicket, 
  RefundRequest, 
  AdminOrder, 
  Review, 
  NewsletterSubscriber, 
  NewsletterCampaign,
  CRMData
} from '@/types';
import type { CRMCustomer, CRMOrder, RefundRecord, ReviewRecord, SupportTicket as SupportTicketUI } from './types';

export function CRMContainer({ initialData }: { initialData?: CRMData }) {
  const [supabase] = useState(() => createClient());
  const [activeTab, setActiveTab] = useState<'customers' | 'tickets' | 'refunds' | 'newsletter' | 'reviews'>('customers');
  
  const [customers, setCustomers] = useState<CRMUser[]>(initialData?.users ?? []);
  const [loadingCustomers, setLoadingCustomers] = useState(!initialData?.users);
  const [orders, setOrders] = useState<AdminOrder[]>(initialData?.orders ?? []);
  const [loadingOrders, setLoadingOrders] = useState(!initialData?.orders);
  const [tickets, setTickets] = useState<SupportTicket[]>(initialData?.tickets ?? []);
  const [loadingTickets, setLoadingTickets] = useState(!initialData?.tickets);
  const [refunds, setRefunds] = useState<RefundRequest[]>(initialData?.refunds ?? []);
  const [loadingRefunds, setLoadingRefunds] = useState(!initialData?.refunds);
  const [reviews, setReviews] = useState<Review[]>(initialData?.reviews ?? []);
  const [loadingReviews, setLoadingReviews] = useState(!initialData?.reviews);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>(initialData?.subscribers ?? []);
  const [loadingSubscribers, setLoadingSubscribers] = useState(!initialData?.subscribers);
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>(initialData?.campaigns ?? []);
  const [loadingCampaigns, setLoadingCampaigns] = useState(!initialData?.campaigns);

  const [selectedCustomer, setSelectedCustomer] = useState<CRMCustomer | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const syncCRMData = async () => {
    const response = await getCRMDataAction();
    if (response.success && response.data) {
      setCustomers(response.data.users);
      setOrders(response.data.orders);
      setTickets(response.data.tickets);
      setRefunds(response.data.refunds);
      setReviews(response.data.reviews);
      setSubscribers(response.data.subscribers);
      setCampaigns(response.data.campaigns);
      
      // Clear all loading states
      setLoadingCustomers(false);
      setLoadingOrders(false);
      setLoadingTickets(false);
      setLoadingRefunds(false);
      setLoadingReviews(false);
      setLoadingSubscribers(false);
      setLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    const channel = supabase.channel('crm_users').on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, syncCRMData).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  useEffect(() => {
    const channel = supabase.channel('crm_orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, syncCRMData).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  useEffect(() => {
    const channel = supabase.channel('crm_tickets').on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, syncCRMData).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  useEffect(() => {
    const channel = supabase.channel('crm_refunds').on('postgres_changes', { event: '*', schema: 'public', table: 'refund_requests' }, syncCRMData).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  useEffect(() => {
    const channel = supabase.channel('crm_reviews').on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, syncCRMData).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  useEffect(() => {
    const channel = supabase.channel('crm_newsletter').on('postgres_changes', { event: '*', schema: 'public', table: 'newsletter_subscribers' }, syncCRMData).subscribe();
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
      const shippingDetails = order.shipping_details || {};

      return {
        id: String(order.id),
        orderId: order.orderId || String(order.id),
        customerEmail: order.customerEmail || shippingDetails.email || null,
        createdAt: typeof order.created_at === 'string' ? order.created_at : null,
        status: typeof order.status === 'string' ? order.status : 'Processing',
        total: Number(order.total ?? 0),
        currency: typeof order.currency === 'string' ? order.currency : 'SEK',
        userId: typeof order.user_id === 'string' ? order.user_id : null,
        items: Array.isArray(order.items) ? order.items as CRMOrder['items'] : [],
      };
    });
  }, [orders]);

  const normalizedTickets = useMemo<SupportTicketUI[]>(() => {
    return tickets.map((ticket) => {
      // Find customer by email since support_tickets table doesn't have user_id
      const customer = Array.from(customerMap.values()).find(c => c.email === ticket.customer_email);
      const userId = customer?.id || null;

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
        messages: Array.isArray(ticket.messages) ? (ticket.messages as Array<{
          sender?: string;
          role?: string;
          text?: string;
          content?: string;
          createdAt?: string;
          timestamp?: string;
          created_at?: string;
        }>).map(m => ({
          sender: (m.sender === 'admin' || m.role === 'admin') ? 'admin' : 'customer',
          text: (m.text || m.content || '').trim(),
          createdAt: m.createdAt || m.timestamp || m.created_at || new Date().toISOString()
        })) : [],
        imageUrl: typeof ticket.image_url === 'string' ? ticket.image_url : null,
        createdAt: typeof ticket.created_at === 'string' ? ticket.created_at : null,
        updatedAt: typeof ticket.updated_at === 'string' ? ticket.updated_at : null,
        locale: (ticket as any).locale || 'en'
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
        locale: (refund as any).locale || 'en',
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
    // 1. Identify all unique customer "entities" from all sources
    const identityMap = new Map<string, { email: string; name?: string; role?: string; createdAt?: string; id?: string }>();

    // Source A: Registered Users
    customers.forEach((c) => {
      const email = String(c.email || '').toLowerCase();
      if (!email) return;
      identityMap.set(email, {
        id: String(c.id),
        email,
        name: String(c.full_name || c.display_name || c.name || ''),
        role: String(c.role || 'client'),
        createdAt: String(c.created_at || ''),
      });
    });

    // Source B: Orders (Captures Guest Checkouts)
    normalizedOrders.forEach((o) => {
      const email = String(o.customerEmail || '').toLowerCase();
      if (!email || identityMap.has(email)) return;
      identityMap.set(email, {
        email,
        name: email.split('@')[0],
        role: 'guest',
        createdAt: String(o.createdAt || ''),
      });
    });

    // Source C: Support Tickets (Captures Prospective/Support-only users)
    normalizedTickets.forEach((t) => {
      const email = String(t.customerEmail || '').toLowerCase();
      if (!email || identityMap.has(email)) return;
      identityMap.set(email, {
        email,
        name: t.customerName || email.split('@')[0],
        role: 'guest',
        createdAt: String(t.createdAt || ''),
      });
    });

    // 2. Map identities to full summaries with aggregated stats
    return Array.from(identityMap.values()).map((identity) => {
      const email = identity.email;
      const userId = identity.id;

      // Aggregate activity across all tables using either ID or Email
      const customerOrders = normalizedOrders.filter((o) => (userId && o.userId === userId) || o.customerEmail?.toLowerCase() === email);
      const customerTickets = normalizedTickets.filter((t) => (userId && t.userId === userId) || t.customerEmail?.toLowerCase() === email);
      const customerRefunds = normalizedRefunds.filter((r) => (userId && r.userId === userId) || r.customerEmail?.toLowerCase() === email);
      const customerReviews = normalizedReviews.filter((rv) => (userId && rv.userId === userId) || rv.customerEmail?.toLowerCase() === email);

      const lastActivityCandidates = [
        identity.createdAt,
        ...customerOrders.map((o) => o.createdAt),
        ...customerTickets.map((t) => t.updatedAt || t.createdAt),
        ...customerRefunds.map((r) => r.createdAt),
        ...customerReviews.map((rv) => rv.createdAt),
      ].filter((v): v is string => !!v && typeof v === 'string');

      return {
        id: userId || `guest_${email}`,
        email,
        name: identity.name || email.split('@')[0] || 'Customer',
        role: identity.role || 'client',
        createdAt: identity.createdAt || null,
        orderCount: customerOrders.length,
        ticketCount: customerTickets.length,
        refundCount: customerRefunds.length,
        reviewCount: customerReviews.length,
        totalSpent: customerOrders.reduce((sum, o) => sum + Number(o.total || 0), 0),
        lastActiveAt: lastActivityCandidates.sort().at(-1) ?? null,
      };
    });
  }, [customers, normalizedOrders, normalizedRefunds, normalizedReviews, normalizedTickets]);

  const normalizedSubscribers = useMemo(() => {
    const subscriberMap = new Map<string, any>();
    
    // 1. Start with explicit subscribers (source of truth for opt-in/out)
    subscribers.forEach(sub => {
      const email = String(sub.email || '').toLowerCase();
      if (!email) return;
      subscriberMap.set(email, {
        ...sub,
        email,
        status: sub.status === 'unsubscribed' ? 'unsubscribed' : 'subscribed',
        source: String(sub.source || 'newsletter_form'),
        subscribedAt: sub.subscribed_at || sub.created_at || null,
        isExplicit: true
      });
    });

    // 2. Add all other discovered identities as "Registered" leads if not already present
    customerSummaries.forEach(customer => {
      const email = String(customer.email || '').toLowerCase();
      if (!email || subscriberMap.has(email)) return;

      // Only include people with valid contact info (email)
      subscriberMap.set(email, {
        email,
        status: 'registered', // New status for people in Auth but not newsletter table
        source: customer.role === 'admin' ? 'admin_system' : 'user_registration',
        subscribedAt: customer.createdAt,
        customerName: customer.name,
        isExplicit: false
      });
    });

    // 3. Attach metadata to everyone
    return Array.from(subscriberMap.values()).map(sub => {
      const linkedCustomer = customerSummaries.find(c => c.email?.toLowerCase() === sub.email.toLowerCase());
      return {
        ...sub,
        customerName: sub.customerName || linkedCustomer?.name || null,
        role: linkedCustomer?.role || 'client'
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
        orders={normalizedOrders}
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
                onClick={() => setActiveTab(tab.id as 'customers' | 'tickets' | 'refunds' | 'newsletter' | 'reviews')}
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
