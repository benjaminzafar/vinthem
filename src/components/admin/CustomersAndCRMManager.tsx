"use client";
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { AdminHeader } from './AdminHeader';
import { Mail, Send, X, Calendar, ChevronRight, ChevronDown, Package, ArrowLeft, Users, MessageSquare, Target, Megaphone, BarChart3, Zap, RefreshCcw, Search, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useDebounce } from '../../hooks/useDebounce';

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
      if (counts[ticket.status] !== undefined) {
        counts[ticket.status]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tickets]);

  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#6b7280']; // Red, Amber, Emerald, Gray

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingTickets(false);
    }, (error) => {
      setLoadingTickets(false);
      handleFirestoreError(error, OperationType.LIST, 'tickets');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'refund_requests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRefunds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingRefunds(false);
    }, (error) => {
      setLoadingRefunds(false);
      handleFirestoreError(error, OperationType.LIST, 'refund_requests');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'newsletter_subscribers'), orderBy('subscribedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSubscribers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingSubscribers(false);
    }, (error) => {
      setLoadingSubscribers(false);
      handleFirestoreError(error, OperationType.LIST, 'newsletter_subscribers');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'newsletter_campaigns'), orderBy('sentAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingCampaigns(false);
    }, (error) => {
      setLoadingCampaigns(false);
      handleFirestoreError(error, OperationType.LIST, 'newsletter_campaigns');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Using collectionGroup to fetch all reviews from all products
    import('firebase/firestore').then(({ collectionGroup }) => {
      const q = query(collectionGroup(db, 'reviews'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoadingReviews(false);
      }, (error) => {
        setLoadingReviews(false);
        handleFirestoreError(error, OperationType.LIST, 'reviews');
      });
      return () => unsubscribe();
    });
  }, []);

  const handleUpdateTicket = async (ticketId: string, updates: any) => {
    setUpdatingTicketId(ticketId);
    const toastId = toast.loading('Updating ticket...');
    try {
      await updateDoc(doc(db, 'tickets', ticketId), updates);
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
      await updateDoc(doc(db, 'refund_requests', refundId), updates);
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
      await updateDoc(doc(db, 'tickets', ticketId), {
        messages: arrayUnion({
          sender: 'admin',
          text: ticketReplyText,
          createdAt: new Date().toISOString()
        }),
        status: 'in-progress', // Auto-update status when replying
        updatedAt: new Date().toISOString()
      });
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
      const token = await auth.currentUser?.getIdToken();
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
      const { updateDoc, doc } = await import('firebase/firestore');
      const reviewRef = doc(db, 'products', review.productId, 'reviews', review.id!);
      
      await updateDoc(reviewRef, {
        adminReply: replyText,
        adminReplyAt: new Date().toISOString()
      });
      
      toast.success('Reply saved successfully!', { id: toastId });
      setReplyingTo(null);
      setReplyText('');
    } catch (error) {
      console.error('Error saving reply:', error);
      toast.error('Failed to save reply.', { id: toastId });
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
      setLoadingOrders(true);
      const q = query(collection(db, 'orders'), where('customerEmail', '==', selectedCustomer.email));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
        orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setCustomerOrders(orders);
        setLoadingOrders(false);
      }, (error) => {
        setLoadingOrders(false);
        handleFirestoreError(error, OperationType.LIST, 'orders');
      });
      return () => unsubscribe();
    }
  }, [selectedCustomer]);

  if (selectedCustomer) {
    const totalSpent = customerOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedCustomer(null)}
          className="flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to CRM
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-zinc-200">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-zinc-900 text-white rounded-full flex items-center justify-center text-2xl font-sans">
                  {selectedCustomer.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 truncate max-w-[200px]" title={selectedCustomer.email}>
                    {selectedCustomer.email.split('@')[0]}
                  </h2>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                    selectedCustomer.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-zinc-100 text-zinc-800'
                  }`}>
                    {selectedCustomer.role || 'client'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center text-sm text-zinc-600">
                  <Mail className="w-4 h-4 mr-3 text-zinc-400" />
                  <span className="truncate">{selectedCustomer.email}</span>
                </div>
                <div className="flex items-center text-sm text-zinc-600">
                  <Calendar className="w-4 h-4 mr-3 text-zinc-400" />
                  <span>Joined {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-zinc-200">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Lifetime Value</h3>
              <div className="text-3xl font-bold text-zinc-900 mb-1">{totalSpent.toLocaleString()} SEK</div>
              <p className="text-sm text-zinc-500">{customerOrders.length} total orders</p>
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl border border-zinc-200">
            <div className="p-6 border-b border-zinc-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-zinc-900">Order History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500">
                    <th className="px-6 py-4 font-semibold">Order ID</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loadingOrders ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-zinc-500">Loading orders...</td>
                    </tr>
                  ) : customerOrders.length > 0 ? (
                    customerOrders.map((order) => (
                      <React.Fragment key={order.id}>
                        <tr 
                          className="hover:bg-zinc-50 transition-colors cursor-pointer"
                          onClick={() => setExpandedCustomerOrderId(expandedCustomerOrderId === order.id ? null : order.id)}
                        >
                          <td className="px-6 py-4 font-medium font-mono text-sm flex items-center">
                            {expandedCustomerOrderId === order.id ? <ChevronDown className="w-4 h-4 mr-2 text-zinc-400" /> : <ChevronRight className="w-4 h-4 mr-2 text-zinc-400" />}
                            {order.orderId}
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {order.status || 'Processing'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-right text-sm">{order.total} SEK</td>
                        </tr>
                        {expandedCustomerOrderId === order.id && (
                          <tr className="bg-zinc-50/50">
                            <td colSpan={4} className="p-0">
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                className="px-8 py-6 border-t border-zinc-100"
                              >
                                <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Order Items</h4>
                                <div className="space-y-3">
                                  {order.items?.map((item: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded border border-zinc-100">
                                      <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-zinc-100 rounded flex items-center justify-center overflow-hidden">
                                          {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                          ) : (
                                            <Package className="w-5 h-5 text-zinc-400" />
                                          )}
                                        </div>
                                        <div>
                                          <p className="font-medium text-zinc-900 text-sm">{item.name}</p>
                                          <p className="text-xs text-zinc-500">Quantity: {item.quantity}</p>
                                        </div>
                                      </div>
                                      <p className="font-medium text-zinc-900 text-sm">{item.price * item.quantity} SEK</p>
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
                      <td colSpan={4} className="p-8 text-center text-zinc-500">No orders found for this customer.</td>
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Primary Analytics: Ticket Status Overview */}
      <div className="bg-white border border-zinc-100 rounded-3xl p-4 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-xl font-black text-zinc-900 tracking-tight">Support Performance</h3>
            <p className="text-zinc-500 text-sm font-medium">Real-time distribution of customer inquiries and status.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {ticketStatusData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-[10px] sm:text-xs font-bold text-zinc-600 uppercase tracking-wider">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="h-[300px] sm:h-[400px] w-full flex items-center justify-center">
          {tickets.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ticketStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={100}
                  outerRadius={140}
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
                    borderRadius: '16px', 
                    border: '1px solid #f4f4f5', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.05)',
                    padding: '12px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-zinc-200" />
              </div>
              <p className="text-zinc-400 font-bold text-lg">No support data to visualize</p>
              <p className="text-zinc-300 text-sm">Tickets will appear here once customers reach out.</p>
            </div>
          )}
        </div>
      </div>

      {/* Minimalist Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-zinc-50 border border-zinc-100 p-6 rounded-2xl transition-colors hover:bg-zinc-100/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-white border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-900">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Database</h3>
          </div>
          <p className="text-3xl font-black text-zinc-900">{customers.length}</p>
          <p className="text-zinc-400 text-xs font-bold mt-1">TOTAL CUSTOMERS</p>
        </div>
        
        <div className="bg-zinc-50 border border-zinc-100 p-6 rounded-2xl transition-colors hover:bg-zinc-100/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-white border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-900">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Support</h3>
          </div>
          <p className="text-3xl font-black text-zinc-900">{tickets.filter(t => t.status === 'open').length}</p>
          <p className="text-zinc-400 text-xs font-bold mt-1">OPEN TICKETS</p>
        </div>

        <div className="bg-zinc-50 border border-zinc-100 p-6 rounded-2xl transition-colors hover:bg-zinc-100/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-white border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-900">
              <RefreshCcw className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Returns</h3>
          </div>
          <p className="text-3xl font-black text-zinc-900">{refunds.filter(r => r.status === 'Pending').length}</p>
          <p className="text-zinc-400 text-xs font-bold mt-1">PENDING REFUNDS</p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-white">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">System</h3>
          </div>
          <p className="text-3xl font-black text-white">Active</p>
          <p className="text-zinc-500 text-xs font-bold mt-1">AUTOMATION STATUS</p>
        </div>
      </div>

      {/* Main CRM Content Tabs */}
      <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden">
        <div className="flex px-2 pt-2 bg-zinc-50/50 border-b border-zinc-100 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('customers')}
            className={`px-4 sm:px-8 py-3 sm:py-4 text-[10px] sm:text-sm font-black tracking-tight transition-all rounded-t-2xl whitespace-nowrap ${activeTab === 'customers' ? 'bg-white text-zinc-900 border-x border-t border-zinc-100' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            Customer Database
          </button>
          <button 
            onClick={() => setActiveTab('tickets')}
            className={`px-4 sm:px-8 py-3 sm:py-4 text-[10px] sm:text-sm font-black tracking-tight transition-all rounded-t-2xl whitespace-nowrap ${activeTab === 'tickets' ? 'bg-white text-zinc-900 border-x border-t border-zinc-100' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            Support Tickets
          </button>
          <button 
            onClick={() => setActiveTab('refunds')}
            className={`px-4 sm:px-8 py-3 sm:py-4 text-[10px] sm:text-sm font-black tracking-tight transition-all rounded-t-2xl whitespace-nowrap ${activeTab === 'refunds' ? 'bg-white text-zinc-900 border-x border-t border-zinc-100' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            Refund Requests
          </button>
          <button 
            onClick={() => setActiveTab('newsletter')}
            className={`px-4 sm:px-8 py-3 sm:py-4 text-[10px] sm:text-sm font-black tracking-tight transition-all rounded-t-2xl whitespace-nowrap ${activeTab === 'newsletter' ? 'bg-white text-zinc-900 border-x border-t border-zinc-100' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            Newsletter Subscribers
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`px-4 sm:px-8 py-3 sm:py-4 text-[10px] sm:text-sm font-black tracking-tight transition-all rounded-t-2xl whitespace-nowrap ${activeTab === 'reviews' ? 'bg-white text-zinc-900 border-x border-t border-zinc-100' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            Customer Reviews
          </button>
        </div>

        <div className="p-4 sm:p-8">
          {activeTab === 'customers' && (
            <div className="space-y-6 sm:y-8">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                />
              </div>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-black">
                      <th className="px-4 sm:px-6 py-4">Customer Profile</th>
                      <th className="px-4 sm:px-6 py-4">Registration Date</th>
                      <th className="px-4 sm:px-6 py-4">Access Level</th>
                      <th className="px-4 sm:px-6 py-4 text-right">Management</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="group hover:bg-zinc-50/50 transition-colors">
                        <td className="px-4 sm:px-6 py-4 sm:py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0">
                              {customer.email.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-zinc-900 text-sm truncate max-w-[150px] sm:max-w-none">{customer.email}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5 text-zinc-500 text-xs sm:text-sm font-medium">
                          {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            customer.role === 'admin' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
                          }`}>
                            {customer.role || 'client'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                          <button 
                            onClick={() => setSelectedCustomer(customer)} 
                            className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                          >
                            View Details
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
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-black">
                    <th className="px-4 sm:px-6 py-4">Customer</th>
                    <th className="px-4 sm:px-6 py-4">Subject</th>
                    <th className="px-4 sm:px-6 py-4">Status</th>
                    <th className="px-4 sm:px-6 py-4">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {tickets.map((ticket) => (
                    <React.Fragment key={ticket.id}>
                      <tr 
                        className="hover:bg-zinc-50/50 transition-colors cursor-pointer group"
                        onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)}
                      >
                        <td className="px-4 sm:px-6 py-4 sm:py-5 font-bold text-zinc-900 text-sm flex items-center">
                          {expandedTicketId === ticket.id ? <ChevronDown className="w-4 h-4 mr-2 text-zinc-400 shrink-0" /> : <ChevronRight className="w-4 h-4 mr-2 text-zinc-400 shrink-0" />}
                          <span className="truncate max-w-[150px] sm:max-w-none">{ticket.customerEmail}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5 text-zinc-500 text-xs sm:text-sm font-medium">{ticket.subject}</td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            ticket.status === 'open' ? 'bg-rose-50 text-rose-600' : 
                            ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5 text-zinc-500 text-[10px] font-medium uppercase tracking-widest">{ticket.priority || 'NORMAL'}</td>
                      </tr>
                      {expandedTicketId === ticket.id && (
                        <tr>
                          <td colSpan={4} className="p-0 bg-zinc-50/50 border-b border-zinc-100">
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }} 
                              animate={{ opacity: 1, height: 'auto' }} 
                              className="px-8 sm:px-12 py-6"
                            >
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                  <div>
                                    <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Original Message</h4>
                                    <div className="bg-white p-4 rounded-xl border border-zinc-100 text-sm text-zinc-600">
                                      {ticket.description || 'No description provided.'}
                                    </div>
                                    {ticket.imageUrl && (
                                      <div className="mt-4">
                                        <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Attached Image</h4>
                                        <a href={ticket.imageUrl} target="_blank" rel="noopener noreferrer">
                                          <img src={ticket.imageUrl} alt="Attachment" className="max-w-xs rounded-lg border border-zinc-200" />
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
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      <textarea
                                        value={ticketReplyText}
                                        onChange={(e) => setTicketReplyText(e.target.value)}
                                        placeholder="Type your reply..."
                                        className="flex-1 bg-white border border-zinc-200 text-zinc-900 text-sm rounded-xl focus:ring-zinc-900 focus:border-zinc-900 block p-3 min-h-[80px] resize-none"
                                      />
                                      <button
                                        onClick={() => handleReplyTicket(ticket.id)}
                                        disabled={!ticketReplyText.trim() || updatingTicketId === ticket.id}
                                        className="bg-zinc-900 text-white px-4 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50 flex flex-col items-center justify-center gap-1"
                                      >
                                        <Send className="w-4 h-4" />
                                        <span>Send</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Ticket Actions</h4>
                                  <div className="bg-white p-5 rounded-xl border border-zinc-100 space-y-4">
                                    <div>
                                      <label className="block text-xs font-bold text-zinc-700 mb-2">Update Status</label>
                                      <select
                                        value={ticket.status}
                                        onChange={(e) => handleUpdateTicket(ticket.id, { status: e.target.value })}
                                        disabled={updatingTicketId === ticket.id}
                                        className="bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm rounded-lg focus:ring-zinc-900 focus:border-zinc-900 block w-full p-2.5"
                                      >
                                        <option value="open">Open</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold text-zinc-700 mb-2">Update Priority</label>
                                      <select
                                        value={ticket.priority || 'medium'}
                                        onChange={(e) => handleUpdateTicket(ticket.id, { priority: e.target.value })}
                                        disabled={updatingTicketId === ticket.id}
                                        className="bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm rounded-lg focus:ring-zinc-900 focus:border-zinc-900 block w-full p-2.5"
                                      >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
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
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-black">
                    <th className="px-4 sm:px-6 py-4">User ID</th>
                    <th className="px-4 sm:px-6 py-4">Reason</th>
                    <th className="px-4 sm:px-6 py-4">Status</th>
                    <th className="px-4 sm:px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {refunds.map((refund) => (
                    <React.Fragment key={refund.id}>
                      <tr 
                        className="hover:bg-zinc-50/50 transition-colors cursor-pointer group"
                        onClick={() => setExpandedRefundId(expandedRefundId === refund.id ? null : refund.id)}
                      >
                        <td className="px-4 sm:px-6 py-4 sm:py-5 font-bold text-zinc-900 text-sm flex items-center">
                          {expandedRefundId === refund.id ? <ChevronDown className="w-4 h-4 mr-2 text-zinc-400 shrink-0" /> : <ChevronRight className="w-4 h-4 mr-2 text-zinc-400 shrink-0" />}
                          <span className="truncate max-w-[120px] sm:max-w-[150px]">{refund.userId}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5 text-zinc-500 text-xs sm:text-sm font-medium">{refund.reason}</td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            refund.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-zinc-100 text-zinc-500'
                          }`}>
                            {refund.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5 text-zinc-500 text-xs sm:text-sm font-medium">
                          {refund.createdAt ? new Date(refund.createdAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                      {expandedRefundId === refund.id && (
                        <tr>
                          <td colSpan={4} className="p-0 bg-zinc-50/50 border-b border-zinc-100">
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }} 
                              animate={{ opacity: 1, height: 'auto' }} 
                              className="px-8 sm:px-12 py-6"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Refund Details</h4>
                                  <div className="bg-white p-4 rounded-xl border border-zinc-100 text-sm text-zinc-600 space-y-2">
                                    <p><strong>Order ID:</strong> {refund.orderId || 'N/A'}</p>
                                    <p><strong>Reason:</strong> {refund.reason}</p>
                                    <p><strong>Description:</strong> {refund.description || 'No description provided.'}</p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Update Status</h4>
                                  <div className="bg-white p-5 rounded-xl border border-zinc-100">
                                    <div className="flex items-center space-x-3">
                                      <select
                                        value={refund.status || 'Pending'}
                                        onChange={(e) => handleUpdateRefund(refund.id, { status: e.target.value })}
                                        disabled={updatingRefundId === refund.id}
                                        className="flex-1 bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm rounded-lg focus:ring-zinc-900 focus:border-zinc-900 block w-full p-2.5"
                                      >
                                        <option value="Pending">Pending</option>
                                        <option value="Approved">Approved (Refund)</option>
                                        <option value="Replaced">Approved (Replacement)</option>
                                        <option value="Rejected">Rejected</option>
                                      </select>
                                      {updatingRefundId === refund.id && <RefreshCcw className="w-5 h-5 animate-spin text-zinc-400" />}
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

          {activeTab === 'newsletter' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-zinc-900">Newsletter Management</h3>
                  <p className="text-sm text-zinc-500">Manage your subscribers and send email campaigns.</p>
                </div>
                <button 
                  onClick={() => setIsCampaignModalOpen(true)}
                  className="px-6 py-3 bg-zinc-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Send Campaign
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-zinc-100 rounded-3xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Subscribers List</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-black">
                          <th className="px-6 py-4">Subscriber Email</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Date Subscribed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {subscribers.map((sub) => (
                          <tr key={sub.id} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-zinc-900 text-sm">{sub.email}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                sub.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500'
                              }`}>
                                {sub.status || 'active'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-zinc-500 text-xs font-medium">
                              {sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))}
                        {subscribers.length === 0 && (
                          <tr>
                            <td colSpan={3} className="p-12 text-center text-zinc-400 font-medium">
                              No newsletter subscribers found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Recent Campaigns</h4>
                  </div>
                  <div className="divide-y divide-zinc-50">
                    {campaigns.map((campaign) => (
                      <div key={campaign.id} className="p-4 hover:bg-zinc-50 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h5 className="font-bold text-zinc-900 text-sm truncate">{campaign.subject}</h5>
                          <span className="text-[10px] font-black text-zinc-400 whitespace-nowrap">
                            {new Date(campaign.sentAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500 font-medium">
                            {campaign.recipientCount} recipients
                          </span>
                          <span className="w-1 h-1 rounded-full bg-zinc-200" />
                          <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">
                            {campaign.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {campaigns.length === 0 && (
                      <div className="p-12 text-center text-zinc-400 text-xs font-medium">
                        No campaigns sent yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Campaign Modal */}
              <AnimatePresence>
                {isCampaignModalOpen && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsCampaignModalOpen(false)}
                      className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
                    />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                      <div className="p-8 sm:p-10">
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Create Campaign</h3>
                            <p className="text-zinc-500 text-sm font-medium">Send a newsletter to all {subscribers.length} active subscribers.</p>
                          </div>
                          <button 
                            onClick={() => setIsCampaignModalOpen(false)}
                            className="p-3 hover:bg-zinc-100 rounded-2xl transition-colors"
                          >
                            <X className="w-6 h-6 text-zinc-400" />
                          </button>
                        </div>

                        <form onSubmit={handleSendCampaign} className="space-y-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">
                              Email Subject
                            </label>
                            <input 
                              type="text"
                              value={campaignSubject}
                              onChange={(e) => setCampaignSubject(e.target.value)}
                              placeholder="e.g., Exclusive 20% Discount Code Inside! 🎁"
                              className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all font-bold text-zinc-900 placeholder:text-zinc-300"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">
                              Email Content (HTML Supported)
                            </label>
                            <textarea 
                              value={campaignContent}
                              onChange={(e) => setCampaignContent(e.target.value)}
                              placeholder="Write your newsletter content here... You can use <p>, <b>, <a> tags etc."
                              className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all font-bold text-zinc-900 placeholder:text-zinc-300 min-h-[250px] resize-none"
                              required
                            />
                          </div>

                          <div className="flex items-center gap-4 pt-4">
                            <button 
                              type="button"
                              onClick={() => setIsCampaignModalOpen(false)}
                              className="flex-1 px-8 py-4 border border-zinc-100 text-zinc-400 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-50 transition-all"
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit"
                              disabled={isSendingCampaign}
                              className="flex-[2] px-8 py-4 bg-zinc-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {isSendingCampaign ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4" />
                                  Send Newsletter Now
                                </>
                              )}
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
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-zinc-900">Customer Reviews</h3>
                  <p className="text-sm text-zinc-500">Monitor and manage product feedback from your customers.</p>
                </div>
              </div>

              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-black">
                      <th className="px-4 sm:px-6 py-4">Customer</th>
                      <th className="px-4 sm:px-6 py-4">Rating</th>
                      <th className="px-4 sm:px-6 py-4">Comment</th>
                      <th className="px-4 sm:px-6 py-4">Date</th>
                      <th className="px-4 sm:px-6 py-4 text-right">Sentiment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {reviews.map((review) => (
                      <tr key={review.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-4 sm:px-6 py-4 sm:py-5">
                          <button 
                            onClick={() => {
                              const customer = customers.find(c => c.id === review.userId);
                              if (customer) {
                                setSelectedCustomer(customer);
                              } else {
                                toast.error('Customer profile not found in database.');
                              }
                            }}
                            className="flex flex-col text-left hover:opacity-70 transition-opacity group"
                          >
                            <span className="font-bold text-zinc-900 text-sm group-hover:underline">{review.userName}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">{review.userId}</span>
                          </button>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5">
                          <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-zinc-200'}`} />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5">
                          <p className="text-zinc-600 text-xs sm:text-sm font-medium max-w-md line-clamp-2" title={review.comment}>
                            {review.comment}
                          </p>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5 text-zinc-500 text-xs sm:text-sm font-medium">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              review.rating >= 4 ? 'bg-emerald-50 text-emerald-600' : 
                              review.rating <= 2 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {review.rating >= 4 ? 'Positive' : review.rating <= 2 ? 'Negative' : 'Neutral'}
                            </span>
                            <button 
                              onClick={() => {
                                setReplyingTo(replyingTo === review.id ? null : review.id);
                                setReplyText(review.adminReply || '');
                              }}
                              className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                            >
                              {review.adminReply ? 'Edit Reply' : 'Reply'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {reviews.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-zinc-400 font-medium">
                          No customer reviews found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Reply Modal/Inline Form */}
              <AnimatePresence>
                {replyingTo && (
                  <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setReplyingTo(null)}
                      className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
                    />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                      <div className="p-8">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-xl font-black text-zinc-900 tracking-tight">Reply to Review</h3>
                            <p className="text-zinc-500 text-xs font-medium">Responding to {reviews.find(r => r.id === replyingTo)?.userName}</p>
                          </div>
                          <button 
                            onClick={() => setReplyingTo(null)}
                            className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"
                          >
                            <X className="w-5 h-5 text-zinc-400" />
                          </button>
                        </div>

                        <div className="mb-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                          <p className="text-zinc-600 text-sm font-medium italic">
                            "{reviews.find(r => r.id === replyingTo)?.comment}"
                          </p>
                        </div>

                        <div className="space-y-4">
                          <textarea 
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your response..."
                            className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all font-bold text-zinc-900 placeholder:text-zinc-300 min-h-[150px] resize-none"
                          />
                          <div className="flex gap-3">
                            <button 
                              onClick={() => setReplyingTo(null)}
                              className="flex-1 px-6 py-3 border border-zinc-100 text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-50 transition-all"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => handleSaveReply(reviews.find(r => r.id === replyingTo))}
                              disabled={isSavingReply || !replyText.trim()}
                              className="flex-[2] px-6 py-3 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {isSavingReply ? 'Saving...' : 'Save Response'}
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
