"use client";

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};


import React, { useState } from 'react';
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
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import { submitSupportRequestAction } from '@/app/actions/support';
import { deleteAddressAction, saveAddressAction, setDefaultAddressAction } from '@/app/actions/profile';
import type { StorefrontSettings } from '@/store/useSettingsStore';

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
  comments?: string | null;
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
  const { user, setUser, setIsAdmin } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders] = useState(initialOrders);
  const [addresses, setAddresses] = useState(initialAddresses);
  const [supportTickets, setSupportTickets] = useState(initialSupportTickets);
  const [refundRequests, setRefundRequests] = useState(initialRefundRequests);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [addressFeedback, setAddressFeedback] = useState<InlineFeedback | null>(null);
  const [supportFeedback, setSupportFeedback] = useState<InlineFeedback | null>(null);
  
  // Support UI State
  const [supportOrder, setSupportOrder] = useState<ProfileOrder | null>(null);
  const [supportType, setSupportType] = useState<SupportType>(null);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportImageUrl, setSupportImageUrl] = useState('');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [isUploadingSupportImage, setIsUploadingSupportImage] = useState(false);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    router.push(`/${lang}`);
    toast.success('Signed out successfully');
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
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setSupportImageUrl(data.url);
      toast.success('Asset attached to request', { id: toastId });
    } catch (err: any) {
      toast.error('Asset upload failed. Please try again.', { id: toastId });
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

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-0 pb-12 animate-in fade-in duration-300">
      <div className="mb-8 border border-slate-300 bg-white">
        <div className="grid gap-0 lg:grid-cols-[1.5fr_1fr]">
          <div className="border-b border-slate-300 p-8 lg:border-b-0 lg:border-r lg:p-10">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-slate-900" />
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Customer Workspace</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
              Hello, {displayName.split(' ')[0]}.
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
              Manage your orders, personal data, saved addresses, and support requests from one calm control center.
            </p>
            <div className="mt-8 hidden flex-wrap gap-3 lg:flex">
              <button
                onClick={() => setActiveTab('orders')}
                className="inline-flex items-center gap-2 border border-slate-900 bg-slate-900 px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:bg-slate-800"
              >
                <History className="h-4 w-4" /> Review Orders
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className="inline-flex items-center gap-2 border border-slate-300 px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-900 transition-all hover:bg-slate-50"
              >
                <ShieldCheck className="h-4 w-4" /> Security Settings
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 bg-slate-50">
            <div className="border-b border-r border-slate-300 p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Lifetime Spend</p>
              <p className="mt-4 text-2xl font-bold text-slate-900">{formatPrice(totalSpent, lang)}</p>
            </div>
            <div className="border-b border-slate-300 p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Orders</p>
              <p className="mt-4 text-2xl font-bold text-slate-900">{activeOrders}</p>
            </div>
            <div className="border-r border-slate-300 p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Saved Addresses</p>
              <p className="mt-4 text-2xl font-bold text-slate-900">{addresses.length}</p>
            </div>
            <div className="p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Support Cases</p>
              <p className="mt-4 text-sm font-bold text-slate-900">{supportTickets.length + refundRequests.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Navigation Column */}
        <div className="lg:col-span-3 space-y-6">
          <div className="h-10 border-b-2 border-slate-300 pb-3 hidden lg:flex items-center">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Navigation</h3>
          </div>
          <nav className="grid grid-cols-1 border border-slate-300 bg-white sm:grid-cols-3 lg:block">
            {[
              { id: 'orders', label: 'Orders', icon: Package },
              { id: 'support', label: 'Support', icon: MessageSquare },
              { id: 'profile', label: 'Settings', icon: Settings },
              { id: 'addresses', label: 'Addresses', icon: MapPin },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-5 py-4 transition-all lg:px-6 ${
                  activeTab === item.id 
                    ? 'bg-slate-50 text-slate-900' 
                    : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-900'
                } ${item.id !== 'addresses' ? 'border-b border-slate-300 sm:border-r lg:border-r-0' : ''} ${item.id === 'addresses' ? 'sm:border-r-0' : ''}`}
              >
                <div className="flex items-center gap-3 lg:gap-4">
                  <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-slate-900' : 'text-slate-300'}`} />
                  <span className="text-sm font-bold tracking-tight uppercase">{item.label}</span>
                </div>
                {activeTab === item.id && <div className="w-1.5 h-1.5 bg-slate-900" />}
              </button>
            ))}
          </nav>

          <button
            onClick={handleSignOut}
            className="w-full hidden lg:flex items-center gap-4 px-6 py-4 text-xs font-bold text-rose-500 hover:bg-rose-50 border border-rose-100 uppercase tracking-widest transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
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
                <div className="h-10 flex items-center justify-between border-b-2 border-slate-300 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Order History</h3>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{orders.length} TOTAL</span>
                </div>

                {orders.length === 0 ? (
                  <div className="border border-slate-300 bg-white py-24 text-center">
                    <Package className="w-10 h-10 mx-auto text-slate-200 mb-4" />
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">No order records found</p>
                    <button onClick={() => router.push(`/${lang}`)} className="mt-4 text-[11px] font-bold text-slate-400 hover:text-slate-900 transition-all uppercase underline underline-offset-4 tracking-widest">
                       Return to Storefront
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
                                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Order ID</p>
                                  <p className="text-sm font-bold text-slate-900 font-mono tracking-tighter">#{order.orderId || order.id.slice(0, 10).toUpperCase()}</p>
                               </div>
                               <div>
                                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Order Date</p>
                                  <p className="text-sm font-bold text-slate-900">{order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '---'}</p>
                               </div>
                               <div>
                                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Order Total</p>
                                  <p className="text-sm font-bold text-slate-900">{formatPrice(order.total, lang, undefined, order.currency ?? undefined)}</p>
                               </div>
                               <div>
                                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Progress</p>
                                  <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${
                                    order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                                    order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                                    'bg-amber-50 text-amber-700 border-amber-300'
                                  }`}>
                                    {order.status || 'Processing'}
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
                                 Get Help
                               </button>
                               <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-slate-900' : ''}`} />
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
                                         <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">Logistics Pipeline</h4>
                                         <div className="space-y-6 relative pl-6 border-l border-slate-300">
                                            <div className="relative">
                                               <div className="absolute -left-[31px] top-1 w-2 h-2 bg-slate-900" />
                                               <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">System Confirmation</p>
                                               <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                 {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : '---'}
                                               </p>
                                            </div>
                                            <div className="relative">
                                               <div className={`absolute -left-[31px] top-1 w-2 h-2 ${order.status === 'Shipped' || order.status === 'Delivered' ? 'bg-slate-900' : 'bg-slate-200'}`} />
                                               <p className={`text-sm font-bold uppercase tracking-tight ${order.status === 'Shipped' || order.status === 'Delivered' ? 'text-slate-900' : 'text-slate-300'}`}>Logistic Transit</p>
                                               <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ground Carrier Active</p>
                                            </div>
                                         </div>
                                      </div>

                                      <div className="bg-white border border-slate-300 p-8">
                                         <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-3 mb-6">Manifest Summary</h4>
                                         <div className="space-y-4">
                                            {order.items?.map((item, idx) => (
                                              <div key={idx} className="flex justify-between items-center text-sm">
                                                 <span className="text-slate-900 font-bold uppercase tracking-tight">{item.name || item.title} <span className="text-slate-400 font-bold pl-2">X{item.quantity}</span></span>
                                                 <span className="font-bold text-slate-900">{formatPrice(item.price * item.quantity, lang, undefined, order.currency ?? undefined)}</span>
                                              </div>
                                            ))}
                                            <div className="pt-6 border-t-2 border-slate-900 flex justify-between items-center font-bold text-lg mt-4">
                                               <span className="text-xs uppercase tracking-widest text-slate-400">Total Valuation</span>
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
                <div className="h-10 flex items-center justify-between border-b-2 border-slate-300 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Support Activity</h3>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    {supportTickets.length + refundRequests.length} TOTAL
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
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-900">No support activity yet</p>
                    <p className="mt-3 text-sm text-slate-500">Open any order and use the help button when you need assistance.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {supportTickets.map((ticket) => (
                      <div key={ticket.id} className="border border-slate-300 bg-white p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Support Ticket</p>
                            <h4 className="mt-2 text-sm font-bold uppercase tracking-tight text-slate-900">
                              {ticket.subject || 'Customer support request'}
                            </h4>
                            <p className="mt-3 text-sm leading-6 text-slate-600">{ticket.message || 'No initial message recorded.'}</p>
                          </div>
                          <div className="space-y-2 text-right">
                            <span className="inline-flex border border-slate-300 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-700">
                              {ticket.status || 'open'}
                            </span>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                              {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : '---'}
                            </p>
                          </div>
                        </div>

                        {ticket.messages && ticket.messages.length > 0 && (
                          <div className="mt-6 border-t border-slate-200 pt-5">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Conversation</p>
                            <div className="mt-4 space-y-3">
                              {ticket.messages.map((message, index) => (
                                <div key={`${ticket.id}-${index}`} className="border border-slate-200 bg-slate-50 px-4 py-3">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                      {message.sender === 'admin' ? 'Admin reply' : 'Your message'}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-widest text-slate-400">
                                      {message.createdAt ? new Date(message.createdAt).toLocaleString() : '---'}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-sm leading-6 text-slate-700">{message.text || '-'}</p>
                                  {message.imageUrl && isValidUrl(message.imageUrl) && (
                                    <div className="mt-4 relative aspect-video w-full max-w-sm rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                                      <Image src={message.imageUrl} alt="Support inquiry attachment" fill className="object-cover" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {refundRequests.map((refund) => (
                      <div key={refund.id} className="border border-slate-300 bg-white p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Refund Request</p>
                            <h4 className="mt-2 text-sm font-bold uppercase tracking-tight text-slate-900">
                              Order #{refund.order_id || refund.id.slice(0, 8).toUpperCase()}
                            </h4>
                            <p className="mt-3 text-sm leading-6 text-slate-600">{refund.reason || 'No reason provided.'}</p>
                            {refund.comments && <p className="mt-2 text-sm leading-6 text-slate-500">{refund.comments}</p>}
                          </div>
                          <div className="space-y-2 text-right">
                            <span className="inline-flex border border-slate-300 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-700">
                              {refund.status || 'Pending'}
                            </span>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
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
                <div className="h-10 flex items-center justify-between border-b-2 border-slate-300 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Workspace Settings</h3>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">SECURITY VERIFIED</span>
                </div>

                <div className="bg-white border border-slate-300 p-12 space-y-12">
                   <div className="max-w-xl space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                         <div className="space-y-3">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Legal Name</label>
                            <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{displayName}</p>
                         </div>
                         <div className="space-y-3">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Security Email</label>
                            <p className="text-sm font-bold text-slate-500 truncate">{user.email}</p>
                         </div>
                      </div>
                      <div className="p-8 border border-slate-200 text-[11px] text-slate-400 leading-relaxed font-bold uppercase tracking-widest bg-slate-50">
                         Identity authenticated on {new Date(user.created_at || Date.now()).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}.
                      </div>
                   </div>

                   {/* CHANGE PASSWORD SECTION */}
                   <div className="border-t border-slate-100 pt-12">
                      {!showPasswordForm ? (
                        <div className="flex items-center justify-between">
                           <div>
                              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Access Credentials</h4>
                              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Manage your account security and password</p>
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
                                className="text-[11px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest"
                              >
                                Cancel
                              </button>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-2 relative">
                                 <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">New Password</label>
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
                                    className="absolute right-4 bottom-4 text-slate-400"
                                 >
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                 </button>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Confirm Password</label>
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
                 <div className="flex flex-col gap-4 border-b-2 border-slate-300 pb-3 sm:flex-row sm:items-center sm:justify-between">
                   <div>
                     <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{settings.savedAddressesTitleText?.[lang] || 'Saved Addresses'}</h3>
                     <p className="mt-2 text-xs font-medium text-slate-500">{settings.addAddressFasterCheckoutText?.[lang] || 'Add an address for faster checkout.'}</p>
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
                       <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{settings.noAddressesSavedText?.[lang] || 'No addresses saved'}</p>
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

      <AnimatePresence>
        {isAddressModalOpen && (
          <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 md:p-8">
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
              className="relative z-[106] w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-300 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-6 py-5 md:px-8">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
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
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{settings.firstNameLabelText?.[lang] || 'First Name'}</label>
                    <input value={addressForm.firstName} onChange={(e) => handleAddressFieldChange('firstName', e.target.value)} className="w-full border border-slate-300 bg-white p-4 text-sm font-bold text-slate-900 transition-all focus:outline-none focus:border-slate-900" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{settings.lastNameLabelText?.[lang] || 'Last Name'}</label>
                    <input value={addressForm.lastName} onChange={(e) => handleAddressFieldChange('lastName', e.target.value)} className="w-full border border-slate-300 bg-white p-4 text-sm font-bold text-slate-900 transition-all focus:outline-none focus:border-slate-900" required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{settings.streetAddressLabelText?.[lang] || 'Street Address'}</label>
                    <input value={addressForm.street} onChange={(e) => handleAddressFieldChange('street', e.target.value)} className="w-full border border-slate-300 bg-white p-4 text-sm font-bold text-slate-900 transition-all focus:outline-none focus:border-slate-900" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{settings.cityLabelText?.[lang] || 'City'}</label>
                    <input value={addressForm.city} onChange={(e) => handleAddressFieldChange('city', e.target.value)} className="w-full border border-slate-300 bg-white p-4 text-sm font-bold text-slate-900 transition-all focus:outline-none focus:border-slate-900" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{settings.postalCodeLabelText?.[lang] || 'Postal Code'}</label>
                    <input value={addressForm.postalCode} onChange={(e) => handleAddressFieldChange('postalCode', e.target.value)} className="w-full border border-slate-300 bg-white p-4 text-sm font-bold text-slate-900 transition-all focus:outline-none focus:border-slate-900" required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{settings.countryLabelText?.[lang] || 'Country'}</label>
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

      {/* SUPPORT MODAL (Standardized Design) */}
      <AnimatePresence>
        {supportOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4 md:p-12 lg:p-24">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto"
              onClick={() => { if(!isSubmittingSupport) setSupportOrder(null); }}
            />
            
            <motion.div
              initial={{ scale: 1, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1, opacity: 0, y: 10 }}
              className="bg-white w-full max-w-4xl border border-slate-300 overflow-hidden shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]"
            >
              {/* Modal Technical Header */}
              <div className="px-12 py-12 border-b-2 border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-slate-50">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <span className="text-[11px] font-bold bg-slate-900 text-white px-2 py-0.5 tracking-widest uppercase">Support Protocol</span>
                     <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">REF: #{supportOrder.orderId || supportOrder.id.slice(0,10).toUpperCase()}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">How can we assist?</h3>
                </div>
                <button 
                   disabled={isSubmittingSupport}
                   onClick={() => setSupportOrder(null)} 
                   className="w-12 h-12 bg-white flex items-center justify-center text-slate-900 transition-all border border-slate-300 hover:border-slate-950"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12">
                {!supportType ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-300 border border-slate-300 max-w-3xl mx-auto">
                     {[
                       { id: 'help', label: 'General Help', desc: 'Questions on logistics or data', icon: HelpCircle },
                       { id: 'replacement', label: 'Replacement', desc: 'Report damaged inventory', icon: RefreshCcw },
                       { id: 'refund', label: 'Request Refund', desc: 'Credit and recovery protocol', icon: CreditCard },
                       { id: 'chat', label: 'Direct Chat', desc: 'Secure agent communication', icon: MessageSquare },
                     ].map((opt) => (
                       <button
                         key={opt.id}
                         onClick={() => setSupportType(opt.id as SupportType)}
                         className="flex flex-col items-start p-10 bg-white hover:bg-slate-50 transition-all group"
                       >
                         <div className="w-12 h-12 bg-slate-900 flex items-center justify-center mb-8 text-white">
                            <opt.icon className="w-5 h-5" />
                         </div>
                         <p className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-2">{opt.label}</p>
                         <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">{opt.desc}</p>
                       </button>
                     ))}
                  </div>
                ) : (
                  <div className="max-w-xl mx-auto space-y-12 animate-in fade-in duration-300 flex flex-col h-full">
                     <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                        <button 
                          onClick={() => setSupportType(null)}
                          className="text-[11px] font-bold text-slate-400 hover:text-slate-900 transition-all uppercase tracking-widest flex items-center gap-2"
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
                                <div className="bg-white border border-slate-300 p-6 shadow-sm">
                                  <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
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
                             <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 block border-l-4 border-slate-900 pl-4">Inquiry Rationale & Context</label>
                             <textarea 
                                value={supportMessage}
                                onChange={(e) => setSupportMessage(e.target.value)}
                                placeholder="Detail your requirement..."
                                className="w-full bg-white border-2 border-slate-300 p-10 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-950 h-64 resize-none"
                             />
                             
                             <div className="mt-4 flex flex-col gap-4">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Attachments & Visual Evidence</label>
                                <div className="flex items-center gap-4">
                                  {supportImageUrl ? (
                                    <div className="relative w-24 h-24 border border-slate-300 bg-white group">
                                      <Image src={supportImageUrl} alt="Support attachment" fill className="object-cover" />
                                      <button 
                                        onClick={() => setSupportImageUrl('')}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-300 rounded-full flex items-center justify-center shadow-sm hover:border-slate-900"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <label className="w-24 h-24 border-2 border-dashed border-slate-200 hover:border-slate-900 bg-slate-50 flex items-center justify-center cursor-pointer transition-all">
                                      <div className="flex flex-col items-center">
                                        <Plus className="w-5 h-5 text-slate-300" />
                                        <span className="text-[8px] font-bold uppercase text-slate-400 mt-1">Add Image</span>
                                      </div>
                                      <input type="file" className="hidden" accept="image/*" onChange={handleSupportFileUpload} />
                                    </label>
                                  )}
                                  <div className="flex-1">
                                    <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase">
                                       Upload a high-quality photo of the product or issue to expedite our technical audit.
                                    </p>
                                  </div>
                                </div>
                             </div>
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
    </div>
  );
}
