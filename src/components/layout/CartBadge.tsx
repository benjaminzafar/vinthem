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
          transition={{ type: 'spring', stiffness: 500, damping: 10 }}
          className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center transform translate-x-1 -translate-y-1"
        >
          {items.length}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
