"use client";
import React, { useState, useEffect } from 'react';
import { AdminHeader } from './AdminHeader';
import { Mail, Send, X, Calendar, ChevronRight, ChevronDown, Package, ArrowLeft, Users, MessageSquare, Target, Megaphone, BarChart3, Zap, RefreshCcw, Search, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useDebounce } from '../../hooks/useDebounce';
import { createClient } from '@/utils/supabase/client';

const CRM_PILLARS = [
  { id: 'data', title: 'Customer Data Management', icon: Users, description: 'Centralized customer profiles and history.' },
  { id: 'service', title: 'Improved Customer Service', icon: MessageSquare, description: 'Manage tickets and support requests.' },
  { id: 'refunds', title: 'Refunds & Returns', icon: RefreshCcw, description: 'Manage customer refund and return requests.' },
  { id: 'personalization', title: 'Personalization', icon: Target, description: 'Segment and target customer groups.' },
  { id: 'marketing', title: 'Better Marketing Campaigns', icon: Megaphone, description: 'Create and track email/SMS campaigns.' },
  { id: 'analytics', title: 'Tracking and Analytics', icon: BarChart3, description: 'Insightful reports and customer metrics.' },
  { id: 'automation', title: 'Sales Automation', icon: Zap, description: 'Automate workflows and follow-ups.' },
];

export function CustomersAndCRMManager() {
  const supabase = createClient();
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedCustomerOrderId, setExpandedCustomerOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'customers' | 'tickets' | 'refunds' | 'newsletter' | 'reviews'>('customers');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loadingRefunds, setLoadingRefunds] = useState(true);
  const [expandedRefundId, setExpandedRefundId] = useState<string | null>(null);
  const [updatingRefundId, setUpdatingRefundId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSavingReply, setIsSavingReply] = useState(false);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignContent, setCampaignContent] = useState('');
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  const ticketStatusData = React.useMemo(() => {
    const counts: Record<string, number> = { open: 0, 'in-progress': 0, resolved: 0, closed: 0 };
    tickets.forEach(ticket => {
      const status = ticket.status as string;
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tickets]);

  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#6b7280']; // Red, Amber, Emerald, Gray

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error) {
        setCustomers((data ?? []).map((user: any) => ({
          ...user,
          createdAt: user.created_at,
          displayName: user.display_name
        })));
      }
      setLoading(false);
    };

    fetchCustomers();
    const channel = supabase
      .channel('users_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchCustomers)
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const fetchTickets = async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error) {
        setTickets((data ?? []).map((t: any) => ({
          ...t,
          id: t.id,
          customerEmail: t.customer_email,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
          imageUrl: t.image_url
        })));
      }
      setLoadingTickets(false);
    };

    fetchTickets();
    const channel = supabase
      .channel('tickets_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, fetchTickets)
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const fetchRefunds = async () => {
      const { data, error } = await supabase
        .from('refund_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error) {
        setRefunds((data ?? []).map((r: any) => ({
          ...r,
          userId: r.user_id,
          orderId: r.order_id,
          createdAt: r.created_at
        })));
      }
      setLoadingRefunds(false);
    };

    fetchRefunds();
    const channel = supabase
      .channel('refunds_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refund_requests' }, fetchRefunds)
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const fetchSubscribers = async () => {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });
      
      if (!error) {
        setSubscribers((data ?? []).map((s: any) => ({
          ...s,
          subscribedAt: s.subscribed_at
        })));
      }
      setLoadingSubscribers(false);
    };

    fetchSubscribers();
    const channel = supabase
      .channel('newsletter_subscribers_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'newsletter_subscribers' }, fetchSubscribers)
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const fetchCampaigns = async () => {
      const { data, error } = await supabase
        .from('newsletter_campaigns')
        .select('*')
        .order('sent_at', { ascending: false });
      
      if (!error) {
        setCampaigns((data ?? []).map((c: any) => ({
          ...c,
          sentAt: c.sent_at,
          recipientCount: c.recipient_count
        })));
      }
      setLoadingCampaigns(false);
    };

    fetchCampaigns();
    const channel = supabase
      .channel('newsletter_campaigns_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'newsletter_campaigns' }, fetchCampaigns)
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error) {
        setReviews((data ?? []).map((r: any) => ({
          ...r,
          productId: r.product_id,
          userId: r.user_id,
          userName: r.user_name,
          createdAt: r.created_at,
          adminReply: r.admin_reply,
          adminReplyAt: r.admin_reply_at
        })));
      }
      setLoadingReviews(false);
    };

    fetchReviews();
    const channel = supabase
      .channel('reviews_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, fetchReviews)
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleUpdateTicket = async (ticketId: string, updates: any) => {
    setUpdatingTicketId(ticketId);
    const toastId = toast.loading('Updating ticket...');
    try {
      const mappedUpdates = {
        status: updates.status,
        priority: updates.priority,
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase
        .from('support_tickets')
        .update(mappedUpdates)
        .eq('id', ticketId);
      if (error) throw error;
      toast.success('Ticket updated successfully', { id: toastId });
    } catch (error: any) {
      console.error('Error updating ticket:', error);
      toast.error(error.message || 'Failed to update ticket', { id: toastId });
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const handleUpdateRefund = async (refundId: string, updates: any) => {
    setUpdatingRefundId(refundId);
    const toastId = toast.loading('Updating refund request...');
    try {
      const { error } = await supabase
        .from('refund_requests')
        .update({ status: updates.status })
        .eq('id', refundId);
      if (error) throw error;
      toast.success('Refund request updated successfully', { id: toastId });
    } catch (error: any) {
      console.error('Error updating refund:', error);
      toast.error(error.message || 'Failed to update refund', { id: toastId });
    } finally {
      setUpdatingRefundId(null);
    }
  };

  const handleReplyTicket = async (ticketId: string) => {
    if (!ticketReplyText.trim()) return;
    setUpdatingTicketId(ticketId);
    const toastId = toast.loading('Sending reply...');
    try {
      const ticket = tickets.find(t => t.id === ticketId);
      const newMessages = [
        ...(ticket?.messages || []),
        {
          sender: 'admin',
          text: ticketReplyText,
          createdAt: new Date().toISOString()
        }
      ];
      const { error } = await supabase
        .from('support_tickets')
        .update({
          messages: newMessages,
          status: 'in-progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);
      if (error) throw error;
      toast.success('Reply sent successfully', { id: toastId });
      setTicketReplyText('');
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast.error(error.message || 'Failed to send reply', { id: toastId });
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignSubject || !campaignContent) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSendingCampaign(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subject: campaignSubject, content: campaignContent }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send campaign');
      }

      toast.success('Newsletter campaign sent successfully!');
      setIsCampaignModalOpen(false);
      setCampaignSubject('');
      setCampaignContent('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSendingCampaign(false);
    }
  };

  const handleSaveReply = async (review: any) => {
    if (!replyText.trim()) return;
    
    setIsSavingReply(true);
    const toastId = toast.loading('Saving reply...');
    
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          admin_reply: replyText,
          admin_reply_at: new Date().toISOString()
        })
        .eq('id', review.id);
      
      if (error) throw error;
      
      toast.success('Reply saved successfully!', { id: toastId });
      setReplyingTo(null);
      setReplyText('');
    } catch (error: any) {
      console.error('Error saving reply:', error);
      toast.error(error.message || 'Failed to save reply.', { id: toastId });
    } finally {
      setIsSavingReply(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = debouncedSearchQuery.toLowerCase();
    const email = customer.email?.toLowerCase() || '';
    const name = customer.displayName?.toLowerCase() || '';
    return email.includes(searchLower) || name.includes(searchLower);
  });

  useEffect(() => {
    if (selectedCustomer) {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_email', selectedCustomer.email)
          .order('created_at', { ascending: false });
        
        if (!error) {
          setCustomerOrders((data ?? []).map((o: any) => ({
            ...o,
            orderId: o.order_id,
            createdAt: o.created_at,
            items: o.items
          })));
        }
        setLoadingOrders(false);
      };

      fetchOrders();
      const channel = supabase
        .channel('customer_orders_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `customer_email=eq.${selectedCustomer.email}` }, fetchOrders)
        .subscribe();
      
      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedCustomer]);

  if (selectedCustomer) {
    const totalSpent = customerOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <button 
          onClick={() => setSelectedCustomer(null)}
          className="flex items-center text-[11px] font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Back to Dashboard
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded border border-slate-300">
              <div className="flex items-center space-x-5 mb-8">
                <div className="w-16 h-16 bg-slate-900 text-white rounded flex items-center justify-center text-xl font-bold">
                  {selectedCustomer.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 truncate max-w-[180px]" title={selectedCustomer.email}>
                    {selectedCustomer.email.split('@')[0]}
                  </h2>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest mt-2 border ${
                    selectedCustomer.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                  }`}>
                    {selectedCustomer.role || 'client'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center text-sm text-slate-900 font-medium">
                  <Mail className="w-4 h-4 mr-3 text-slate-400" />
                  <span className="truncate">{selectedCustomer.email}</span>
                </div>
                <div className="flex items-center text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  <Calendar className="w-4 h-4 mr-3 text-slate-400" />
                  <span>Subscribed {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded border border-slate-300">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Total Revenue</h3>
              <div className="text-3xl font-bold text-slate-900 mb-1">{totalSpent.toLocaleString()} SEK</div>
              <p className="text-sm font-medium text-slate-500">{customerOrders.length} processed orders</p>
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded border border-slate-300 overflow-hidden shadow-none">
            <div className="p-6 border-b border-slate-200 bg-slate-50/30">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Order History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-300 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingOrders ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[11px]">Syncing history...</td>
                    </tr>
                  ) : customerOrders.length > 0 ? (
                    customerOrders.map((order) => (
                      <React.Fragment key={order.id}>
                        <tr 
                          className="hover:bg-slate-50 transition-colors cursor-pointer group"
                          onClick={() => setExpandedCustomerOrderId(expandedCustomerOrderId === order.id ? null : order.id)}
                        >
                          <td className="px-6 py-4 font-bold text-slate-900 text-sm flex items-center">
                            <div className="w-6 flex items-center shrink-0">
                              {expandedCustomerOrderId === order.id ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                            </div>
                            {order.orderId}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                              order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                            }`}>
                              {order.status || 'Processing'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-right text-sm text-slate-900">{order.total} SEK</td>
                        </tr>
                        {expandedCustomerOrderId === order.id && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={4} className="px-12 py-6 border-b border-slate-200">
                              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Line Items</h4>
                                <div className="space-y-3">
                                  {order.items?.map((item: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                      <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden shrink-0">
                                          {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-slate-300" />}
                                        </div>
                                        <div>
                                          <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Qty: {item.quantity}</p>
                                        </div>
                                      </div>
                                      <p className="font-bold text-slate-900 text-sm">{item.price * item.quantity} SEK</p>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[11px]">No order data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Analytics Suite */}
      <div className="bg-white border border-slate-300 rounded overflow-hidden shadow-none">
        <div className="p-8 border-b border-slate-300 bg-slate-50/30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Customer Support Analytics</h3>
              <p className="text-slate-500 text-sm font-medium mt-1">Status distribution across the help center ecosystem.</p>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              {ticketStatusData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-12 flex items-center justify-center min-h-[400px]">
          {tickets.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={ticketStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={110}
                  outerRadius={150}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {ticketStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #cbd5e1', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    padding: '12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-20">
              <MessageSquare className="w-16 h-16 text-slate-200 mx-auto mb-6" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px]">No support metrics visualized</p>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cloud */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-300 p-6 rounded transition-all hover:border-slate-400">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded flex items-center justify-center text-slate-900">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Total Clients</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{customers.length}</p>
        </div>
        
        <div className="bg-white border border-slate-300 p-6 rounded transition-all hover:border-slate-400">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded flex items-center justify-center text-slate-900">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Open Tickets</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{tickets.filter(t => t.status === 'open').length}</p>
        </div>

        <div className="bg-white border border-slate-300 p-6 rounded transition-all hover:border-slate-400">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded flex items-center justify-center text-slate-900">
              <RefreshCcw className="w-4 h-4" />
            </div>
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Refund Requests</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{refunds.filter(r => r.status === 'Pending').length}</p>
        </div>

        <div className="bg-slate-900 p-6 rounded">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center text-white">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Engagement</h3>
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">Optimized</p>
        </div>
      </div>

      {/* Management Command Center */}
      <div className="bg-white border border-slate-300 rounded overflow-hidden shadow-none">
        <div className="flex px-4 pt-4 bg-slate-50/50 border-b border-slate-300 overflow-x-auto no-scrollbar gap-2">
          {['customers', 'tickets', 'refunds', 'newsletter', 'reviews'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-8 py-3 text-[11px] font-bold uppercase tracking-widest transition-all rounded-t border-t border-x ${activeTab === tab ? 'bg-white text-slate-900 border-slate-300' : 'text-slate-400 hover:text-slate-600 border-transparent'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'customers' && (
            <div className="space-y-8">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by name or email..."
                  className="w-full pl-12 pr-4 h-11 bg-white border border-slate-300 rounded text-sm font-medium focus:outline-none focus:border-slate-900 transition-all text-slate-900"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-300 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
                      <th className="px-6 py-4">Client Identity</th>
                      <th className="px-6 py-4">Registration</th>
                      <th className="px-6 py-4">Auth Class</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[11px]">Database query returned 0 results</td>
                      </tr>
                    ) : filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="group hover:bg-slate-50 transition-colors cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-900 text-white rounded flex items-center justify-center text-[10px] font-bold shrink-0">
                              {customer.email.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-900 text-sm">{customer.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-500">
                          {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                            customer.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                          }`}>
                            {customer.role || 'client'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setSelectedCustomer(customer)} 
                            className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                          >
                            Explore Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-300 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
                    <th className="px-6 py-4">Requester</th>
                    <th className="px-6 py-4">Topic</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[11px]">Help center is currently empty</td>
                    </tr>
                  ) : tickets.map((ticket) => (
                    <React.Fragment key={ticket.id}>
                      <tr 
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)}
                      >
                        <td className="px-6 py-4 font-bold text-slate-900 text-sm flex items-center">
                          <div className="w-6 flex items-center shrink-0">
                            {expandedTicketId === ticket.id ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                          </div>
                          {ticket.customerEmail}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-500">{ticket.subject}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                            ticket.status === 'open' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                            ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{ticket.priority || 'NORMAL'}</td>
                      </tr>
                      {expandedTicketId === ticket.id && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={4} className="px-12 py-8 border-b border-slate-200">
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                              <div className="lg:col-span-2 space-y-8">
                                <div>
                                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Internal Inquiry Description</h4>
                                  <div className="bg-white p-6 rounded border border-slate-200 text-sm text-slate-900 font-medium leading-relaxed">
                                    {ticket.description || 'No system description provided.'}
                                  </div>
                                  {ticket.imageUrl && (
                                    <div className="mt-6">
                                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Evidence Attachment</h4>
                                      <a href={ticket.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-block rounded overflow-hidden border border-slate-200">
                                        <img src={ticket.imageUrl} alt="" className="max-w-xs transition-transform hover:scale-105" />
                                      </a>
                                    </div>
                                  )}
                                </div>

                                  <div>
                                    <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Conversation</h4>
                                    <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                      {ticket.messages?.map((msg: any, idx: number) => (
                                        <div key={idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                          <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                                            msg.sender === 'admin' ? 'bg-zinc-900 text-white rounded-tr-none' : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-none'
                                          }`}>
                                            <p>{msg.text}</p>
                                            <span className={`text-[10px] block mt-1 ${msg.sender === 'admin' ? 'text-zinc-400' : 'text-zinc-400'}`}>
                                              {new Date(msg.createdAt).toLocaleString()}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                      {(!ticket.messages || ticket.messages.length === 0) && (
                                        <p className="text-sm text-zinc-400 italic">No replies yet.</p>
                                      )}
                                    <div className="flex gap-2">
                                      <textarea
                                        value={ticketReplyText}
                                        onChange={(e) => setTicketReplyText(e.target.value)}
                                        placeholder="Type your reply..."
                                        className="flex-1 bg-white border border-slate-300 text-slate-900 text-sm rounded focus:outline-none focus:border-slate-900 block p-4 min-h-[100px] font-medium"
                                      />
                                      <button
                                        onClick={() => handleReplyTicket(ticket.id)}
                                        disabled={!ticketReplyText.trim() || updatingTicketId === ticket.id}
                                        className="bg-slate-900 text-white px-6 rounded font-bold text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-2 shrink-0 h-auto"
                                      >
                                        <Send className="w-4 h-4" />
                                        <span>Dispatch</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-8">
                                <div>
                                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Lifecycle Control</h4>
                                  <div className="bg-white p-6 rounded border border-slate-200 space-y-6">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Stage</label>
                                      <select
                                        value={ticket.status}
                                        onChange={(e) => handleUpdateTicket(ticket.id, { status: e.target.value })}
                                        disabled={updatingTicketId === ticket.id}
                                        className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded focus:outline-none focus:border-slate-900 block w-full p-3 font-bold uppercase tracking-wider appearance-none"
                                      >
                                        <option value="open">Opened</option>
                                        <option value="in-progress">Consulting</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Archived</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Priority Matrix</label>
                                      <select
                                        value={ticket.priority || 'medium'}
                                        onChange={(e) => handleUpdateTicket(ticket.id, { priority: e.target.value })}
                                        disabled={updatingTicketId === ticket.id}
                                        className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded focus:outline-none focus:border-slate-900 block w-full p-3 font-bold uppercase tracking-wider appearance-none"
                                      >
                                        <option value="low">P3 - Low</option>
                                        <option value="medium">P2 - Normal</option>
                                        <option value="high">P1 - High</option>
                                        <option value="urgent">P0 - Critical</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'refunds' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-300 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
                    <th className="px-6 py-4">Claimant Identity</th>
                    <th className="px-6 py-4">Primary Reason</th>
                    <th className="px-6 py-4">Decision</th>
                    <th className="px-6 py-4">Submission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {refunds.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[11px]">No active claims detected</td>
                    </tr>
                  ) : refunds.map((refund) => (
                    <React.Fragment key={refund.id}>
                      <tr 
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => setExpandedRefundId(expandedRefundId === refund.id ? null : refund.id)}
                      >
                        <td className="px-6 py-4 font-bold text-slate-900 text-sm flex items-center">
                          <div className="w-6 flex items-center shrink-0">
                            {expandedRefundId === refund.id ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                          </div>
                          {refund.userId}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-500">{refund.reason}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                            refund.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                          }`}>
                            {refund.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          {refund.createdAt ? new Date(refund.createdAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                      {expandedRefundId === refund.id && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={4} className="px-12 py-8 border-b border-slate-200">
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-12">
                              <div>
                                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Claim Metadata</h4>
                                <div className="bg-white p-6 rounded border border-slate-200 text-sm text-slate-900 font-medium space-y-4 shadow-sm">
                                  <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">System Order ID</span>
                                    <span className="font-bold font-mono">{refund.orderId || 'N/A'}</span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Justification</span>
                                    <span>{refund.reason}</span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Detailed Description</span>
                                    <span>{refund.description || 'No system justification provided.'}</span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Administrative Decision</h4>
                                <div className="bg-white p-6 rounded border border-slate-200">
                                  <div className="flex items-center space-x-4">
                                    <select
                                      value={refund.status || 'Pending'}
                                      onChange={(e) => handleUpdateRefund(refund.id, { status: e.target.value })}
                                      disabled={updatingRefundId === refund.id}
                                      className="flex-1 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded focus:outline-none focus:border-slate-900 block p-3 font-bold uppercase tracking-wider appearance-none"
                                    >
                                      <option value="Pending">Queue - Pending</option>
                                      <option value="Approved">Auth - Approved (Refund)</option>
                                      <option value="Replaced">Auth - Approved (Replacement)</option>
                                      <option value="Rejected">Void - Rejected</option>
                                    </select>
                                    {updatingRefundId === refund.id && <RefreshCcw className="w-5 h-5 animate-spin text-slate-400" />}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'newsletter' && (
            <div className="space-y-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Broadcast Center</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">Global management of subscriber lists and automated campaigns.</p>
                </div>
                <button 
                  onClick={() => setIsCampaignModalOpen(true)}
                  className="px-8 py-3 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest rounded hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-sm"
                >
                  <Mail className="w-4 h-4" />
                  Initiate Campaign
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 bg-white border border-slate-300 rounded overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-300 bg-slate-50/50">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Database Entry: Active Subscribers</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-300 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
                          <th className="px-6 py-4">Identity</th>
                          <th className="px-6 py-4">System State</th>
                          <th className="px-6 py-4">Opt-in Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {subscribers.length === 0 ? (
                          <tr><td colSpan={3} className="py-20 text-center text-slate-400 uppercase tracking-widest font-bold text-[11px]">Subscriber registry is empty</td></tr>
                        ) : subscribers.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900 text-sm">{sub.email}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                                sub.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                              }`}>
                                {sub.status || 'active'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-xs font-bold uppercase tracking-widest">
                              {sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white border border-slate-300 rounded overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-300 bg-slate-50/50">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Campaign History</h4>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {campaigns.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 uppercase tracking-widest font-bold text-[11px]">No archived broadcasts</div>
                    ) : campaigns.map((campaign) => (
                      <div key={campaign.id} className="p-6 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h5 className="font-bold text-slate-900 text-sm leading-tight">{campaign.subject}</h5>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap">
                            {new Date(campaign.sentAt).toLocaleDateString()}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                          <span className="text-[10px] text-slate-900 font-bold uppercase tracking-widest">
                            {campaign.recipientCount} REACH
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
                            SENT
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Campaign Modal */}
              <AnimatePresence>
                {isCampaignModalOpen && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCampaignModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }} className="relative w-full max-w-3xl bg-white rounded border border-slate-300 shadow-2xl overflow-hidden">
                      <div className="p-10">
                        <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-8">
                          <div>
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">New Broadcast Campaign</h3>
                            <p className="text-slate-500 text-sm font-medium mt-1">Transmitting to {subscribers.length} verified system subscribers.</p>
                          </div>
                          <button onClick={() => setIsCampaignModalOpen(false)} className="p-3 hover:bg-slate-100 rounded transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
                        </div>

                        <form onSubmit={handleSendCampaign} className="space-y-8">
                          <div className="space-y-3">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Communication Subject</label>
                            <input 
                              type="text" value={campaignSubject} onChange={(e) => setCampaignSubject(e.target.value)}
                              placeholder="e.g., Seasonal Protocol: Exclusive Winter Access! ❄️"
                              className="w-full px-6 h-12 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:border-slate-900 transition-all font-bold text-slate-900"
                              required
                            />
                          </div>

                          <div className="space-y-3">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Markup Content (HTML Enabled)</label>
                            <textarea 
                              value={campaignContent} onChange={(e) => setCampaignContent(e.target.value)}
                              placeholder="System content goes here... Parsed HTML accepted."
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:border-slate-900 transition-all font-bold text-slate-900 min-h-[300px] resize-none"
                              required
                            />
                          </div>

                          <div className="flex items-center gap-6 pt-6">
                            <button 
                              type="button" onClick={() => setIsCampaignModalOpen(false)}
                              className="flex-1 px-8 py-4 border border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-widest rounded hover:bg-slate-50 transition-all"
                            >
                              Abort
                            </button>
                            <button 
                              type="submit" disabled={isSendingCampaign}
                              className="flex-[2] px-8 py-4 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest rounded hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                              {isSendingCampaign ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              Dispatch Broadcast Now
                            </button>
                          </div>
                        </form>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-10">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Public Feedback Terminal</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">Cross-referencing consumer satisfaction across the product catalog.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-300 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
                      <th className="px-6 py-4">Client Identity</th>
                      <th className="px-6 py-4">Rating Index</th>
                      <th className="px-6 py-4">System Narrative</th>
                      <th className="px-6 py-4">Detection</th>
                      <th className="px-6 py-4 text-right">Engagement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reviews.length === 0 ? (
                      <tr><td colSpan={5} className="py-20 text-center text-slate-400 uppercase tracking-widest font-bold text-[11px]">No feedback packets retrieved</td></tr>
                    ) : reviews.map((review) => (
                      <tr key={review.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => {
                              const customer = customers.find(c => c.id === review.userId);
                              if (customer) setSelectedCustomer(customer);
                              else toast.error('Client registry mismatch detected.');
                            }}
                            className="flex flex-col text-left group"
                          >
                            <span className="font-bold text-slate-900 text-sm group-hover:underline">{review.userName}</span>
                            <span className="text-[10px] text-slate-400 font-mono font-bold tracking-tight uppercase">{review.userId.slice(0, 8)}...</span>
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex text-slate-900">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-slate-200'}`} />
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-500 text-sm font-medium max-w-sm line-clamp-2" title={review.comment}>{review.comment}</p>
                        </td>
                        <td className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end gap-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                              review.rating >= 4 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                              review.rating <= 2 ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                              {review.rating >= 4 ? 'Positive' : review.rating <= 2 ? 'Negative' : 'Neutral'}
                            </span>
                            <button 
                              onClick={() => {
                                setReplyingTo(replyingTo === review.id ? null : review.id);
                                setReplyText(review.adminReply || '');
                              }}
                              className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                            >
                              {review.adminReply ? 'Revise Proxy' : 'Engage Client'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Reply Modal */}
              <AnimatePresence>
                {replyingTo && (
                  <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setReplyingTo(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }} className="relative w-full max-w-xl bg-white rounded border border-slate-300 shadow-2xl overflow-hidden">
                      <div className="p-10">
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Proxy Reply Interface</h3>
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">Responding to: {reviews.find(r => r.id === replyingTo)?.userName}</p>
                          </div>
                          <button onClick={() => setReplyingTo(null)} className="p-3 hover:bg-slate-100 rounded transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>

                        <div className="mb-8 p-6 bg-slate-50 rounded border border-slate-200">
                          <p className="text-slate-900 text-sm font-bold leading-relaxed italic">
                            "{reviews.find(r => r.id === replyingTo)?.comment}"
                          </p>
                        </div>

                        <div className="space-y-6">
                          <textarea 
                            value={replyText} onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Drafting system response..."
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:border-slate-900 transition-all font-bold text-slate-900 min-h-[150px] resize-none"
                          />
                          <div className="flex gap-4">
                            <button 
                              onClick={() => setReplyingTo(null)}
                              className="flex-1 px-8 py-3 border border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-widest rounded hover:bg-slate-50 transition-all"
                            >
                              Discard
                            </button>
                            <button 
                              onClick={() => handleSaveReply(reviews.find(r => r.id === replyingTo))}
                              disabled={isSavingReply || !replyText.trim()}
                              className="flex-[2] px-8 py-3 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest rounded hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                              {isSavingReply ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                              Authorize & Publish
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
