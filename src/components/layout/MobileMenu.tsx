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
import { Category } from '@/types';
import { localizeHref } from '@/lib/i18n-routing';

interface MobileMenuProps {
  user: SupabaseUser | null;
  isAdmin: boolean;
  settings: StorefrontSettings;
  lang: string;
  categories: Category[];
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

export function MobileMenu({ user, isAdmin, settings, lang, categories, availableLanguages, labels }: MobileMenuProps) {
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
                <span className="!text-[12px] !font-bold !uppercase !tracking-widest text-brand-ink">{labels.menu}</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-brand-ink transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
                <nav className="flex flex-col space-y-6">
                  {/* Collections */}
                  <Link
                    href={localizeHref(lang, `/products`)}
                    onClick={() => setMobileMenuOpen(false)}
                    className="group flex items-center justify-between"
                  >
                    <span className="!text-[12px] !font-bold !uppercase !tracking-widest text-brand-ink group-hover:text-brand-ink transition-all duration-300">
                      {settings?.searchProductsResultsText?.[lang] || 'All Products'}
                    </span>
                    <ChevronRight className="w-5 h-5 text-brand-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>

                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/${lang}/products?category=${encodeURIComponent(cat.slug)}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="group flex items-center justify-between"
                    >
                      <span className="!text-[12px] !font-bold !uppercase !tracking-widest text-brand-ink group-hover:text-brand-ink transition-all duration-300">
                        {cat.translations?.[lang]?.name || cat.name}
                      </span>
                      <ChevronRight className="w-5 h-5 text-brand-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                  
                  {categories.length > 0 && (
                    <div className="w-8 h-px bg-gray-200 my-2" />
                  )}

                  {/* Pages */}
                  {(settings.navbarLinks || [])
                    .filter((link: MenuLink) => link.href !== '/products' && link.href !== '/products/')
                    .map((link: MenuLink, index: number) => (
                    <Link
                      key={index}
                      href={localizeHref(lang, link.href)}
                      onClick={() => setMobileMenuOpen(false)}
                      className="group flex items-center justify-between"
                    >
                      <span className="!text-[12px] !font-bold !uppercase !tracking-widest text-brand-ink group-hover:text-brand-ink transition-all duration-300">
                        {link.label[lang] || link.label['en']}
                      </span>
                      <ChevronRight className="w-5 h-5 text-brand-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Fixed Bottom Section */}
              <div className="px-6 py-4 border-t border-gray-100 bg-white shrink-0 mt-auto">
                <div className="flex items-center justify-between">
                  {/* Compact Language Selector (Mobile Drawer) */}
                  <LanguageSwitcher availableLanguages={availableLanguages} variant="drawer" direction="up" align="left" />

                  {/* Compact User Actions */}
                  <div className="flex items-center gap-1">
                    {user ? (
                      <>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="p-2.5 text-slate-500 hover:text-brand-ink transition-colors rounded-full hover:bg-slate-50"
                            aria-label={labels.adminDashboard}
                          >
                            <Settings className="w-5 h-5" strokeWidth={1.5} />
                          </Link>
                        )}
                        <Link
                          href={localizeHref(lang, '/profile')}
                          onClick={() => setMobileMenuOpen(false)}
                          className="p-2.5 text-slate-500 hover:text-brand-ink transition-colors rounded-full hover:bg-slate-50"
                          aria-label={labels.account}
                        >
                          <User className="w-5 h-5" strokeWidth={1.5} />
                        </Link>
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={handleLogout}
                          className="p-2.5 text-red-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                          aria-label={labels.logout}
                        >
                          <LogOut className="w-5 h-5" strokeWidth={1.5} />
                        </button>
                      </>
                    ) : (
                      <Link
                        href={localizeHref(lang, '/auth')}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 p-2.5 text-brand-ink hover:text-brand-muted transition-colors rounded-full hover:bg-slate-50"
                      >
                        <User className="w-5 h-5" strokeWidth={1.5} />
                        <span className="text-[11px] font-bold uppercase tracking-widest">{labels.login}</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </>
  );
}
