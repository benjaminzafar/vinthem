"use client";
import React, { useState, useEffect } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTranslation } from 'react-i18next';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Lock, Truck, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';
import { motion } from 'motion/react';
import { formatPrice } from '@/lib/currency';
import { createClient } from '@/utils/supabase/client';

const stripePromise = fetch('/api/config/stripe-public-key')
  .then(res => res.json())
  .then(data => data.publicKey ? loadStripe(data.publicKey) : null)
  .catch(() => null);

// PostNord Shipping Rates (SEK)
const SHIPPING_RATES: Record<string, number> = {
  'SE': 49, // Sweden
  'DK': 69, // Denmark
  'FI': 79, // Finland
  'NO': 89, // Norway
  'IS': 149 // Iceland
};

function CheckoutForm({ 
  clientSecret, 
  shippingDetails, 
  setShippingDetails, 
  shippingCost 
}: { 
  clientSecret: string,
  shippingDetails: any,
  setShippingDetails: any,
  shippingCost: number
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { items, total, clearCart } = useCartStore();
  const { settings } = useSettingsStore();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const navigate = useRouter();
  const [loading, setLoading] = useState(false);
  
  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setShippingDetails({ ...shippingDetails, [e.target.name]: e.target.value });
  };

  const finalTotal = total(lang) + shippingCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const toastId = toast.loading(settings.processingOrderText?.[lang] || 'Processing your order...');

    try {
      // Confirm the payment with Stripe
      // The backend has already created the Pending order and linked it to this PaymentIntent
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/profile`,
          payment_method_data: {
            billing_details: {
              name: shippingDetails.name,
              email: shippingDetails.email,
              address: {
                line1: shippingDetails.address,
                city: shippingDetails.city,
                postal_code: shippingDetails.postalCode,
                country: shippingDetails.country,
              }
            }
          }
        },
        redirect: 'if_required',
      });

      if (error) {
        throw new Error(error.message);
      }

      // If we get here, payment succeeded (or requires redirect which is handled by Stripe)
      // The Stripe Webhook on the backend will update the order status to 'Processing'
      
      toast.success(settings.orderPlacedSuccessText?.[lang] || 'Order placed successfully!', { id: toastId });
      clearCart();
      navigate.push('/profile');
      
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || settings.paymentFailedText?.[lang] || 'Payment failed', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fcfcfc] min-h-screen pb-24 font-sans">
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-sans text-brand-ink tracking-tight mb-4"
        >
          {settings.paymentTitle?.[lang] || 'Checkout'}.
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 96 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="h-1 bg-brand-ink mb-6"
        ></motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* Left Column: Forms */}
          <div className="flex-1 space-y-12">
            
            {/* Shipping Details */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-8 rounded-2xl border border-gray-200"
            >
              <h2 className="text-2xl font-sans text-brand-ink mb-8 flex items-center tracking-tight">
                <Truck className="w-5 h-5 mr-3 text-brand-ink" /> {settings.shippingInformationText?.[lang] || 'Shipping Information'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">{settings.fullNameLabel?.[lang] || 'Full Name'}</label>
                  <input required type="text" name="name" value={shippingDetails.name} onChange={handleShippingChange} className="w-full border-gray-200 rounded-2xl bg-gray-50 px-4 py-3 border text-brand-ink focus:ring-1 focus:ring-brand-ink focus:border-brand-ink" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">{settings.emailLabel?.[lang] || 'Email Address'}</label>
                  <input required type="email" name="email" value={shippingDetails.email} onChange={handleShippingChange} className="w-full border-gray-200 rounded-2xl bg-gray-50 px-4 py-3 border text-brand-ink focus:ring-1 focus:ring-brand-ink focus:border-brand-ink" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">{settings.addressLabel?.[lang] || 'Street Address'}</label>
                  <input required type="text" name="address" value={shippingDetails.address} onChange={handleShippingChange} className="w-full border-gray-200 rounded-2xl bg-gray-50 px-4 py-3 border text-brand-ink focus:ring-1 focus:ring-brand-ink focus:border-brand-ink" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">{settings.cityLabel?.[lang] || 'City'}</label>
                  <input required type="text" name="city" value={shippingDetails.city} onChange={handleShippingChange} className="w-full border-gray-200 rounded-2xl bg-gray-50 px-4 py-3 border text-brand-ink focus:ring-1 focus:ring-brand-ink focus:border-brand-ink" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">{settings.postalCodeLabel?.[lang] || 'Postal Code'}</label>
                  <input required type="text" name="postalCode" value={shippingDetails.postalCode} onChange={handleShippingChange} className="w-full border-gray-200 rounded-2xl bg-gray-50 px-4 py-3 border text-brand-ink focus:ring-1 focus:ring-brand-ink focus:border-brand-ink" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">{settings.countryLabelText?.[lang] || 'Country'}</label>
                  <select 
                    required 
                    name="country" 
                    value={shippingDetails.country} 
                    onChange={handleShippingChange} 
                    className="w-full border-gray-200 rounded-2xl bg-gray-50 px-4 py-3 border text-brand-ink focus:ring-1 focus:ring-brand-ink focus:border-brand-ink appearance-none"
                  >
                    <option value="SE">Sweden</option>
                    <option value="DK">Denmark</option>
                    <option value="FI">Finland</option>
                    <option value="NO">Norway</option>
                    <option value="IS">Iceland</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Payment Details */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-8 rounded-2xl border border-gray-200"
            >
              <h2 className="text-2xl font-sans text-brand-ink mb-8 flex items-center tracking-tight">
                <Lock className="w-5 h-5 mr-3 text-brand-ink" /> {settings.paymentDetailsText?.[lang] || 'Payment Details'}
              </h2>
              <div className="py-4 border border-gray-200 rounded-2xl px-4 bg-gray-50">
                <PaymentElement options={{ layout: 'tabs' }} />
              </div>
            </motion.div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="w-full lg:w-[400px] shrink-0">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-gray-200 p-8 sticky top-32"
            >
              <h3 className="text-2xl font-sans text-brand-ink mb-8">{settings.orderSummaryText?.[lang] || 'Order Summary'}</h3>
              
              {/* Mini Cart Items */}
              <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-20 rounded-2xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
                      {item.imageUrl && item.imageUrl.trim() !== "" ? (
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">IMG</div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="font-medium text-brand-ink text-sm line-clamp-1">{item.translations?.[lang]?.title || item.title}</p>
                      <p className="text-xs text-brand-muted mt-1">Qty: {item.quantity}</p>
                      <p className="text-sm font-medium text-brand-ink mt-1">{formatPrice(item.price * item.quantity, lang, item.prices ? Object.fromEntries(Object.entries(item.prices).map(([k, v]) => [k, v * item.quantity])) : undefined)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 mb-8 border-t border-gray-100 pt-6">
                <div className="flex justify-between text-brand-muted">
                  <span>{settings.subtotalText?.[lang] || 'Subtotal'}</span>
                  <span className="font-medium text-brand-ink">{formatPrice(total(lang), lang)}</span>
                </div>
                <div className="flex justify-between text-brand-muted">
                  <span className="flex items-center">
                    {settings.shippingText?.[lang] || 'Shipping'}
                    <span className="ml-2 text-xs bg-blue-50 text-[#00529C] px-2 py-0.5 rounded-2xl font-medium">PostNord</span>
                  </span>
                  <span className="font-medium text-brand-ink">{formatPrice(shippingCost, lang)}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-brand-muted uppercase tracking-wider font-bold">{settings.totalText?.[lang] || 'Total'}</span>
                  <span className="text-4xl font-sans text-brand-ink">{formatPrice(finalTotal, lang)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!stripe || loading || items.length === 0}
                className="w-full bg-brand-ink text-white px-8 py-4 rounded-2xl font-medium text-sm uppercase tracking-wide hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center group"
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    {settings.processingText?.[lang] || 'Processing...'}
                  </span>
                ) : (
                  <>
                    {settings.payText?.[lang] || 'Pay'} {formatPrice(finalTotal, lang)}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Payment() {
  const [clientSecret, setClientSecret] = useState('');
  const [isMock, setIsMock] = useState(false);
  const { total, items } = useCartStore();
  const { user } = useAuthStore();
  const supabase = createClient();
  const { i18n } = useTranslation();
  const { settings } = useSettingsStore();
  const lang = i18n.language || 'en';

  const [stripeReady, setStripeReady] = useState(false);

  useEffect(() => {
    stripePromise.then(stripe => {
      if (stripe) setStripeReady(true);
    });
  }, []);

  const [shippingDetails, setShippingDetails] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    address: '',
    city: '',
    postalCode: '',
    country: 'SE'
  });

  const [shippingCost, setShippingCost] = useState(SHIPPING_RATES['SE']);

  useEffect(() => {
    const rate = SHIPPING_RATES[shippingDetails.country] || SHIPPING_RATES['SE'];
    setShippingCost(rate);
  }, [shippingDetails.country]);

  const finalTotal = total(lang) + shippingCost;
  const targetCurrency = settings.currencyText?.[lang] || 'SEK';

  useEffect(() => {
    if (finalTotal > 0 && items.length > 0) {
      if (!clientSecret && !isMock) {
        // Create Order and PaymentIntent securely on the backend
        fetch('/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            items,
            shippingDetails,
            shippingCost,
            userId: user?.id,
            currency: lang === 'en' ? 'usd' : (lang === 'fi' ? 'eur' : (lang === 'da' ? 'dkk' : 'sek'))
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.mock) {
              setIsMock(true);
            } else if (data.clientSecret) {
              setClientSecret(data.clientSecret);
            }
          })
          .catch((err) => console.error('Error creating order:', err));
      }
    }
  }, [finalTotal, items.length, targetCurrency]);

  if (isMock || !stripeReady) {
    if (isMock) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc] p-4 text-center">
          <div className="bg-amber-50 text-amber-800 p-6 rounded-2xl max-w-md border border-amber-200">
            <h2 className="text-xl font-bold mb-2">Demo Mode</h2>
            <p className="mb-4">Stripe is not configured. This is a demo checkout.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <div className="w-8 h-8 border-4 border-brand-ink/20 border-t-brand-ink rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <div className="w-8 h-8 border-4 border-brand-ink/20 border-t-brand-ink rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, locale: lang as any }}>
      <CheckoutForm 
        clientSecret={clientSecret} 
        shippingDetails={shippingDetails}
        setShippingDetails={setShippingDetails}
        shippingCost={shippingCost}
      />
    </Elements>
  );
}

