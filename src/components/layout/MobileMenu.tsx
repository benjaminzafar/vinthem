"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronRight, User, Settings, LogOut, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Portal } from './Portal';

interface MobileMenuProps {
  user: any;
  isAdmin: boolean;
  settings: any;
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
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const navigate = useRouter();

  useEffect(() => {
    if (isOpen) {
      // Lock scroll without snapping to top
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      // touch-action: none prevents some mobile browsers from scrolling via drag
      document.body.style.touchAction = 'none';
      document.documentElement.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.touchAction = '';
      document.documentElement.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.touchAction = '';
      document.documentElement.style.touchAction = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate.refresh();
    setIsOpen(false);
  };

  return (
    <>
      <button 
        className="lg:hidden p-2 text-slate-600 hover:text-black hover:bg-gray-50 rounded-none transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open mobile menu"
      >
        <Menu className="w-6 h-6" strokeWidth={1.5} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <Portal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />
            <motion.div
              ref={menuRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-[100dvh] w-full sm:w-[85vw] sm:max-w-sm bg-white border-l border-gray-100 z-[201] flex flex-col"
            >
              <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
                <span className="text-xl font-sans font-medium tracking-tight">{labels.menu}</span>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 -mr-2 text-gray-400 hover:text-brand-ink hover:bg-gray-50 rounded-none transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
                <nav className="flex flex-col space-y-6 mb-12">
                  {(settings.navbarLinks || []).map((link: any, index: number) => (
                    <Link 
                      key={index}
                      href={link.href} 
                      onClick={() => setIsOpen(false)} 
                      className="group flex items-center justify-between"
                    >
                      <span className="text-2xl font-sans font-normal tracking-tight text-brand-ink group-hover:text-brand-ink transition-all duration-300">
                        {link.label[lang] || link.label['en']}
                      </span>
                      <ChevronRight className="w-5 h-5 text-brand-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </nav>

                <div className="pt-8 border-t border-gray-100 space-y-8">
                  <div className="space-y-4">
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{labels.language}</span>
                    <LanguageSwitcher availableLanguages={availableLanguages} variant="boxes" />
                  </div>

                  {user ? (
                    <div className="space-y-4">
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{labels.account}</span>
                      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-none">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-none relative overflow-hidden border border-gray-200">
                            <Image 
                              src={(user.user_metadata?.avatar_url || user.user_metadata?.picture) ? (user.user_metadata?.avatar_url || user.user_metadata?.picture) : `https://ui-avatars.com/api/?name=${user.user_metadata?.full_name || 'U'}&background=random`} 
                              alt="Profile" 
                              fill
                              className="object-cover" 
                              referrerPolicy="no-referrer"
                              sizes="40px"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-brand-ink">{user.user_metadata?.full_name || 'Account'}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[120px]">{user.email}</p>
                          </div>
                        </div>
                        <Link 
                          href="/profile" 
                          onClick={() => setIsOpen(false)}
                          className="p-2 bg-white rounded-none border border-gray-100 text-brand-ink hover:bg-gray-100 transition-colors"
                        >
                          <User className="w-4 h-4" />
                        </Link>
                      </div>
                      {isAdmin && (
                        <Link 
                          href="/admin" 
                          onClick={() => setIsOpen(false)}
                          className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-50 text-indigo-700 rounded-none font-medium hover:bg-indigo-100 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span>{labels.adminDashboard}</span>
                        </Link>
                      )}
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 py-3 text-red-600 bg-red-50 rounded-none font-medium hover:bg-red-100 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{labels.logout}</span>
                      </button>
                    </div>
                  ) : (
                    <Link 
                      href="/auth"
                      onClick={() => setIsOpen(false)}
                      className="w-full py-4 text-sm font-medium text-white bg-brand-ink rounded-none hover:bg-gray-800 transition-all active:scale-95 text-center block"
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
