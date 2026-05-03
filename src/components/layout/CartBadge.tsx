"use client";

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCartStore } from '@/store/useCartStore';

export function CartBadge() {
  const { items } = useCartStore();
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  
  return (
    <AnimatePresence mode="wait">
      {items.length > 0 && (
        <motion.span
          key={items.length}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          className="absolute -top-1.5 -right-1.5 bg-black text-white text-[9px] font-bold h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full flex items-center justify-center border-2 border-white shadow-none ring-1 ring-black/5"
        >
          {items.length}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
