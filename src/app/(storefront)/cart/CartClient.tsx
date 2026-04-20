"use client";
import React from 'react';
import { BackButton } from '@/components/BackButton';
import { useCartStore } from '@/store/useCartStore';
import type { StorefrontSettings } from '@/store/useSettingsStore';
import { usePathname } from 'next/navigation';
import { Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { formatPrice } from '@/lib/currency';
import Link from 'next/link';
import Image from 'next/image';
import { useStorefrontSettings } from '@/hooks/useStorefrontSettings';
import { getClientLocale } from '@/lib/locale';

interface CartClientProps {
  initialSettings: Partial<StorefrontSettings>;
}

export default function CartClient({ initialSettings }: CartClientProps) {
  const { items, removeItem, updateQuantity, total } = useCartStore();
  const settings = useStorefrontSettings(initialSettings);
  const pathname = usePathname();
  const lang = getClientLocale(pathname);

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-[#fcfcfc]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-32 h-32 bg-gray-50 rounded-2xl flex items-center justify-center mb-8 border border-gray-100"
        >
          <ShoppingCart className="w-12 h-12 text-gray-300" />
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-sans text-brand-ink mb-4 tracking-tight"
        >
          {settings.cartTitle?.[lang] || 'Your cart is empty'}
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-brand-muted mb-12 max-w-md text-base font-normal leading-relaxed"
        >
          {settings.cartEmptyMessage?.[lang] || 'Looks like you haven\'t added anything to your cart yet.'}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <BackButton label={settings.continueShoppingText?.[lang] || 'Continue Shopping'} className="bg-brand-ink text-white px-10 py-4 rounded-2xl font-medium text-sm uppercase tracking-wide hover:bg-gray-800 transition-all inline-flex items-center group" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-[#fcfcfc] min-h-screen pb-24 font-sans">
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-sans text-brand-ink tracking-tight mb-4"
        >
          {settings.cartTitle?.[lang] || 'Shopping Cart'}.
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 96 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="h-1 bg-brand-ink mb-6"
        ></motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          <div className="flex-1">
            <div className="space-y-8">
              {items.map((item, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={item.id} 
                  className="flex gap-6 sm:gap-8 py-4 sm:py-6 border-b border-gray-200/60 last:border-0"
                >
                  <div className="w-24 h-32 sm:w-32 sm:h-40 rounded-2xl bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100 relative">
                    {item.imageUrl && item.imageUrl.trim() !== "" ? (
                      <Image 
                        src={item.imageUrl} 
                        alt={item.title} 
                        fill
                        className="object-cover" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-brand-muted uppercase tracking-widest">Nordic</div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-sans text-brand-ink mb-1.5">{item.translations?.[lang]?.title || item.title}</h3>
                        <p className="text-sm text-brand-muted font-medium">{formatPrice(item.price || 0, lang, item.prices)}</p>
                      </div>
                      <button onClick={() => removeItem(item.id!)} className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-brand-muted hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 gap-4">
                      <div className="flex items-center border border-gray-200 rounded-2xl overflow-hidden bg-white w-fit">
                        <button onClick={() => updateQuantity(item.id!, Math.max(1, item.quantity - 1))} className="px-4 py-2 text-brand-ink hover:bg-gray-50 transition-colors text-lg font-medium">-</button>
                        <span className="px-4 py-2 text-sm font-bold border-x border-gray-200 w-12 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id!, item.quantity + 1)} className="px-4 py-2 text-brand-ink hover:bg-gray-50 transition-colors text-lg font-medium">+</button>
                      </div>
                      <p className="text-xl font-sans font-medium text-brand-ink">{formatPrice((item.price || 0) * item.quantity, lang, item.prices ? Object.fromEntries(Object.entries(item.prices).map(([k, v]) => [k, v * item.quantity])) : undefined)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-[400px] shrink-0">
            <div className="py-8 border-b border-gray-200/60 last:border-0 sticky top-32">
              <h3 className="text-2xl font-sans text-brand-ink mb-8">{settings.orderSummaryText?.[lang] || 'Order Summary'}</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-brand-muted">
                  <span>{settings.subtotalText?.[lang] || 'Subtotal'}</span>
                  <span className="font-medium text-brand-ink">{formatPrice(total(lang), lang)}</span>
                </div>
                <div className="flex justify-between text-brand-muted">
                  <span>{settings.shippingText?.[lang] || 'Shipping'}</span>
                  <span className="text-sm">{settings.calculatedAtCheckoutText?.[lang] || 'Calculated at checkout'}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-brand-muted uppercase tracking-wider font-bold">{settings.totalText?.[lang] || 'Total'}</span>
                  <span className="text-4xl font-sans text-brand-ink">{formatPrice(total(lang), lang)}</span>
                </div>
              </div>

              <Link href="/payment" className="w-full bg-brand-ink text-white px-8 py-4 rounded-2xl font-medium text-sm uppercase tracking-wide hover:bg-gray-800 transition-all flex items-center justify-center group">
                {settings.proceedToPaymentText?.[lang] || 'Proceed to Checkout'}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <div className="mt-6 text-center">
                <Link href="/products" className="text-sm text-brand-muted hover:text-brand-ink transition-colors underline underline-offset-4">
                  {settings.continueShoppingText?.[lang] || 'Continue Shopping'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
