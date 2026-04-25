"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useUIStore } from '@/store/useUIStore';
import { type StorefrontSettings } from '@/store/useSettingsStore';
import { formatPrice } from '@/lib/currency';
import { getClientLocale } from '@/lib/locale';
import { localizeHref } from '@/lib/i18n-routing';
import { useStorefrontSettings } from '@/hooks/useStorefrontSettings';
import { Portal } from './Portal';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type CartDrawerProps = {
  initialSettings?: Partial<StorefrontSettings>;
};

export function CartDrawer({ initialSettings }: CartDrawerProps) {
  const { isCartOpen, setCartOpen } = useUIStore();
  const { items, removeItem, updateQuantity, total } = useCartStore();
  const settings = useStorefrontSettings(initialSettings);
  const pathname = usePathname();
  const lang = getClientLocale(pathname);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isCartOpen]);

  const handleClose = () => setCartOpen(false);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <Portal>
          <div className="fixed inset-0 z-[600] flex justify-end overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white border-l border-slate-100 flex flex-col shadow-2xl h-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 h-16 border-b border-slate-100 shrink-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-slate-900" strokeWidth={1.5} />
                  <h2 className="text-[12px] font-bold uppercase tracking-widest text-brand-ink">
                    {settings?.cartTitle?.[lang] || 'Shopping Bag'}
                  </h2>
                  <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded">
                    {items.length}
                  </span>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 -mr-2 text-slate-400 hover:text-slate-900 transition-colors"
                  aria-label="Close cart"
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar bg-white">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20 px-4">
                    <div className="w-16 h-16 bg-slate-50 rounded flex items-center justify-center mb-6">
                      <ShoppingCart className="w-6 h-6 text-slate-300" strokeWidth={1.5} />
                    </div>
                    <p className="text-slate-900 text-sm font-medium mb-2">
                       {settings?.cartTitle?.[lang] || 'Your cart is empty'}
                    </p>
                    <p className="text-slate-400 text-xs leading-relaxed max-w-[240px] mb-8">
                       {settings?.cartEmptyMessage?.[lang] || 'Looks like you haven\'t added anything yet.'}
                    </p>
                    <button
                      onClick={handleClose}
                      className="text-[14px] font-semibold text-brand-ink border-b border-brand-ink pb-0.5 hover:opacity-70 transition-opacity"
                    >
                      {settings?.continueShoppingText?.[lang] || 'Go back to shopping'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8 pb-10">
                    {items.map((item, index) => (
                      <motion.div
                        key={`${item.id}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex gap-5 group"
                      >
                        {/* Image */}
                        <div className="relative w-24 aspect-[4/5] bg-slate-50 border border-slate-100 rounded overflow-hidden shrink-0">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="100px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                              Vinthem
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 flex flex-col justify-between py-0.5">
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="text-[12px] font-bold uppercase tracking-widest text-brand-ink leading-snug line-clamp-2">
                                {item.translations?.[lang]?.title || item.title}
                              </h3>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="p-1 text-slate-300 hover:text-rose-500 transition-colors shrink-0"
                                aria-label="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                              </button>
                            </div>
                            <p className="text-[14px] font-medium text-brand-muted">
                                {formatPrice(item.price || 0, lang, item.prices)}
                            </p>
                          </div>

                          {/* Control */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center border border-slate-200 rounded bg-slate-50/50 backdrop-blur-sm">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" strokeWidth={1.5} />
                              </button>
                              <span className="w-8 text-center text-xs font-bold text-slate-900 tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" strokeWidth={1.5} />
                              </button>
                            </div>
                            <p className="text-[14px] font-semibold text-brand-ink tracking-tight">
                              {formatPrice((item.price || 0) * item.quantity, lang)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0 space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="text-[12px] font-semibold text-brand-muted">
                        {settings?.subtotalText?.[lang] || 'Subtotal'}
                      </span>
                      <span className="text-sm font-medium text-slate-900">
                        {formatPrice(total(), lang)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {settings?.shippingText?.[lang] || 'Shipping'}
                      </span>
                      <span className="text-[11px] font-medium">
                         {settings?.calculatedAtCheckoutText?.[lang] || 'Calculated at checkout'}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-slate-200 mt-3 flex justify-between items-end">
                      <span className="text-[12px] font-semibold text-brand-ink">
                        {settings?.totalText?.[lang] || 'Total'}
                      </span>
                      <span className="text-2xl font-bold tracking-tighter text-brand-ink">
                        {formatPrice(total(), lang)}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={localizeHref(lang, '/payment')}
                    onClick={handleClose}
                    className="flex h-11 w-full items-center justify-center bg-zinc-900 text-[12px] font-bold uppercase tracking-wider text-white transition-all hover:bg-black rounded shadow-none active:scale-[0.98] group"
                  >
                    {settings?.proceedToPaymentText?.[lang] || 'Review Bag'}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
                  </Link>
                  
                  <div className="flex items-center justify-center gap-2.5 text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span className="text-[10px] font-medium tracking-wide uppercase">Secure encrypted checkout</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </Portal>
      )}
    </AnimatePresence>
  );
}
