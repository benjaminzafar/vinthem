"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Menu, X, ChevronRight, User, Settings, LogOut, Languages } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { StorefrontSettings, MenuLink } from '@/store/useSettingsStore';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Portal } from './Portal';
import { UserAvatar } from '../ui/UserAvatar';

interface MobileMenuProps {
  user: SupabaseUser | null;
  isAdmin: boolean;
  settings: StorefrontSettings;
  lang: string;
  availableLanguages: string[];
  labels: {
    menu: string;
    language: string;
    account: string;
    adminDashboard: string;
    logout: string;
    login: string;
  };
}

export function MobileMenu({ user, isAdmin, settings, lang, availableLanguages, labels }: MobileMenuProps) {
  const { isMobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const navigate = useRouter();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop && isMobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen, setMobileMenuOpen]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen, setMobileMenuOpen]);

  const handleLogout = async (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // 1. Clear server cookies
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // 2. Client-side cleanup
      await supabase.auth.signOut();
      
      // 3. Absolute hard refresh
      window.location.href = `/${lang}`;
    } catch (error) {
      window.location.href = `/${lang}`;
    }
  };

  if (isDesktop) return null;

  return (
    <>
      <button
        className="lg:hidden p-2 text-slate-600 hover:text-brand-ink transition-colors"
        onClick={() => {
          setMobileMenuOpen(!isMobileMenuOpen);
        }}
        aria-label="Open mobile menu"
      >
        <Menu className="w-6 h-6" strokeWidth={1.5} />
      </button>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <Portal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />
            <motion.div
              ref={menuRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 right-0 h-[100dvh] w-full sm:w-[85vw] sm:max-w-sm bg-white border-l border-gray-100 z-[201] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
                <span className="text-[12px] font-bold uppercase tracking-widest text-brand-ink">{labels.menu}</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-gray-400 hover:text-brand-ink transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
                <nav className="flex flex-col space-y-6 mb-12">
                  {(settings.navbarLinks || []).map((link: MenuLink, index: number) => (
                    <Link
                      key={index}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="group flex items-center justify-between"
                    >
                      <span className="text-[12px] font-bold uppercase tracking-widest text-brand-ink group-hover:text-brand-ink transition-all duration-300">
                        {link.label[lang] || link.label['en']}
                      </span>
                      <ChevronRight className="w-5 h-5 text-brand-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </nav>

                <div className="pt-8 border-t border-gray-100 space-y-8">
                  <div className="space-y-4">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-brand-muted">{labels.language}</span>
                    <LanguageSwitcher availableLanguages={availableLanguages} variant="boxes" />
                  </div>

                  {user ? (
                    <div className="space-y-4">
                      <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-brand-muted">{labels.account}</span>
                      <div className="flex items-center justify-between bg-gray-50 p-4 rounded">
                        <div className="flex items-center space-x-3">
                          <UserAvatar 
                            name={user.user_metadata?.full_name || user.email}
                            imageUrl={user.user_metadata?.avatar_url || user.user_metadata?.picture}
                            size={40}
                          />
                          <div>
                            <p className="text-sm font-medium text-brand-ink">{user.user_metadata?.full_name || 'Account'}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[120px]">{user.email}</p>
                          </div>
                        </div>
                        <Link
                          href="/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="p-2 bg-white rounded border border-gray-100 text-brand-ink hover:bg-gray-100 transition-colors"
                        >
                          <User className="w-4 h-4" />
                        </Link>
                      </div>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-50 text-indigo-700 rounded font-medium hover:bg-indigo-100 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span>{labels.adminDashboard}</span>
                        </Link>
                      )}
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={handleLogout}
                        className="w-full h-12 flex items-center justify-center space-x-2 text-red-600 bg-red-50 rounded font-bold hover:bg-red-100 transition-colors cursor-pointer relative z-[220]"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>{labels.logout}</span>
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/auth"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full h-11 flex items-center justify-center text-[15px] font-semibold text-white bg-brand-ink rounded hover:bg-gray-800 transition-all active:scale-95 text-center"
                    >
                      {labels.login}
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </>
  );
}
