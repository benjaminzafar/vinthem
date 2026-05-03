"use client";

import React from 'react';
import { useUIStore } from '@/store/useUIStore';
import { CartBadge } from './CartBadge';
const ShoppingBagIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

export function CartToggle() {
  const { setCartOpen } = useUIStore();
  
  return (
    <button
      onClick={() => setCartOpen(true)}
      className="px-2 py-2 text-slate-600 hover:text-brand-ink transition-colors group"
      aria-label="View Shopping Cart"
    >
      <div className="relative">
        <ShoppingBagIcon className="w-5 h-5" />
        <CartBadge />
      </div>
    </button>
  );
}
