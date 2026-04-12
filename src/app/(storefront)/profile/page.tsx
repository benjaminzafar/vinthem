"use client";
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { Package, User, MapPin, ChevronRight, ChevronDown, Truck, RefreshCcw, FileText, ExternalLink, Check, Edit, Trash2, Star, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/utils/firestoreErrorHandler';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';

interface Order {
  id: string;
  orderId: string;
  createdAt: string;
  total: number;
  currency?: string;
  status: string;
  items: any[];
  trackingNumber?: string;
  shippingCost?: number;
}

interface Address {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

import { useSettingsStore } from '@/store/useSettingsStore';

export default function CustomerPanel() {
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const { settings } = useSettingsStore();
  const navigate = useRouter();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    firstName: '',
    lastName: '',
    street: '',
    city: '',
    postalCode: '',
    country: '',
    isDefault: false
  });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribeOrders = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      // Sort client-side to avoid needing a composite index
      fetchedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setOrders(fetchedOrders);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    const qAddresses = query(
      collection(db, 'addresses'),
      where('userId', '==', user.uid)
    );

    const unsubscribeAddresses = onSnapshot(qAddresses, (snapshot) => {
      const fetchedAddresses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Address[];
      setAddresses(fetchedAddresses);
      setAddressesLoading(false);
    }, (error) => {
      setAddressesLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'addresses');
    });

    return () => {
      unsubscribeOrders();
      unsubscribeAddresses();
    };
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#fcfcfc] px-4">
        <div className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center mb-8 border border-gray-100">
          <User className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-4xl font-sans text-brand-ink mb-4 tracking-tight">{settings.accessRestrictedText?.[lang] || 'Access Restricted'}</h2>
        <p className="text-lg text-brand-muted mb-8">{settings.pleaseLoginText?.[lang] || 'Please log in to view your account.'}</p>
        <button onClick={() => navigate.push('/login')} className="bg-brand-ink text-white px-10 py-4 rounded-2xl font-medium text-sm uppercase tracking-wide hover:bg-gray-800 transition-all">
          Log In
        </button>
      </div>
    );
  }

  const handleRefundRequest = (orderId: string) => {
    toast.success(`${settings.returnProcessText?.[lang] || 'Return process started for'} ${orderId}. ${settings.instructionsSentText?.[lang] || 'Instructions sent to your email.'}`);
  };

  const generateMockTracking = (orderId: string) => {
    // Generate a consistent mock tracking number based on order ID
    const hash = orderId.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
    return `PN${Math.abs(hash).toString().substring(0, 9)}SE`;
  };

  const getStatusStep = (status: string) => {
    if (status === 'Delivered') return 3;
    if (status === 'Shipped') return 2;
    return 1;
  };

  const resetAddressForm = () => {
    setAddressForm({
      firstName: '',
      lastName: '',
      street: '',
      city: '',
      postalCode: '',
      country: '',
      isDefault: false
    });
    setEditingAddressId(null);
    setIsAddingAddress(false);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // If setting as default, unset other defaults first
      if (addressForm.isDefault) {
        const defaultAddresses = addresses.filter(a => a.isDefault && a.id !== editingAddressId);
        for (const addr of defaultAddresses) {
          await updateDoc(doc(db, 'addresses', addr.id!), { isDefault: false });
        }
      }

      // If it's the first address, make it default automatically
      const isFirstAddress = addresses.length === 0;
      const finalIsDefault = addressForm.isDefault || isFirstAddress;

      const addressData = {
        ...addressForm,
        isDefault: finalIsDefault,
        userId: user.uid
      };

      if (editingAddressId) {
        await updateDoc(doc(db, 'addresses', editingAddressId), addressData);
        toast.success(settings.addressUpdatedText?.[lang] || 'Address updated successfully');
      } else {
        await addDoc(collection(db, 'addresses'), addressData);
        toast.success(settings.addressAddedText?.[lang] || 'Address added successfully');
      }
      resetAddressForm();
    } catch (error) {
      handleFirestoreError(error, editingAddressId ? OperationType.UPDATE : OperationType.CREATE, 'addresses');
      toast.error(settings.failedToSaveAddressText?.[lang] || 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'addresses', id));
      toast.success(settings.addressDeletedText?.[lang] || 'Address deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'addresses');
      toast.error(settings.failedToDeleteAddressText?.[lang] || 'Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      const defaultAddresses = addresses.filter(a => a.isDefault);
      for (const addr of defaultAddresses) {
        await updateDoc(doc(db, 'addresses', addr.id!), { isDefault: false });
      }
      await updateDoc(doc(db, 'addresses', id), { isDefault: true });
      toast.success(settings.defaultAddressUpdatedText?.[lang] || 'Default address updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'addresses');
      toast.error(settings.failedToUpdateDefaultAddressText?.[lang] || 'Failed to update default address');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate.push('/');
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="bg-[#fcfcfc] min-h-screen pb-24 font-sans">
      {/* Premium Header */}
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-sans text-brand-ink tracking-tight mb-4"
        >
          {settings.accountTitleText?.[lang] || 'My Account'}.
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 96 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="h-1 bg-brand-ink mb-6"
        ></motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-brand-muted font-normal max-w-2xl"
        >
          {settings.accountDescriptionText?.[lang] || 'Manage your orders, addresses, and profile details.'}
        </motion.p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Minimal Sidebar */}
          <div className="w-full lg:w-64 shrink-0">
            {/* Mobile Dropdown */}
            <div className="lg:hidden mb-6 relative">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 text-brand-ink py-4 pl-5 pr-10 rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-ink shadow-sm"
              >
                <option value="orders">{settings.ordersText?.[lang] || 'Orders'}</option>
                <option value="profile">{settings.profileText?.[lang] || 'Profile'}</option>
                <option value="addresses">{settings.addressesText?.[lang] || 'Addresses'}</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-brand-muted">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block sticky top-32 space-y-2 py-8 border-b border-gray-200/60 last:border-0">
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 text-sm ${activeTab === 'orders' ? 'bg-brand-ink text-white' : 'text-brand-muted hover:bg-gray-50 hover:text-brand-ink'}`}
              >
                <div className="flex items-center space-x-3">
                  <Package className="w-4 h-4" />
                  <span className="font-medium">{settings.ordersText?.[lang] || 'Orders'}</span>
                </div>
                {activeTab === 'orders' && <ChevronRight className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 text-sm ${activeTab === 'profile' ? 'bg-brand-ink text-white' : 'text-brand-muted hover:bg-gray-50 hover:text-brand-ink'}`}
              >
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{settings.profileText?.[lang] || 'Profile'}</span>
                </div>
                {activeTab === 'profile' && <ChevronRight className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setActiveTab('addresses')}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 text-sm ${activeTab === 'addresses' ? 'bg-brand-ink text-white' : 'text-brand-muted hover:bg-gray-50 hover:text-brand-ink'}`}
              >
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{settings.addressesText?.[lang] || 'Addresses'}</span>
                </div>
                {activeTab === 'addresses' && <ChevronRight className="w-4 h-4" />}
              </button>
              
              <div className="pt-4 mt-4 border-t border-gray-100">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center px-5 py-4 rounded-2xl transition-all duration-300 text-sm text-red-500 hover:bg-red-50"
                >
                  <div className="flex items-center space-x-3">
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Sign Out</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {activeTab === 'orders' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                {loading ? (
                  <div className="flex justify-center py-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-ink"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-16 text-center border-b border-gray-200/60 last:border-0">
                    <div className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Package className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-2xl font-sans mb-3 text-brand-ink">{settings.noOrdersYetText?.[lang] || 'No orders yet'}</h3>
                    <p className="text-brand-muted text-lg mb-8">{settings.noOrdersDescriptionText?.[lang] || 'When you place an order, it will appear here.'}</p>
                    <button onClick={() => window.location.href = '/'} className="bg-brand-ink text-white px-8 py-4 rounded-2xl font-medium hover:bg-gray-800 transition-colors text-sm uppercase tracking-wide">
                      {settings.startShoppingText?.[lang] || 'Start Shopping'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => {
                      const isDelivered = order.status === 'Delivered';
                      const isShipped = order.status === 'Shipped' || isDelivered;
                      const trackingNumber = order.trackingNumber || (isShipped ? generateMockTracking(order.id) : null);
                      const isExpanded = expandedOrderId === order.id;
                      
                      return (
                        <div key={order.id} className="border-b border-gray-200/60 last:border-0 overflow-hidden transition-shadow">
                          {/* Order Header (Clickable) */}
                          <div 
                            className="p-6 sm:p-8 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-6 group transition-colors"
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                          >
                            <div className="flex flex-wrap items-center gap-x-10 gap-y-6 flex-1">
                              <div>
                                <p className="text-xs text-brand-muted uppercase tracking-widest font-bold mb-1">{settings.orderLabelText?.[lang] || 'Order'}</p>
                                <p className="font-mono text-sm font-medium text-brand-ink">{order.orderId}</p>
                              </div>
                              <div>
                                <p className="text-xs text-brand-muted uppercase tracking-widest font-bold mb-1">{settings.dateLabelText?.[lang] || 'Date'}</p>
                                <p className="text-sm text-brand-ink font-medium">{new Date(order.createdAt).toLocaleDateString(lang === 'sv' ? 'sv-SE' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                              </div>
                              <div className="hidden sm:block">
                                <p className="text-xs text-brand-muted uppercase tracking-widest font-bold mb-1">{settings.totalLabelText?.[lang] || 'Total'}</p>
                                <p className="text-sm font-medium text-brand-ink">{formatPrice(order.total, lang, undefined, order.currency)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-brand-muted uppercase tracking-widest font-bold mb-1">{settings.statusLabelText?.[lang] || 'Status'}</p>
                                <div className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${isDelivered ? 'bg-green-500' : order.status === 'Shipped' ? 'bg-blue-500' : 'bg-amber-500'}`}></div>
                                  <span className="text-sm font-medium text-brand-ink">{order.status === 'Delivered' ? (settings.deliveredStatusText?.[lang] || 'Delivered') : order.status === 'Shipped' ? (settings.shippedStatusText?.[lang] || 'Shipped') : (settings.processingStatusText?.[lang] || 'Processing')}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                              <div className="sm:hidden">
                                <p className="text-xs text-brand-muted uppercase tracking-widest font-bold mb-1">{settings.totalLabelText?.[lang] || 'Total'}</p>
                                <p className="text-sm font-medium text-brand-ink">{formatPrice(order.total, lang, undefined, order.currency)}</p>
                              </div>
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${isExpanded ? 'bg-brand-ink text-white' : 'bg-gray-50 text-brand-ink group-hover:bg-gray-100'}`}>
                                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                            </div>
                          </div>
                          
                          {/* Expanded Details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                exit={{ opacity: 0, height: 0 }}
                                className="border-t border-gray-100 bg-gray-50/50"
                              >
                                <div className="p-6 sm:p-8">
                                  {/* Status Timeline */}
                                  <div className="mb-12 max-w-2xl mx-auto px-4">
                                    <div className="flex items-center justify-between relative">
                                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 z-0 rounded-full"></div>
                                      <div 
                                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-ink z-0 transition-all duration-700 ease-out rounded-full" 
                                        style={{ width: `${(getStatusStep(order.status || 'Processing') - 1) * 50}%` }}
                                      ></div>
                                      
                                      {[settings.processingStatusText?.[lang] || 'Processing', settings.shippedStatusText?.[lang] || 'Shipped', settings.deliveredStatusText?.[lang] || 'Delivered'].map((step, idx) => {
                                        const stepNum = idx + 1;
                                        const currentStep = getStatusStep(order.status || 'Processing');
                                        const isCompleted = currentStep >= stepNum;
                                        const isCurrent = currentStep === stepNum;
                                        
                                        return (
                                          <div key={step} className="relative z-10 flex flex-col items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-4 transition-all duration-500 ${
                                              isCompleted ? 'bg-brand-ink border-white text-white shadow-sm' : 'bg-white border-gray-200 text-gray-400'
                                            }`}>
                                              {isCompleted ? <Check className="w-5 h-5" /> : stepNum}
                                            </div>
                                            <span className={`absolute top-12 text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                                              isCurrent ? 'text-brand-ink' : isCompleted ? 'text-brand-ink' : 'text-gray-400'
                                            }`}>{step}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <div className="flex flex-col xl:flex-row gap-8 xl:gap-12 mt-16">
                                    {/* Items List */}
                                    <div className="flex-1">
                                      <h4 className="text-sm font-bold text-brand-ink uppercase tracking-wider mb-6 flex items-center justify-between">
                                        <span>{settings.orderItemsText?.[lang] || 'Order Items'}</span>
                                        <button className="text-brand-muted hover:text-brand-ink flex items-center text-xs font-medium transition-colors">
                                          <FileText className="w-4 h-4 mr-1.5" /> {settings.receiptText?.[lang] || 'Receipt'}
                                        </button>
                                      </h4>
                                      <div className="space-y-4">
                                        {order.items?.map((item, index) => (
                                          <div key={index} className="flex items-start space-x-6 py-5 border-b border-gray-200/60 last:border-0">
                                            <div className="w-20 h-24 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
                                              {(item.imageUrl && item.imageUrl.trim() !== "") || (item.image && item.image.trim() !== "") ? (
                                                <img src={item.imageUrl || item.image} alt={item.title || item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                              ) : (
                                                <Package className="w-8 h-8 text-gray-300" />
                                              )}
                                            </div>
                                            <div className="flex-1 pt-1">
                                              <div className="flex justify-between items-start">
                                                <div>
                                                  <p className="font-sans font-medium text-brand-ink text-lg leading-tight mb-1">{item.translations?.[lang]?.title || item.title || item.name}</p>
                                                  <p className="text-sm text-brand-muted">{settings.qtyText?.[lang] || 'Qty'}: {item.quantity}</p>
                                                </div>
                                                <p className="font-medium text-brand-ink">{formatPrice(item.price * item.quantity, lang, undefined, order.currency)}</p>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      
                                      {/* Order Totals */}
                                      <div className="mt-6 py-6 border-b border-gray-200/60 last:border-0">
                                        <div className="space-y-3 text-sm">
                                          <div className="flex justify-between text-brand-muted">
                                            <span>{settings.subtotalText?.[lang] || 'Subtotal'}</span>
                                            <span>{formatPrice((order.total - (order.shippingCost || 0)), lang, undefined, order.currency)}</span>
                                          </div>
                                          <div className="flex justify-between text-brand-muted">
                                            <span>{settings.shippingText?.[lang] || 'Shipping'}</span>
                                            <span>{formatPrice(order.shippingCost || 0, lang, undefined, order.currency)}</span>
                                          </div>
                                          <div className="pt-3 border-t border-gray-100 flex justify-between font-medium text-brand-ink text-base">
                                            <span>{settings.totalText?.[lang] || 'Total'}</span>
                                            <span>{formatPrice(order.total, lang, undefined, order.currency)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Shipping & Actions */}
                                    <div className="w-full xl:w-[340px] shrink-0 space-y-6">
                                      {/* PostNord Tracking Widget */}
                                      <div className="py-6 relative overflow-hidden border-b border-gray-200/60 last:border-0">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00529C]"></div>
                                        <div className="flex items-center justify-between mb-6">
                                          <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#00529C]/10 flex items-center justify-center">
                                              <Truck className="w-5 h-5 text-[#00529C]" />
                                            </div>
                                            <h4 className="font-bold text-brand-ink text-base">{settings.trackingTitleText?.[lang] || 'Track Delivery'}</h4>
                                          </div>
                                          <span className={`px-3 py-1 text-xs font-bold rounded-2xl uppercase tracking-wider ${isDelivered ? 'bg-green-50 text-green-700' : isShipped ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {isDelivered ? (settings.deliveredStatusText?.[lang] || 'Delivered') : isShipped ? (settings.inTransitStatusText?.[lang] || 'In Transit') : (settings.pendingStatusText?.[lang] || 'Pending')}
                                          </span>
                                        </div>
                                        
                                        {trackingNumber ? (
                                          <div className="space-y-4">
                                            <div className="flex flex-col space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs text-brand-muted font-medium uppercase tracking-wider">{settings.trackingNumberText?.[lang] || 'Tracking Number'}</span>
                                                <span className="font-mono text-sm font-bold text-brand-ink">{trackingNumber}</span>
                                              </div>
                                              <a href={`https://www.postnord.se/en/our-tools/track-and-trace?shipmentId=${trackingNumber}`} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full bg-[#00529C] text-white py-2.5 rounded-2xl hover:bg-blue-800 text-sm font-medium transition-colors">
                                                {settings.trackButtonText?.[lang] || 'Track on PostNord'} <ExternalLink className="w-4 h-4 ml-2" />
                                              </a>
                                            </div>
                                          </div>
                                        ) : (
                                          <p className="text-sm text-brand-muted bg-gray-50 p-4 rounded-2xl border border-gray-100">{settings.trackingPendingDescriptionText?.[lang] || 'Tracking information will be available once your order ships.'}</p>
                                        )}
                                      </div>
                                      
                                      {/* Returns & Refunds Widget */}
                                      <div className="py-6 border-b border-gray-200/60 last:border-0">
                                        <div className="flex items-center space-x-3 mb-4">
                                          <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center">
                                            <RefreshCcw className="w-5 h-5 text-brand-ink" />
                                          </div>
                                          <h4 className="font-bold text-brand-ink text-base">{settings.returnsRefundsTitleText?.[lang] || 'Returns'}</h4>
                                        </div>
                                        
                                        <p className="text-sm text-brand-muted mb-6 leading-relaxed">
                                          {settings.returnsDescriptionText?.[lang] || 'You have 30 days to return your items after delivery.'}
                                        </p>
                                        
                                        <button 
                                          onClick={() => handleRefundRequest(order.orderId)}
                                          disabled={!isDelivered}
                                          className={`w-full px-4 py-3 rounded-2xl text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
                                            isDelivered 
                                              ? 'bg-brand-ink text-white hover:bg-gray-800' 
                                              : 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100'
                                          }`}
                                        >
                                          <span>{settings.openCaseText?.[lang] || 'Start a Return'}</span>
                                        </button>
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

            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-8 md:py-12 border-b border-gray-200/60 last:border-0">
                <h2 className="text-3xl font-sans text-brand-ink mb-8 tracking-tight">{settings.profileDetailsTitleText?.[lang] || 'Profile Details'}</h2>
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-8 mb-10 pb-10 border-b border-gray-100">
                  <div className="relative">
                    <img src={(user.photoURL && user.photoURL.trim() !== "") ? user.photoURL : 'https://ui-avatars.com/api/?name=' + (user.displayName || 'User') + '&background=141414&color=fff'} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md" referrerPolicy="no-referrer" />
                    <button className="absolute bottom-0 right-0 bg-white border border-gray-200 p-2.5 rounded-full hover:bg-gray-50 text-brand-ink transition-colors shadow-sm">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-center sm:text-left pt-2">
                    <h3 className="text-3xl font-sans text-brand-ink mb-2">{user.displayName || settings.guestUserText?.[lang] || 'Guest User'}</h3>
                    <p className="text-brand-muted text-lg">{user.email}</p>
                    <span className="inline-block mt-4 px-4 py-1.5 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider rounded-2xl">{settings.verifiedAccountText?.[lang] || 'Verified Account'}</span>
                  </div>
                </div>
                
                <div className="space-y-8 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">{settings.fullNameLabelText?.[lang] || 'Full Name'}</label>
                      <input type="text" disabled value={user.displayName || ''} className="w-full border-gray-200 rounded-2xl bg-gray-50 px-4 py-3.5 border text-brand-ink focus:ring-0 cursor-not-allowed font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">{settings.emailAddressLabelText?.[lang] || 'Email Address'}</label>
                      <input type="email" disabled value={user.email || ''} className="w-full border-gray-200 rounded-2xl bg-gray-50 px-4 py-3.5 border text-brand-ink focus:ring-0 cursor-not-allowed font-medium" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'addresses' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-sans text-brand-ink tracking-tight">{settings.savedAddressesTitleText?.[lang] || 'Saved Addresses'}</h2>
                  {!isAddingAddress && (
                    <button 
                      onClick={() => setIsAddingAddress(true)}
                      className="bg-brand-ink text-white px-6 py-3 rounded-2xl text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                      {settings.addNewButtonText?.[lang] || 'Add New'}
                    </button>
                  )}
                </div>
                
                {isAddingAddress ? (
                  <div className="py-8 border-b border-gray-200/60 last:border-0">
                    <h3 className="text-2xl font-sans text-brand-ink mb-8">{editingAddressId ? (settings.editAddressTitleText?.[lang] || 'Edit Address') : (settings.addNewAddressTitleText?.[lang] || 'Add New Address')}</h3>
                    <form onSubmit={handleSaveAddress} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">{settings.firstNameLabelText?.[lang] || 'First Name'}</label>
                          <input 
                            type="text" 
                            required
                            value={addressForm.firstName}
                            onChange={(e) => setAddressForm({...addressForm, firstName: e.target.value})}
                            className="w-full border-gray-200 rounded-2xl bg-gray-50 px-4 py-3.5 border text-brand-ink focus:ring-1 focus:ring-brand-ink focus:border-brand-ink transition-shadow" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">{settings.lastNameLabelText?.[lang] || 'Last Name'}</label>
                          <input 
                            type="text" 
                            required
                            value={addressForm.lastName}
                            onChange={(e) => setAddressForm({...addressForm, lastName: e.target.value})}
                            className="w-full border-gray-200 rounded-2xl bg-gray-50 px-4 py-3.5 border text-brand-ink focus:ring-1 focus:ring-brand-ink focus:border-brand-ink transition-shadow" 
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">{settings.streetAddressLabelText?.[lang] || 'Street Address'}</label>
                          <input 
                            type="text" 
                            required
                            value={addressForm.street}
                            onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                            className="w-full border-gray-200 rounded-2xl bg-gray-50 px-4 py-3.5 border text-brand-ink focus:ring-1 focus:ring-brand-ink focus:border-brand-ink transition-shadow" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">{settings.cityLabelText?.[lang] || 'City'}</label>
                          <input 
                            type="text" 
                            required
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                            className="w-full border-gray-200 rounded-2xl bg-gray-50 px-4 py-3.5 border text-brand-ink focus:ring-1 focus:ring-brand-ink focus:border-brand-ink transition-shadow" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">{settings.postalCodeLabelText?.[lang] || 'Postal Code'}</label>
                          <input 
                            type="text" 
                            required
                            value={addressForm.postalCode}
                            onChange={(e) => setAddressForm({...addressForm, postalCode: e.target.value})}
                            className="w-full border-gray-200 rounded-2xl bg-gray-50 px-4 py-3.5 border text-brand-ink focus:ring-1 focus:ring-brand-ink focus:border-brand-ink transition-shadow" 
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">{settings.countryLabelText?.[lang] || 'Country'}</label>
                          <select 
                            required
                            value={addressForm.country}
                            onChange={(e) => setAddressForm({...addressForm, country: e.target.value})}
                            className="w-full border-gray-200 rounded-2xl bg-gray-50 px-4 py-3.5 border text-brand-ink focus:ring-1 focus:ring-brand-ink focus:border-brand-ink transition-shadow appearance-none" 
                          >
                            <option value="">Select Country</option>
                            <option value="SE">Sweden</option>
                            <option value="DK">Denmark</option>
                            <option value="FI">Finland</option>
                            <option value="NO">Norway</option>
                            <option value="IS">Iceland</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 pt-4">
                        <input 
                          type="checkbox" 
                          id="isDefault"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})}
                          className="w-5 h-5 rounded border-gray-300 text-brand-ink focus:ring-brand-ink"
                        />
                        <label htmlFor="isDefault" className="text-sm font-medium text-brand-ink">{settings.setDefaultAddressLabelText?.[lang] || 'Set as default address'}</label>
                      </div>

                      <div className="flex items-center justify-end space-x-4 pt-8 border-t border-gray-100">
                        <button 
                          type="button"
                          onClick={resetAddressForm}
                          className="px-6 py-3 rounded-2xl text-sm font-medium text-brand-muted hover:text-brand-ink hover:bg-gray-50 transition-colors"
                        >
                          {settings.cancelButtonText?.[lang] || 'Cancel'}
                        </button>
                        <button 
                          type="submit"
                          className="bg-brand-ink text-white px-8 py-3 rounded-2xl text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                          {settings.saveAddressButtonText?.[lang] || 'Save Address'}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : addressesLoading ? (
                  <div className="flex justify-center py-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-ink"></div>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="py-16 text-center border-b border-gray-200/60 last:border-0">
                    <div className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <MapPin className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-2xl font-sans mb-3 text-brand-ink">{settings.noAddressesSavedText?.[lang] || 'No addresses saved'}</h3>
                    <p className="text-brand-muted text-lg mb-8">{settings.addAddressDescriptionText?.[lang] || 'Add an address for faster checkout.'}</p>
                    <button 
                      onClick={() => setIsAddingAddress(true)}
                      className="border-2 border-brand-ink text-brand-ink px-8 py-3.5 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      {settings.addNewAddressTitleText?.[lang] || 'Add New Address'}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {addresses.map((address) => (
                      <div key={address.id} className={`py-8 relative transition-all duration-300 border-b border-gray-200/60 last:border-0 ${address.isDefault ? "border-brand-ink" : ""}`}>
                        {address.isDefault && (
                          <div className="absolute top-6 right-6 bg-brand-ink text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-2xl">
                            {settings.defaultBadgeText?.[lang] || 'Default'}
                          </div>
                        )}
                        
                        <div className="mb-8 pr-16">
                          <h4 className="font-bold text-brand-ink text-xl mb-2">{address.firstName} {address.lastName}</h4>
                          <p className="text-base text-brand-muted leading-relaxed">
                            {address.street}<br />
                            {address.postalCode} {address.city}<br />
                            {address.country}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-4 pt-6 border-t border-gray-100">
                          {!address.isDefault && (
                            <button 
                              onClick={() => handleSetDefaultAddress(address.id)}
                              className="text-xs font-bold text-brand-ink hover:text-gray-600 uppercase tracking-widest transition-colors"
                            >
                              {settings.setDefaultButtonText?.[lang] || 'Set Default'}
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setAddressForm({
                                firstName: address.firstName,
                                lastName: address.lastName,
                                street: address.street,
                                city: address.city,
                                postalCode: address.postalCode,
                                country: address.country,
                                isDefault: address.isDefault
                              });
                              setEditingAddressId(address.id);
                              setIsAddingAddress(true);
                            }}
                            className="text-xs font-bold text-brand-ink hover:text-gray-600 uppercase tracking-widest transition-colors"
                          >
                            {settings.editButtonText?.[lang] || 'Edit'}
                          </button>
                          <button 
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-widest transition-colors ml-auto"
                          >
                            {settings.deleteButtonText?.[lang] || 'Delete'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
