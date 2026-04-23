"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UserAvatar } from '../ui/UserAvatar';
import { getClientLocale } from '@/lib/locale';

import { User as UserType } from '@/types';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AccountDropdownProps {
  user: SupabaseUser;
  isAdmin: boolean;
  labels: {
    profile: string;
    adminPanel: string;
    logout: string;
    loggedOutSuccess: string;
  };
}

export function AccountDropdown({ user, isAdmin, labels }: AccountDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const navigate = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await supabase.auth.signOut();
    toast.success(labels.loggedOutSuccess);
    window.location.href = `/${getClientLocale(window.location.pathname)}`;
  };

  return (
    <div className="relative h-full flex items-center" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center p-1 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
        aria-label="Toggle user menu"
      >
        <UserAvatar 
          name={user.user_metadata?.full_name || user.email}
          imageUrl={user.user_metadata?.avatar_url || user.user_metadata?.picture}
          size={28}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 0 }}
            className="absolute right-0 top-[calc(100%+1px)] mt-0 w-60 bg-white shadow-2xl shadow-slate-900/10 rounded border border-slate-100 z-[100] py-2 overflow-hidden"
          >
            <div className="px-6 py-3 border-b border-gray-50 mb-2">
              <p className="text-sm font-medium text-brand-ink truncate">{user.user_metadata?.full_name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
            </div>
            
            <Link 
              href="/profile" 
              onClick={() => setIsOpen(false)}
              className="flex items-center px-6 py-2.5 text-sm text-gray-600 hover:text-brand-ink hover:bg-gray-50 transition-colors"
            >
              <User className="w-4 h-4 mr-3" />
              {labels.profile}
            </Link>
            
            {isAdmin && (
              <Link 
                href="/admin" 
                onClick={() => setIsOpen(false)}
                className="flex items-center px-6 py-2.5 text-sm text-gray-600 hover:text-brand-ink hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4 mr-3" />
                {labels.adminPanel}
              </Link>
            )}
            
            <div className="mt-2 pt-2 border-t border-gray-50">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center px-6 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" />
                {labels.logout}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
