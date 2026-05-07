"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  Package, 
  MapPin, 
  ChevronDown, 
  LogOut, 
  MessageSquare, 
  HelpCircle, 
  CreditCard,
  History,
  X,
  Send,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Settings,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import { toMediaProxyUrl } from '@/lib/media';
import { isValidUrl } from '@/lib/utils';
import { submitSupportRequestAction, customerReplySupportTicketAction } from '@/app/actions/support';
import { deleteAddressAction, saveAddressAction, setDefaultAddressAction } from '@/app/actions/profile';
import type { StorefrontSettings } from '@/store/useSettingsStore';
import { localizeHref } from '@/lib/i18n-routing';
import { performClientLogout } from '@/lib/client-auth';
import { t } from '@/lib/dictionary';

interface ProfileClientProps {
  initialOrders: ProfileOrder[];
  initialAddresses: AddressRecord[];
  initialSupportTickets: SupportTicketRecord[];
  initialRefundRequests: RefundRequestRecord[];
  profile: { full_name: string | null };
  settings: StorefrontSettings;
  lang: string;
}

type SupportType = 'help' | 'replacement' | 'refund' | 'chat' | null;

type AddressRecord = {
  id: string;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
};

type AddressFormState = {
  id?: string;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type ProfileOrderItem = {
  name?: string | null;
  title?: string | null;
  price: number;
  quantity: number;
};

type ProfileOrder = {
  id: string;
  orderId?: string | null;
  createdAt?: string | null;
  total: number;
  status?: string | null;
  currency?: string | null;
  items?: ProfileOrderItem[] | null;
};

type SupportTicketMessage = {
  sender?: 'admin' | 'customer' | null;
  text?: string | null;
  createdAt?: string | null;
  imageUrl?: string | null;
};

type SupportTicketRecord = {
  id: string;
  subject?: string | null;
  message?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  messages?: SupportTicketMessage[] | null;
};

type RefundRequestRecord = {
  id: string;
  order_id?: string | null;
  reason?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type InlineFeedback = {
  type: 'success' | 'error';
  message: string;
};

export function ProfileClient({
  initialOrders,
  initialAddresses,
  initialSupportTickets,
  initialRefundRequests,
  profile,
  settings,
  lang,
}: ProfileClientProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders] = useState(initialOrders);
  const [addresses, setAddresses] = useState(initialAddresses);
  const [supportTickets, setSupportTickets] = useState(initialSupportTickets);
  const [refundRequests, setRefundRequests] = useState(initialRefundRequests);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [addressFeedback, setAddressFeedback] = useState<InlineFeedback | null>(null);
  const [supportFeedback, setSupportFeedback] = useState<InlineFeedback | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    const orderId = searchParams.get('order');
    
    if (checkoutStatus === 'success' && orderId) {
      setExpandedOrderId(orderId);
      toast.success('Payment successful! Your order is now being processed.', {
        duration: 5000,
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      });
      // Clean up URL
      router.replace(localizeHref(lang, '/profile'));
    }
  }, [searchParams, router, lang]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['orders', 'support', 'profile', 'addresses'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  // Support UI State
  const [supportOrder, setSupportOrder] = useState<ProfileOrder | null>(null);
  const [supportType, setSupportType] = useState<SupportType>(null);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportImageUrl, setSupportImageUrl] = useState('');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [isUploadingSupportImage, setIsUploadingSupportImage] = useState(false);
  const [activeTicketReply, setActiveTicketReply] = useState<string | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Security UI State
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ new: '', confirm: '' });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressFormState>({
    firstName: '',
    lastName: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'SE',
    isDefault: false,
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [busyAddressId, setBusyAddressId] = useState<string | null>(null);

  const supabase = createClient();

  const parseApiPayload = async (response: Response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json() as Record<string, unknown>;
    }

    const rawText = await response.text();
    return {
      error: rawText || `Request failed with status ${response.status}`,
    };
  };

  const handleSignOut = async () => {
    await performClientLogout({
      supabase,
      redirectTo: localizeHref(lang, '/'),
    });
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.new || passwordData.new.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      toast.error('Passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);
    const toastId = toast.loading('Updating security protocol...');

    try {
      const { error } = await supabase.auth.updateUser({ password: passwordData.new });
      if (error) throw error;
      toast.success('Password updated successfully', { id: toastId });
      setPasswordData({ new: '', confirm: '' });
      setShowPasswordForm(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update password';
      toast.error(message, { id: toastId });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSupportFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingSupportImage(true);
    const toastId = toast.loading('Uploading evidence asset...');
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('path', `support/${user?.id}/${Date.now()}_${file.name}`);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
        credentials: 'include',
      });

      const data = await parseApiPayload(res);
      if (!res.ok || typeof data.error === 'string' || typeof data.url !== 'string') {
        throw new Error(typeof data.error === 'string' ? data.error : 'Upload failed');
      }

      setSupportImageUrl(data.url);
      toast.success('Asset attached to request', { id: toastId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Asset upload failed. Please try again.';
      toast.error(message, { id: toastId });
    } finally {
      setIsUploadingSupportImage(false);
    }
  };

  const handleSupportSubmit = async () => {
    if (!supportOrder || !supportType) {
      toast.error('Support request is missing order context');
      return;
    }

    if (!supportMessage.trim() && supportType !== 'refund') {
      toast.error('Please enter a message');
      return;
    }

    setIsSubmittingSupport(true);
    const toastId = toast.loading('Sending request...');

    try {
      const result = await submitSupportRequestAction({
        orderId: supportOrder.orderId || supportOrder.id,
        type: supportType as 'help' | 'replacement' | 'refund' | 'chat',
        message: supportMessage,
        imageUrl: supportImageUrl,
      });
      if (!result.success) throw new Error(result.message);

      if (supportType === 'refund') {
        setRefundRequests((current) => [
          {
            id: `local-refund-${Date.now()}`,
            order_id: supportOrder.orderId || supportOrder.id,
            reason: supportMessage || 'No reason provided',
            status: 'Pending',
            created_at: new Date().toISOString(),
          },
          ...current,
        ]);
      } else {
        setSupportTickets((current) => [
          {
            id: `local-ticket-${Date.now()}`,
            subject:
              supportType === 'replacement'
                ? `Replacement Request: ${supportOrder.orderId || supportOrder.id}`
                : supportType === 'chat'
                  ? `Chat Inquiry: ${supportOrder.orderId || supportOrder.id}`
                  : `Order Help: ${supportOrder.orderId || supportOrder.id}`,
            message: supportMessage,
            status: 'open',
            created_at: new Date().toISOString(),
            messages: supportMessage
              ? [{ sender: 'customer', text: supportMessage, createdAt: new Date().toISOString() }]
              : [],
          },
          ...current,
        ]);
      }

      setSupportFeedback({
        type: 'success',
        message: result.message,
      });
      toast.success(result.message, { id: toastId });
      setSupportOrder(null);
      setSupportType(null);
      setSupportMessage('');
      setSupportImageUrl('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send request';
      setSupportFeedback({ type: 'error', message });
      toast.error(message, { id: toastId });
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  const handleTicketReply = async (ticketId: string) => {
    if (!ticketReplyText.trim()) return;
    setIsSubmittingReply(true);
    const toastId = toast.loading('Sending reply...');
    try {
      const result = await customerReplySupportTicketAction({
        ticketId,
        replyText: ticketReplyText
      });

      if (result.success) {
        setTicketReplyText('');
        setActiveTicketReply(null);
        toast.success('Reply sent successfully', { id: toastId });
        
        // Refresh tickets
        const supabaseClient = createClient();
        const { data } = await supabaseClient
          .from('support_tickets')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });
        if (data) setSupportTickets(data as any[]);
      } else {
        toast.error(result.message || 'Failed to send reply', { id: toastId });
      }
    } catch (err) {
      toast.error('Unexpected error sending reply', { id: toastId });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      firstName: '',
      lastName: '',
      street: '',
      city: '',
      postalCode: '',
      country: 'SE',
      isDefault: false,
    });
    setIsAddressModalOpen(false);
  };

  const openAddAddressModal = () => {
    setAddressForm({
      firstName: '',
      lastName: '',
      street: '',
      city: '',
      postalCode: '',
      country: 'SE',
      isDefault: addresses.length === 0,
    });
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (address: AddressRecord) => {
    setAddressForm({
      id: address.id,
      firstName: address.firstName,
      lastName: address.lastName,
      street: address.street,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: Boolean(address.isDefault),
    });
    setIsAddressModalOpen(true);
  };

  const handleAddressFieldChange = (field: keyof AddressFormState, value: string | boolean) => {
    setAddressForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAddress(true);
    const toastId = toast.loading(addressForm.id ? 'Updating address...' : 'Saving address...');

    try {
      const result = await saveAddressAction(addressForm);
      if (!result.success || !result.addresses) {
        throw new Error(result.message);
      }

      setAddresses(result.addresses);
      setAddressFeedback({
        type: 'success',
        message: addressForm.id
          ? settings.addressUpdatedText?.[lang] || 'Address updated successfully!'
          : settings.addressAddedText?.[lang] || 'Address added successfully!',
      });
      toast.success(
        addressForm.id
          ? settings.addressUpdatedText?.[lang] || 'Address updated successfully!'
          : settings.addressAddedText?.[lang] || 'Address added successfully!',
        { id: toastId }
      );
      resetAddressForm();
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : settings.failedToSaveAddressText?.[lang] || 'Failed to save address. Please try again.';
      setAddressFeedback({ type: 'error', message });
      toast.error(message, { id: toastId });
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    setBusyAddressId(addressId);
    const toastId = toast.loading('Deleting address...');

    try {
      const result = await deleteAddressAction(addressId);
      if (!result.success || !result.addresses) {
        throw new Error(result.message);
      }

      setAddresses(result.addresses);
      setAddressFeedback({
        type: 'success',
        message: settings.addressDeletedText?.[lang] || 'Address deleted successfully!',
      });
      toast.success(settings.addressDeletedText?.[lang] || 'Address deleted successfully!', { id: toastId });
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : settings.failedToDeleteAddressText?.[lang] || 'Failed to delete address. Please try again.';
      setAddressFeedback({ type: 'error', message });
      toast.error(message, { id: toastId });
    } finally {
      setBusyAddressId(null);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    setBusyAddressId(addressId);
    const toastId = toast.loading('Updating default address...');

    try {
      const result = await setDefaultAddressAction(addressId);
      if (!result.success || !result.addresses) {
        throw new Error(result.message);
      }

      setAddresses(result.addresses);
      setAddressFeedback({
        type: 'success',
        message: settings.defaultAddressUpdatedText?.[lang] || 'Default address updated successfully!',
      });
      toast.success(settings.defaultAddressUpdatedText?.[lang] || 'Default address updated successfully!', { id: toastId });
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : settings.failedToUpdateDefaultAddressText?.[lang] || 'Failed to update default address. Please try again.';
      setAddressFeedback({ type: 'error', message });
      toast.error(message, { id: toastId });
    } finally {
      setBusyAddressId(null);
    }
  };

  if (!user) return null;

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Member';
  const totalSpent = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const activeOrders = orders.filter((order) => !['Delivered', 'Cancelled'].includes(order.status || '')).length;

  const navItems = [
    { id: 'orders', label: t('orders', lang, settings.ordersText?.[lang]), icon: Package },
    { id: 'support', label: t('support', lang, settings.supportText?.[lang]), icon: MessageSquare },
    { id: 'profile', label: t('account', lang, settings.profileText?.[lang]), icon: Settings },
    { id: 'addresses', label: t('addresses', lang, settings.addressesText?.[lang]), icon: MapPin },
  ];

  return (
    <>
    <div className="relative z-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* Mobile Dropdown Navigation */}
        <div className="lg:hidden mb-8">
          <div className="relative">
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="w-full flex items-center justify-between border border-slate-300 bg-white px-6 py-4 transition-all"
            >
              <div className="flex items-center gap-3">
                {(() => {
                  const activeItem = navItems.find(i => i.id === activeTab);
                  const Icon = activeItem?.icon || Package;
                  return (
                    <>
                      <Icon className="w-4 h-4 text-slate-900" />
                      <span className="text-[12px] font-bold uppercase tracking-widest text-slate-900">
                        {activeItem?.label || 'Orders'}
                      </span>
                    </>
                  );
                })()}
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isMobileNavOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isMobileNavOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 z-50 bg-white border-x border-b border-slate-300 shadow-xl overflow-hidden"
                >
                  <div className="flex flex-col">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsMobileNavOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${
                            activeTab === item.id 
                              ? 'bg-slate-50 text-slate-900' 
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[12px] font-bold uppercase tracking-widest">{item.label}</span>
                        </button>
                      );
                    })}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-6 py-4 text-left text-rose-500 hover:bg-rose-50 transition-colors border-t border-slate-100"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-[12px] font-bold uppercase tracking-widest">{t('logout', lang, settings.logoutText?.[lang])}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Desktop Navigation Rail - Hidden on Mobile */}
        <div className="hidden lg:col-span-3 lg:block">
          <div className="lg:sticky lg:top-32 space-y-12">
            <nav className="flex flex-col space-y-1 border-l border-slate-100">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-6 py-4 transition-all text-left border-l-2 -ml-[1px] ${
                    activeTab === item.id 
                      ? 'border-slate-900 text-slate-900' 
                      : 'border-transparent text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <span className="text-[12px] font-bold uppercase tracking-widest">{item.label}</span>
                </button>
              ))}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-6 py-4 text-[12px] font-bold text-rose-500 hover:text-rose-700 uppercase tracking-widest transition-all text-left border-l-2 border-transparent -ml-[1px]"
              >
                {t('logout', lang, settings.logoutText?.[lang])}
              </button>
            </nav>
          </div>
        </div>

        {/* Content Column */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            {activeTab === 'orders' && (
              <motion.div 
                key="orders"
                initial={{ opacity: 0, y: 5 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                <div className="h-10 flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest">{t('orders', lang, settings.ordersText?.[lang])}</h3>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{orders.length} {t('total', lang, settings.totalSuffixText?.[lang])}</span>
                </div>

                {orders.length === 0 ? (
                  <div className="border border-slate-300 bg-white py-24 text-center">
                    <Package className="w-10 h-10 mx-auto text-slate-200 mb-4" />
                    <p className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">{t('noOrdersYet', lang, settings.noOrdersYetText?.[lang])}</p>
                    <button onClick={() => router.push(`/${lang}`)} className="mt-4 text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-all uppercase underline underline-offset-4 tracking-widest">
                       {t('returnToStorefront', lang, settings.continueShoppingText?.[lang])}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const isExpanded = expandedOrderId === order.id;
                      return (
                        <div key={order.id} className="bg-white border border-slate-300">
                          <div 
                            className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-8 hover:bg-slate-50 transition-colors"
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                          >
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1">
                               <div>
                                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">{settings.orderLabelText?.[lang] || 'Order ID'}</p>
                                  <p className="text-sm font-bold text-slate-900 font-mono tracking-tighter">#{order.orderId || order.id.slice(0, 5).toUpperCase()}</p>
                               </div>
                               <div>
                                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">{t('date', lang, settings.dateLabelText?.[lang])}</p>
                                  <p className="text-sm font-bold text-slate-900">{order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '---'}</p>
                               </div>
                               <div>
                                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">{t('total', lang, settings.totalLabelText?.[lang])}</p>
                                  <p className="text-sm font-bold text-slate-900">{formatPrice(order.total, lang, undefined, order.currency ?? undefined)}</p>
                               </div>
                               <div>
                                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">{t('status', lang, settings.statusLabelText?.[lang])}</p>
                                  <span className={`inline-flex px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest border rounded-none ${
                                    order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                                    order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                                    'bg-amber-50 text-amber-700 border-amber-300'
                                  }`}>
                                    {order.status === 'Delivered' ? (settings.orderStatusDelivered?.[lang] || 'Delivered') :
                                      order.status === 'Shipped' ? (settings.orderStatusShipped?.[lang] || 'Shipped') :
                                      order.status === 'In Transit' ? (settings.orderStatusInTransit?.[lang] || 'In Transit') :
                                      (settings.orderStatusProcessing?.[lang] || order.status || 'Processing')}
                                  </span>
                               </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setSupportOrder(order);
                                 }}
                                 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border border-slate-900 px-6 py-2 hover:bg-slate-900 hover:text-white transition-all flex items-center whitespace-nowrap"
                               >
                                 {t('getHelp', lang, settings.getHelpText?.[lang])}
                               </button>
                               <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-slate-900' : ''}`} />
                            </div>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }} 
                                animate={{ height: 'auto', opacity: 1 }} 
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-slate-300 bg-slate-50/50 overflow-hidden"
                              >
                                <div className="p-8 space-y-8">
                                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                      <div className="space-y-6">
                                         <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">{settings.statusLabelText?.[lang] || 'Status Details'}</h4>
                                          <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{order.status === 'Delivered' ? (settings.orderStatusDelivered?.[lang] || 'Delivered') :
                                      order.status === 'Shipped' ? (settings.orderStatusShipped?.[lang] || 'Shipped') :
                                      order.status === 'In Transit' ? (settings.orderStatusInTransit?.[lang] || 'In Transit') :
                                      (settings.orderStatusProcessing?.[lang] || order.status || 'Processing')}</p>
                                          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                                            {settings.lastUpdatedText?.[lang] || 'Last Update'}: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '---'}
                                          </p>
                                       </div>
                                       {/* removed old content */}
                                       <div className="hidden">
                                         <div className="space-y-6 relative pl-6 border-l border-slate-300">
                                            <div className="relative">
                                               <div className="absolute -left-[31px] top-1 w-2 h-2 bg-slate-900" />
                                               <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">System Confirmation</p>
                                               <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                                 {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : '---'}
                                               </p>
                                            </div>
                                            <div className="relative">
                                               <div className={`absolute -left-[31px] top-1 w-2 h-2 ${order.status === 'Shipped' || order.status === 'Delivered' ? 'bg-slate-900' : 'bg-slate-200'}`} />
                                               <p className={`text-sm font-bold uppercase tracking-tight ${order.status === 'Shipped' || order.status === 'Delivered' ? 'text-slate-900' : 'text-slate-300'}`}>Logistic Transit</p>
                                               <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Ground Carrier Active</p>
                                            </div>
                                         </div>
                                      </div>

                                      <div className="bg-white border border-slate-300 p-8">
                                         <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-3 mb-6">{settings.orderItemsTitleText?.[lang] || 'Manifest Summary'}</h4>
                                         <div className="space-y-4">
                                            {order.items?.map((item, idx) => (
                                              <div key={idx} className="flex justify-between items-center text-sm">
                                                 <span className="text-slate-900 font-bold uppercase tracking-tight">{item.name || item.title} <span className="text-slate-500 font-bold pl-2">X{item.quantity}</span></span>
                                                 <span className="font-bold text-slate-900">{formatPrice(item.price * item.quantity, lang, undefined, order.currency ?? undefined)}</span>
                                              </div>
                                            ))}
                                            <div className="pt-6 border-t-2 border-slate-900 flex justify-between items-center font-bold text-lg mt-4">
                                               <span className="text-xs uppercase tracking-widest text-slate-500">{settings.totalText?.[lang] || 'Total Valuation'}</span>
                                               <span className="text-slate-900 tracking-tighter underline underline-offset-8 decoration-slate-300 decoration-2">{formatPrice(order.total, lang, undefined, order.currency ?? undefined)}</span>
                                            </div>
                                         </div>
                                      </div>
                                   </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'support' && (
              <motion.div
                key="support"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="h-10 flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest">{t('support', lang, settings.supportText?.[lang])}</h3>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    {supportTickets.length + refundRequests.length} {t('total', lang, settings.totalSuffixText?.[lang])}
                  </span>
                </div>

                {supportFeedback && (
                  <div className={`border px-5 py-4 text-sm font-medium ${
                    supportFeedback.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-rose-200 bg-rose-50 text-rose-700'
                  }`}>
                    {supportFeedback.message}
                  </div>
                )}

                {supportTickets.length === 0 && refundRequests.length === 0 ? (
                  <div className="border border-slate-300 bg-white py-20 text-center">
                    <MessageSquare className="mx-auto mb-4 h-10 w-10 text-slate-200" />
                    <p className="text-[13px] font-bold uppercase tracking-widest text-slate-900">{t('noSupportActivityYet', lang, settings.noSupportActivityYetText?.[lang])}</p>
                    <p className="mt-3 text-[13px] text-slate-500">Open any order and use the help button when you need assistance.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {supportTickets.map((ticket) => (
                      <div key={ticket.id} className="border border-slate-300 bg-white p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Support Ticket #{ticket.id.slice(0, 5).toUpperCase()}</p>
                            <h4 className="mt-2 text-sm font-bold uppercase tracking-tight text-slate-900">
                              {ticket.subject || 'Customer support request'}
                            </h4>
                            <p className="mt-3 text-sm leading-6 text-slate-600">{ticket.message || 'No initial message recorded.'}</p>
                          </div>
                          <div className="space-y-2 text-right">
                            <span className="inline-flex border border-slate-300 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-slate-700">
                              {ticket.status || 'open'}
                            </span>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                              {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : '---'}
                            </p>
                          </div>
                        </div>

                        {ticket.messages && ticket.messages.length > 0 && (
                          <div className="mt-6 border-t border-slate-200 pt-5">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Conversation</p>
                            <div className="mt-4 space-y-3">
                              {(ticket.messages || []).map((message: any, index: number) => (
                                <div key={`${ticket.id}-${index}`} className="border border-slate-200 bg-slate-50 px-4 py-3">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                      {message.sender === 'admin' ? 'Admin reply' : 'Your message'}
                                    </span>
                                    <span className="text-[11px] uppercase tracking-widest text-slate-500">
                                      {message.createdAt ? new Date(message.createdAt).toLocaleString() : '---'}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-sm leading-6 text-slate-700">{message.text || '-'}</p>
                                  {message.imageUrl && isValidUrl(message.imageUrl) && (
                                    <div className="mt-4 relative aspect-video w-full max-w-sm rounded-none overflow-hidden border border-slate-200 shadow-none">
                                      <Image src={message.imageUrl} alt="Support inquiry attachment" fill className="object-cover" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-4 border-t border-slate-100 pt-4">
                          {activeTicketReply === ticket.id ? (
                            <div className="space-y-4 border border-slate-900 p-4 animate-in fade-in slide-in-from-top-2">
                              <textarea
                                value={ticketReplyText}
                                onChange={(e) => setTicketReplyText(e.target.value)}
                                placeholder="Type your reply here..."
                                className="w-full border-b border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none min-h-[100px] resize-none"
                              />
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  onClick={() => {
                                    setActiveTicketReply(null);
                                    setTicketReplyText('');
                                  }}
                                  className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleTicketReply(ticket.id)}
                                  disabled={isSubmittingReply || !ticketReplyText.trim()}
                                  className="bg-slate-900 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-slate-800 disabled:opacity-50"
                                >
                                  {isSubmittingReply ? 'Sending...' : 'Send Reply'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setActiveTicketReply(ticket.id)}
                              className="text-[10px] font-bold uppercase tracking-widest text-slate-900 underline underline-offset-4 hover:text-slate-600"
                            >
                              Reply to conversation
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {refundRequests.map((refund) => (
                      <div key={refund.id} className="border border-slate-300 bg-white p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Refund Request</p>
                            <h4 className="mt-2 text-sm font-bold uppercase tracking-tight text-slate-900">
                              Order #{refund.order_id || refund.id.slice(0, 5).toUpperCase()}
                            </h4>
                            <p className="mt-3 text-sm leading-6 text-slate-600">{refund.reason || 'No reason provided.'}</p>
                          </div>
                          <div className="space-y-2 text-right">
                            <span className="inline-flex border border-slate-300 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-slate-700">
                              {refund.status || 'Pending'}
                            </span>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                              {refund.created_at ? new Date(refund.created_at).toLocaleString() : '---'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, y: 5 }} 
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="h-10 flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest">Account Details</h3>
                </div>

                <div className="bg-white border border-slate-300 p-8 space-y-8">
                   <div className="max-w-xl space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                         <div className="space-y-3">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Legal Name</label>
                            <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{displayName}</p>
                         </div>
                         <div className="space-y-3">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Security Email</label>
                            <p className="text-sm font-bold text-slate-500 truncate">{user.email}</p>
                         </div>
                      </div>
                      <div className="p-8 border border-slate-200 text-[11px] text-slate-500 leading-relaxed font-bold uppercase tracking-widest bg-slate-50">
                         Identity authenticated on {new Date(user.created_at || Date.now()).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}.
                      </div>
                   </div>

                   {/* CHANGE PASSWORD SECTION */}
                   <div className="border-t border-slate-100 pt-12">
                      {!showPasswordForm ? (
                        <div className="flex items-center justify-between">
                           <div>
                              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Access Credentials</h4>
                              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Manage your account security and password</p>
                           </div>
                           <button 
                              onClick={() => setShowPasswordForm(true)}
                              className="text-[11px] font-bold uppercase tracking-widest border border-slate-900 px-8 py-3 hover:bg-slate-900 hover:text-white transition-all flex items-center gap-2"
                           >
                              <Lock className="w-4 h-4" /> Change Password
                           </button>
                        </div>
                      ) : (
                        <motion.form 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          onSubmit={handlePasswordUpdate}
                          className="space-y-8 bg-slate-50 p-10 border border-slate-200"
                        >
                           <div className="flex items-center justify-between mb-4">
                              <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> Security Protocol: Password Update
                              </h4>
                              <button 
                                type="button"
                                onClick={() => setShowPasswordForm(false)}
                                className="text-[11px] font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest"
                              >
                                Cancel
                              </button>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-2 relative">
                                 <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">New Password</label>
                                 <input 
                                    type={showPass ? "text" : "password"}
                                    value={passwordData.new}
                                    onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                                    className="w-full bg-white border border-slate-300 p-4 text-sm font-bold focus:outline-none focus:border-slate-900 transition-all"
                                    required
                                 />
                                 <button 
                                    type="button" 
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 bottom-4 text-slate-500"
                                 >
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                 </button>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Confirm Password</label>
                                 <input 
                                    type={showPass ? "text" : "password"}
                                    value={passwordData.confirm}
                                    onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                                    className="w-full bg-white border border-slate-300 p-4 text-sm font-bold focus:outline-none focus:border-slate-900 transition-all"
                                    required
                                 />
                              </div>
                           </div>

                           <button 
                              type="submit"
                              disabled={isUpdatingPassword}
                              className="w-full bg-slate-900 text-white font-bold uppercase tracking-widest py-4 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                           >
                              {isUpdatingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Security Update'}
                           </button>
                        </motion.form>
                      )}
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'addresses' && (
              <motion.div 
                 key="addresses"
                 initial={{ opacity: 0, y: 5 }} 
                 animate={{ opacity: 1, y: 0 }}
                 className="space-y-6"
              >
                 <div className="flex flex-col gap-4 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
                   <div>
                     <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest">{t('addresses', lang, settings.savedAddressesTitleText?.[lang])}</h3>
                   </div>
                   <button
                     onClick={openAddAddressModal}
                     className="text-[11px] font-bold uppercase tracking-widest bg-slate-900 text-white px-8 py-3 hover:bg-slate-800 transition-all h-11 inline-flex items-center justify-center gap-2"
                   >
                     <Plus className="w-4 h-4" />
                     {settings.addNewAddressTitleText?.[lang] || 'Add New Address'}
                   </button>
                 </div>

                 {addressFeedback && (
                   <div className={`border px-5 py-4 text-sm font-medium ${
                     addressFeedback.type === 'success'
                       ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                       : 'border-rose-200 bg-rose-50 text-rose-700'
                   }`}>
                     {addressFeedback.message}
                   </div>
                 )}
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {addresses.length === 0 ? (
                     <div className="col-span-2 py-32 text-center border border-slate-300 bg-white">
                       <MapPin className="w-10 h-10 mx-auto text-slate-100 mb-4" />
                       <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{settings.noAddressesSavedText?.[lang] || 'No addresses saved'}</p>
                       <button
                         onClick={openAddAddressModal}
                         className="mt-6 inline-flex items-center gap-2 border border-slate-900 px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-900 transition-all hover:bg-slate-900 hover:text-white"
                       >
                         <Plus className="w-4 h-4" />
                         {settings.addNewButtonText?.[lang] || 'Add New'}
                       </button>
                     </div>
                   ) : (
                     addresses.map((addr, idx) => (
                       <div key={addr.id || idx} className="bg-white border border-slate-300 p-8 relative hover:border-slate-900 transition-all">
                         <MapPin className="w-4 h-4 text-slate-300 absolute top-8 right-8" />
                         <div className="flex items-start justify-between gap-4 mb-6">
                           <div className="flex items-center gap-3">
                              <span className="w-6 h-6 bg-slate-900 flex items-center justify-center text-[11px] font-bold text-white tracking-widest">#{idx + 1}</span>
                              <div>
                                <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{addr.firstName} {addr.lastName}</p>
                                {addr.isDefault && (
                                  <span className="mt-2 inline-flex items-center gap-1 border border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {settings.defaultBadgeText?.[lang] || 'Default'}
                                  </span>
                                )}
                              </div>
                           </div>
                         </div>
                         <div className="text-[11px] text-slate-500 font-bold leading-relaxed space-y-1 uppercase tracking-widest">
                            <p className="text-slate-900 font-bold">{addr.street}</p>
                            <p>{addr.postalCode} {addr.city}</p>
                            <p className="text-slate-900 font-black border-t border-slate-100 mt-2 pt-2">{addr.country}</p>
                         </div>
                         <div className="mt-8 flex flex-wrap gap-3">
                           {!addr.isDefault && (
                             <button
                               onClick={() => handleSetDefaultAddress(addr.id)}
                               disabled={busyAddressId === addr.id}
                               className="inline-flex items-center gap-2 border border-slate-300 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-900 transition-all hover:bg-slate-50 disabled:opacity-50"
                             >
                               {busyAddressId === addr.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                               {settings.setDefaultButtonText?.[lang] || 'Set Default'}
                             </button>
                           )}
                           <button
                             onClick={() => openEditAddressModal(addr)}
                             className="inline-flex items-center gap-2 border border-slate-300 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-900 transition-all hover:bg-slate-50"
                           >
                             <Pencil className="w-4 h-4" />
                             {settings.editButtonText?.[lang] || 'Edit'}
                           </button>
                           <button
                             onClick={() => handleDeleteAddress(addr.id)}
                             disabled={busyAddressId === addr.id}
                             className="inline-flex items-center gap-2 border border-rose-200 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-rose-600 transition-all hover:bg-rose-50 disabled:opacity-50"
                           >
                             {busyAddressId === addr.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                             {settings.deleteButtonText?.[lang] || 'Delete'}
                           </button>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>

      <AnimatePresence>
        {isAddressModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => {
                if (!isSavingAddress) resetAddressForm();
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="relative z-[106] w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-300 bg-white shadow-none rounded-none"
            >
              <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-6 py-5 md:px-8">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    {addressForm.id ? settings.editAddressTitleText?.[lang] || 'Edit Address' : settings.addNewAddressTitleText?.[lang] || 'Add New Address'}
                  </p>
                  <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900">
                    {settings.addAddressDescriptionText?.[lang] || 'Add an address for faster checkout.'}
                  </h3>
                </div>
                <button
                  type="button"
                  disabled={isSavingAddress}
                  onClick={resetAddressForm}
                  className="w-10 h-10 border border-slate-300 flex items-center justify-center text-slate-900 transition-all hover:border-slate-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-8 p-6 md:p-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{settings.firstNameLabelText?.[lang] || 'First Name'}</label>
                    <input value={addressForm.firstName} onChange={(e) => handleAddressFieldChange('firstName', e.target.value)} className="w-full border border-slate-300 bg-white p-4 text-sm font-bold text-slate-900 transition-all focus:outline-none focus:border-slate-900" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{settings.lastNameLabelText?.[lang] || 'Last Name'}</label>
                    <input value={addressForm.lastName} onChange={(e) => handleAddressFieldChange('lastName', e.target.value)} className="w-full border border-slate-300 bg-white p-4 text-sm font-bold text-slate-900 transition-all focus:outline-none focus:border-slate-900" required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{settings.streetAddressLabelText?.[lang] || 'Street Address'}</label>
                    <input value={addressForm.street} onChange={(e) => handleAddressFieldChange('street', e.target.value)} className="w-full border border-slate-300 bg-white p-4 text-sm font-bold text-slate-900 transition-all focus:outline-none focus:border-slate-900" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{settings.cityLabelText?.[lang] || 'City'}</label>
                    <input value={addressForm.city} onChange={(e) => handleAddressFieldChange('city', e.target.value)} className="w-full border border-slate-300 bg-white p-4 text-sm font-bold text-slate-900 transition-all focus:outline-none focus:border-slate-900" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{settings.postalCodeLabelText?.[lang] || 'Postal Code'}</label>
                    <input value={addressForm.postalCode} onChange={(e) => handleAddressFieldChange('postalCode', e.target.value)} className="w-full border border-slate-300 bg-white p-4 text-sm font-bold text-slate-900 transition-all focus:outline-none focus:border-slate-900" required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{settings.countryLabelText?.[lang] || 'Country'}</label>
                    <select value={addressForm.country} onChange={(e) => handleAddressFieldChange('country', e.target.value)} className="w-full border border-slate-300 bg-white p-4 text-sm font-bold text-slate-900 transition-all focus:outline-none focus:border-slate-900">
                      {settings.shippingCountries?.map((c) => (
                        <option key={c.code} value={c.code}>{typeof c.name === 'string' ? c.name : c.name?.[lang] || c.name?.en || c.code}</option>
                      )) || (
                        <>
                      <option value="SE">Sweden</option>
                      <option value="DK">Denmark</option>
                      <option value="FI">Finland</option>
                      <option value="NO">Norway</option>
                      <option value="IS">Iceland</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <label className="flex items-start gap-3 border border-slate-200 bg-slate-50 p-4">
                  <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => handleAddressFieldChange('isDefault', e.target.checked)} className="mt-1 h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-900" />
                  <span className="text-sm font-medium text-slate-700">{settings.setDefaultAddressLabelText?.[lang] || 'Set as default shipping address'}</span>
                </label>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button type="button" onClick={resetAddressForm} disabled={isSavingAddress} className="border border-slate-300 px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-900 transition-all hover:bg-slate-50 disabled:opacity-50">
                    {settings.cancelButtonText?.[lang] || 'Cancel'}
                  </button>
                  <button type="submit" disabled={isSavingAddress} className="bg-slate-900 text-white px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-all hover:bg-slate-800 disabled:opacity-50 inline-flex items-center justify-center gap-2">
                    {isSavingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {settings.saveAddressButtonText?.[lang] || 'Save Address'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {supportOrder && (
          <div key="support-modal-root" className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-12 lg:p-24">
            <motion.div 
              key="support-overlay"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl pointer-events-auto"
              onClick={() => { if(!isSubmittingSupport) setSupportOrder(null); }}
            />
            
            <motion.div
              key="support-content"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-4xl border-2 border-slate-900 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)] rounded-none pointer-events-auto flex flex-col max-h-[90vh] relative z-[1001]"
            >
              <div className="px-8 py-8 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 tracking-widest uppercase">Support Inquiry</span>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">REF: #{supportOrder.orderId || supportOrder.id.slice(0, 5).toUpperCase()}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">How can we assist?</h3>
                </div>
                <button 
                   disabled={isSubmittingSupport}
                   onClick={() => setSupportOrder(null)} 
                   className="w-10 h-10 bg-white flex items-center justify-center text-slate-900 transition-all border border-slate-200 hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {!supportType ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                     {[
                       { id: 'help', label: 'General Help', desc: 'Questions on logistics or data', icon: HelpCircle },
                       { id: 'replacement', label: 'Replacement', desc: 'Report damaged inventory', icon: RefreshCcw },
                       { id: 'refund', label: 'Request Refund', desc: 'Credit and recovery protocol', icon: CreditCard },
                       { id: 'chat', label: 'Direct Chat', desc: 'Secure agent communication', icon: MessageSquare },
                     ].map((opt) => (
                       <button
                         key={opt.id}
                         onClick={() => setSupportType(opt.id as SupportType)}
                         className="flex flex-col items-start p-8 bg-slate-50 border border-slate-200 hover:border-slate-900 hover:bg-white transition-all group"
                       >
                         <div className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center mb-6 text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                            <opt.icon className="w-4 h-4" />
                         </div>
                         <p className="text-[12px] font-bold text-slate-900 uppercase tracking-widest mb-2">{opt.label}</p>
                         <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest leading-relaxed">{opt.desc}</p>
                       </button>
                     ))}
                  </div>
                ) : (
                  <div className="max-w-xl mx-auto space-y-12 animate-in fade-in duration-300 flex flex-col h-full">
                     <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                        <button 
                          onClick={() => setSupportType(null)}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-all uppercase tracking-widest flex items-center gap-2"
                        >
                           ← Back to Menu
                        </button>
                        <span className="text-[11px] font-bold text-slate-900 uppercase tracking-widest underline underline-offset-4 decoration-slate-300">Channel: {supportType.toUpperCase()}</span>
                     </div>

                     {supportType === 'chat' ? (
                        <div className="border border-slate-300 flex-1 flex flex-col p-10 bg-slate-50 max-h-[350px]">
                           <div className="flex-1 space-y-8 overflow-y-auto mb-10 scrollbar-hide">
                              <div className="flex items-start gap-4">
                                <div className="w-8 h-8 bg-slate-900 flex items-center justify-center text-[11px] text-white shrink-0 font-bold">M</div>
                                <div className="bg-white border border-slate-300 p-6 shadow-none">
                                  <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
                                    Member identity verified. An agent will be assigned to this session. Please summarize your technical or logistic requirement below.
                                  </p>
                                </div>
                              </div>
                           </div>
                           <div className="relative">
                              <textarea 
                                value={supportMessage}
                                onChange={(e) => setSupportMessage(e.target.value)}
                                placeholder="Summary of inquiry..."
                                className="w-full bg-white border-2 border-slate-300 p-6 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-950 h-28 resize-none"
                              />
                              <button 
                                onClick={handleSupportSubmit}
                                disabled={isSubmittingSupport}
                                className="absolute bottom-6 right-6 bg-slate-900 text-white p-3 hover:bg-slate-800 transition-all disabled:opacity-50"
                              >
                                {isSubmittingSupport ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                              </button>
                           </div>
                        </div>
                     ) : (
                        <div className="space-y-10 flex-1 flex flex-col">
                           <div className="flex-1">
                             <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-6 block border-l-4 border-slate-900 pl-4">Inquiry Rationale & Context</label>
                             <textarea 
                                value={supportMessage}
                                onChange={(e) => setSupportMessage(e.target.value)}
                                placeholder="Detail your requirement..."
                                className="w-full bg-white border-2 border-slate-300 p-10 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-950 h-64 resize-none"
                             />
                           </div>
                           <button 
                              onClick={handleSupportSubmit}
                              disabled={isSubmittingSupport}
                              className="w-full h-20 bg-slate-900 text-white font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center disabled:opacity-50 text-base border-2 border-slate-900"
                           >
                              {isSubmittingSupport ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Transmit Official Request'}
                           </button>
                        </div>
                     )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
