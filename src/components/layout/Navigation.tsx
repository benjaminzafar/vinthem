"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingBag, User, LogOut, Settings, Globe, Menu, X, ChevronRight, ChevronDown, Search, Filter, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import i18nInstance from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';

export default function Navigation() {
  const supabase = createClient();
  const { user, isAdmin, setUser, setIsAdmin } = useAuthStore();
  const { items } = useCartStore();
  const { settings } = useSettingsStore();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const navigate = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the menus to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    if (isMobileMenuOpen || isLanguageDropdownOpen || isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen, isLanguageDropdownOpen, isSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  // Handle user logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    navigate.push('/');
    toast.success(settings.loggedOutSuccessText?.[lang]);
  };

  // Change application language
  const changeLanguage = (lng: string) => {
    i18nInstance.changeLanguage(lng);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center relative">
            {/* Brand Logo */}
          <div className="flex-1 flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              {settings.logoImage && settings.logoImage.trim() !== "" ? (
                <div className="relative h-8 w-32">
                  <Image 
                    src={settings.logoImage} 
                    alt={settings.storeName?.[lang] || 'Mavren'} 
                    fill
                    className="object-contain transition-transform group-hover:scale-105" 
                    sizes="(max-width: 768px) 100px, 128px"
                  />
                </div>
              ) : (
                <span className="text-xl font-normal text-gray-900">
                  {settings.storeName?.[lang]}
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {(settings.navbarLinks || []).map((link, index) => (
              <Link 
                key={index} 
                href={link.href} 
                className="text-sm font-medium text-gray-500 hover:text-brand-ink transition-colors"
              >
                {link.label[lang]}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="flex-1 flex items-center justify-end space-x-4">
            {/* Search Toggle */}
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
                        placeholder={settings.searchPlaceholder?.[lang]}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-transparent rounded-lg text-sm focus:bg-white focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/20 outline-none transition-all"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden md:flex items-center">
              <div className="relative" ref={languageRef}>
              <button 
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="flex items-center space-x-1 p-2 text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg transition-colors text-xs font-medium uppercase"
              >
                <span>{i18n.language}</span>
                <ChevronDown className="w-3 h-3" strokeWidth={1.5} />
              </button>

              <AnimatePresence>
                {isLanguageDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-4 w-32 bg-white rounded-lg border border-gray-100 z-50 py-2 shadow-xl"
                  >
                    {(settings.languages?.length ? settings.languages : ['en', 'sv', 'fi', 'da']).map((lng) => (
                      <button
                        key={lng}
                        onClick={() => {
                          changeLanguage(lng);
                          setIsLanguageDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-5 py-2 text-sm transition-colors ${i18n.language === lng ? 'text-brand-ink font-medium bg-gray-50' : 'text-gray-500 hover:text-brand-ink hover:bg-gray-50'}`}
                      >
                        {lng.toUpperCase()}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
                </div>
              </div>

            <Link href="/cart" className="relative p-2 text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg transition-colors">
              <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
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
            </Link>

            <div className="hidden md:flex items-center">
              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                    className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 relative">
                      <Image 
                        src={(user.user_metadata?.avatar_url || user.user_metadata?.picture) ? (user.user_metadata?.avatar_url || user.user_metadata?.picture) : `https://ui-avatars.com/api/?name=${user.user_metadata?.full_name || 'U'}&background=random`} 
                        alt="Profile" 
                        fill
                        className="object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isAccountDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-4 w-60 bg-white rounded-lg border border-gray-100 z-50 py-2 shadow-xl"
                      >
                        <div className="px-6 py-3 border-b border-gray-50 mb-2">
                          <p className="text-sm font-medium text-brand-ink truncate">{user.user_metadata?.full_name || 'User'}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                        </div>
                        
                        <Link href="/profile" className="flex items-center px-6 py-2.5 text-sm text-gray-600 hover:text-brand-ink hover:bg-gray-50 transition-colors">
                          <User className="w-4 h-4 mr-3" />
                          {settings.myProfileText?.[lang]}
                        </Link>
                        
                        {isAdmin && (
                          <Link href="/admin" className="flex items-center px-6 py-2.5 text-sm text-gray-600 hover:text-brand-ink hover:bg-gray-50 transition-colors">
                            <Settings className="w-4 h-4 mr-3" />
                            {settings.adminPanelText?.[lang]}
                          </Link>
                        )}
                        
                        <div className="mt-2 pt-2 border-t border-gray-50">
                          <button 
                            onClick={handleLogout}
                            className="w-full flex items-center px-6 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4 mr-3" />
                            {settings.logoutText?.[lang]}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link 
                  href="/auth"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-brand-ink rounded-none hover:bg-gray-800 transition-colors"
                >
                  {settings.loginText?.[lang]}
                </Link>
              )}
            </div>
            
            <button 
              className="lg:hidden p-2 text-gray-600 hover:text-black hover:bg-gray-50 rounded-none transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-6 h-6" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </nav>
      
    {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.div
              ref={menuRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-[100dvh] w-[85vw] max-w-sm bg-white border-l border-gray-100 z-[101] flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
                <span className="text-xl font-sans font-medium tracking-tight">{settings.menuText?.[lang]}</span>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-gray-400 hover:text-brand-ink hover:bg-gray-50 rounded-none transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-8">
                {/* Navigation Links */}
                <nav className="flex flex-col space-y-6 mb-12">
                  {(settings.navbarLinks || []).map((link, index) => (
                    <Link 
                      key={index}
                      href={link.href} 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className="group flex items-center justify-between"
                    >
                      <span className="text-2xl font-sans font-normal tracking-tight text-brand-ink group-hover:text-brand-ink transition-all duration-300">
                        {link.label[lang]}
                      </span>
                      <ChevronRight className="w-5 h-5 text-brand-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </nav>

                {/* Compact Account Section */}
                <div className="pt-8 border-t border-gray-100 space-y-8">
                  <div className="space-y-4">
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{settings.languageLabel?.[lang]}</span>
                    <div className="flex flex-wrap gap-2">
                      {(settings.languages?.length ? settings.languages : ['en', 'sv', 'fi', 'da']).map((lng) => (
                        <button
                          key={lng}
                          onClick={() => {
                            changeLanguage(lng);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`px-4 py-2 text-xs font-medium uppercase tracking-wide rounded-none transition-colors ${i18n.language === lng ? 'bg-brand-ink text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                        >
                          {lng}
                        </button>
                      ))}
                    </div>
                  </div>

                  {user ? (
                    <div className="space-y-4">
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{settings.accountLabel?.[lang]}</span>
                      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-none">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-none relative overflow-hidden border border-gray-200">
                            <Image 
                              src={(user.user_metadata?.avatar_url || user.user_metadata?.picture) ? (user.user_metadata?.avatar_url || user.user_metadata?.picture) : `https://ui-avatars.com/api/?name=${user.user_metadata?.full_name || 'U'}&background=random`} 
                              alt="Profile" 
                              fill
                              className="object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-brand-ink">{user.user_metadata?.full_name || 'Account'}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[120px]">{user.email}</p>
                          </div>
                        </div>
                        <Link 
                          href="/profile" 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="p-2 bg-white rounded-none border border-gray-100 text-brand-ink hover:bg-gray-100 transition-colors"
                        >
                          <User className="w-4 h-4" />
                        </Link>
                      </div>
                      {isAdmin && (
                        <Link 
                          href="/admin" 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-50 text-indigo-700 rounded-none font-medium hover:bg-indigo-100 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span>{settings.adminDashboardText?.[lang]}</span>
                        </Link>
                      )}
                      <button 
                        onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                        className="w-full flex items-center justify-center space-x-2 py-3 text-red-600 bg-red-50 rounded-none font-medium hover:bg-red-100 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{settings.logoutText?.[lang]}</span>
                      </button>
                    </div>
                  ) : (
                    <Link 
                      href="/auth"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-4 text-sm font-medium text-white bg-brand-ink rounded-none hover:bg-gray-800 transition-all active:scale-95 text-center block"
                    >
                      {settings.loginText?.[lang]}
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
