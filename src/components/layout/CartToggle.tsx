"use client";

import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { CartBadge } from './CartBadge';

export function CartToggle() {
  const { setCartOpen } = useUIStore();
  
  return (
    <button
      onClick={() => setCartOpen(true)}
      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors rounded-lg group"
      aria-label="View Shopping Cart"
    >
      <div className="relative">
        <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
        <CartBadge />
      </div>
    </button>
  );
}
