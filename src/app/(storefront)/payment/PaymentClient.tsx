"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ArrowRight, Lock, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

import { estimateCheckoutAction, startCheckoutAction } from '@/app/actions/checkout';
import { formatPrice } from '@/lib/currency';
import { resolveMarket } from '@/lib/markets';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import type { StorefrontSettings } from '@/store/useSettingsStore';
import { useStorefrontSettings } from '@/hooks/useStorefrontSettings';
import { getClientLocale } from '@/lib/locale';

interface ShippingDetails {
  name: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

interface CheckoutEstimateState {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  displayCurrency: string;
  marketLocale: string;
  taxBreakdown: Array<{ amount: number; rate?: number; jurisdiction?: string }>;
}

function createInitialShippingDetails(
  marketCountry: string,
  userEmail?: string,
  userFullName?: string,
): ShippingDetails {
  return {
    name: userFullName || '',
    email: userEmail || '',
    address: '',
    city: '',
    postalCode: '',
    country: marketCountry,
  };
}

interface PaymentClientProps {
  initialSettings: Partial<StorefrontSettings>;
}

export default function PaymentClient({ initialSettings }: PaymentClientProps) {
  const { items } = useCartStore();
  const { user } = useAuthStore();
  const settings = useStorefrontSettings(initialSettings);
  const pathname = usePathname();
  const lang = getClientLocale(pathname);
  const market = resolveMarket(lang);

  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>(() =>
    createInitialShippingDetails(
      market.country,
      user?.email,
      typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : undefined,
    ),
  );
  const [estimate, setEstimate] = useState<CheckoutEstimateState | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lineItems = useMemo(
    () => items.map((item) => ({ id: item.id, quantity: item.quantity })),
    [items],
  );

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsEstimating(true);
      const result = await estimateCheckoutAction({
        items: lineItems,
        shippingDetails,
        locale: lang,
      });

      if (result.success && result.estimate) {
        setEstimate(result.estimate);
      } else {
        toast.error(result.error || 'Failed to estimate taxes.');
      }

      setIsEstimating(false);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [items.length, lineItems, shippingDetails, lang]);

  const handleShippingChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setShippingDetails((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    const toastId = toast.loading(settings.processingOrderText?.[lang] || 'Preparing secure checkout...');

    const result = await startCheckoutAction({
      items: lineItems,
      shippingDetails,
      locale: lang,
    });

    if (!result.success) {
      const message = 'error' in result ? result.error : 'Failed to start checkout.';
      toast.error(message || 'Failed to start checkout.', { id: toastId });
      setIsSubmitting(false);
      return;
    }

    if ('mock' in result && result.mock) {
      toast.info('Stripe is not configured yet.', { id: toastId });
      setIsSubmitting(false);
      return;
    }

    if (!('checkoutUrl' in result) || !result.checkoutUrl) {
      toast.error('Stripe checkout URL is missing.', { id: toastId });
      setIsSubmitting(false);
      return;
    }

    toast.success('Redirecting to Stripe Checkout...', { id: toastId });
    window.location.href = result.checkoutUrl;
  };

  const effectiveEstimate = items.length === 0 ? {
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
    currency: 'SEK',
    displayCurrency: market.currency,
    marketLocale: market.locale,
    taxBreakdown: [],
  } : estimate ?? {
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
    currency: 'SEK',
    displayCurrency: market.currency,
    marketLocale: market.locale,
    taxBreakdown: [],
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24 font-sans">
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 text-4xl tracking-tight text-brand-ink md:text-5xl"
        >
          {settings.paymentTitle?.[lang] || 'Checkout'}.
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 96 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-6 h-1 bg-brand-ink"
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-12 lg:flex-row lg:gap-20">
          <div className="flex-1 space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-gray-200 bg-white p-8"
            >
              <h2 className="mb-8 flex items-center text-2xl tracking-tight text-brand-ink">
                <Truck className="mr-3 h-5 w-5 text-brand-ink" />
                {settings.shippingInformationText?.[lang] || 'Shipping Information'}
              </h2>

              <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                <div className="col-span-2 md:col-span-1">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-brand-muted">
                    {settings.fullNameLabel?.[lang] || 'Full Name'}
                  </label>
                  <input required type="text" name="name" value={shippingDetails.name} onChange={handleShippingChange} className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-brand-ink focus:border-brand-ink focus:ring-1 focus:ring-brand-ink" />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-brand-muted">
                    {settings.emailLabel?.[lang] || 'Email Address'}
                  </label>
                  <input required type="email" name="email" value={shippingDetails.email} onChange={handleShippingChange} className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-brand-ink focus:border-brand-ink focus:ring-1 focus:ring-brand-ink" />
                </div>

                <div className="col-span-2">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-brand-muted">
                    {settings.addressLabel?.[lang] || 'Street Address'}
                  </label>
                  <input required type="text" name="address" value={shippingDetails.address} onChange={handleShippingChange} className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-brand-ink focus:border-brand-ink focus:ring-1 focus:ring-brand-ink" />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-brand-muted">
                    {settings.cityLabel?.[lang] || 'City'}
                  </label>
                  <input required type="text" name="city" value={shippingDetails.city} onChange={handleShippingChange} className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-brand-ink focus:border-brand-ink focus:ring-1 focus:ring-brand-ink" />
                </div>

                <div className="col-span-1">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-brand-muted">
                    {settings.postalCodeLabel?.[lang] || 'Postal Code'}
                  </label>
                  <input required type="text" name="postalCode" value={shippingDetails.postalCode} onChange={handleShippingChange} className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-brand-ink focus:border-brand-ink focus:ring-1 focus:ring-brand-ink" />
                </div>

                <div className="col-span-2">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-brand-muted">
                    {settings.countryLabelText?.[lang] || 'Country'}
                  </label>
                  <select required name="country" value={shippingDetails.country} onChange={handleShippingChange} className="w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-brand-ink focus:border-brand-ink focus:ring-1 focus:ring-brand-ink">
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-gray-200 bg-white p-8"
            >
              <h2 className="mb-8 flex items-center text-2xl tracking-tight text-brand-ink">
                <Lock className="mr-3 h-5 w-5 text-brand-ink" />
                {settings.paymentDetailsText?.[lang] || 'Payment Details'}
              </h2>

              <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-5 text-sm text-brand-muted">
                <p className="font-medium text-brand-ink">
                  Taxes are estimated before redirect and finalized inside Stripe Checkout from the billing and shipping address.
                </p>
                <p>
                  This flow uses Stripe Tax with tax-exclusive pricing and B2C-only logic.
                </p>
                <p>
                  If Adaptive Pricing is enabled in Stripe, local payment currency can still be presented at Stripe Checkout.
                </p>
              </div>
            </motion.div>
          </div>

          <div className="w-full shrink-0 lg:w-[420px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="sticky top-32 rounded-2xl border border-gray-200 bg-white p-8"
            >
              <h3 className="mb-8 text-2xl text-brand-ink">
                {settings.orderSummaryText?.[lang] || 'Order Summary'}
              </h3>

              <div className="mb-8 max-h-60 space-y-4 overflow-y-auto pr-2">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                      {item.imageUrl && item.imageUrl.trim() !== '' ? (
                        <Image src={item.imageUrl} alt={item.title} fill className="object-cover" sizes="64px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">IMG</div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                      <p className="line-clamp-1 text-sm font-medium text-brand-ink">
                        {item.translations?.[lang]?.title || item.title}
                      </p>
                      <p className="mt-1 text-xs text-brand-muted">Qty: {item.quantity}</p>
                      <p className="mt-1 text-sm font-medium text-brand-ink">
                        {formatPrice(
                          item.price * item.quantity,
                          lang,
                          item.prices
                            ? Object.fromEntries(
                                Object.entries(item.prices).map(([key, value]) => [key, value * item.quantity]),
                              )
                            : undefined,
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-8 space-y-4 border-t border-gray-100 pt-6">
                <div className="flex justify-between text-brand-muted">
                  <span>{settings.subtotalText?.[lang] || 'Subtotal'}</span>
                  <span className="font-medium text-brand-ink">{formatPrice(effectiveEstimate.subtotal, lang)}</span>
                </div>
                <div className="flex justify-between text-brand-muted">
                  <span className="flex items-center">
                    {settings.shippingText?.[lang] || 'Shipping'}
                    <span className="ml-2 rounded-2xl bg-blue-50 px-2 py-0.5 text-xs font-medium text-[#00529C]">PostNord</span>
                  </span>
                  <span className="font-medium text-brand-ink">{formatPrice(effectiveEstimate.shipping, lang)}</span>
                </div>
                <div className="flex justify-between text-brand-muted">
                  <span>Estimated tax</span>
                  <span className="font-medium text-brand-ink">
                    {isEstimating ? 'Calculating...' : formatPrice(effectiveEstimate.tax, lang)}
                  </span>
                </div>
                {effectiveEstimate.taxBreakdown.length > 0 && (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-brand-muted">
                    {effectiveEstimate.taxBreakdown.map((entry, index) => (
                      <p key={`${entry.jurisdiction || 'tax'}-${index}`}>
                        {entry.jurisdiction || 'Tax'}{typeof entry.rate === 'number' ? ` (${entry.rate}%)` : ''}: {formatPrice(entry.amount, lang)}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-3 border-t border-gray-100 pt-6">
                <div className="flex items-end justify-between">
                  <span className="text-sm font-bold uppercase tracking-wider text-brand-muted">
                    {settings.totalText?.[lang] || 'Total'}
                  </span>
                  <span className="text-4xl text-brand-ink">
                    {isEstimating ? '...' : formatPrice(effectiveEstimate.total, lang)}
                  </span>
                </div>
              </div>

              <p className="mb-8 text-xs leading-relaxed text-brand-muted">
                The tax-exclusive catalog price is recalculated for the destination country before redirect, so the amount shown here stays aligned with Stripe Checkout.
              </p>

              <button type="submit" disabled={isSubmitting || isEstimating || items.length === 0} className="group flex w-full items-center justify-center rounded-2xl bg-brand-ink px-8 py-4 text-sm font-medium uppercase tracking-wide text-white transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400">
                {isSubmitting ? (
                  <span className="flex items-center">
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {settings.processingText?.[lang] || 'Processing...'}
                  </span>
                ) : (
                  <>
                    Continue to Stripe
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
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
