"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  placeholder?: string;
}

export function SearchBar({ placeholder }: SearchBarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      <button 
        onClick={() => setIsSearchOpen(!isSearchOpen)}
        className="p-2 text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
      >
        <Search className="w-5 h-5" strokeWidth={1.5} />
      </button>
      
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed inset-x-0 top-[72px] mx-auto w-[94vw] sm:absolute sm:inset-auto sm:right-0 sm:mt-4 sm:w-[320px] bg-white rounded-lg z-50 p-4 shadow-xl border border-gray-100"
          >
            <form onSubmit={handleSearch} className="relative">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholder || "Search products..."}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-transparent rounded-lg text-sm focus:bg-white focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/20 outline-none transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
