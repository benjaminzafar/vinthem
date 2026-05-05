"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
// Removed broken lucide imports
import { useUIStore } from '@/store/useUIStore';
import { StorefrontSettings, MenuLink } from '@/store/useSettingsStore';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Portal } from './Portal';
import { Category } from '@/types';
import { localizeHref } from '@/lib/i18n-routing';
import { performClientLogout } from '@/lib/client-auth';
import { isValidUrl } from '@/lib/utils';
import { toMediaPublicUrl } from '@/lib/media';
import { getOptimizedImageUrl } from '@/utils/image-utils';
import { ShoppingBag, Plus, LayoutDashboard, LogOut, Settings, User } from 'lucide-react';

const MenuIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const UserIcon = ({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SettingsIcon = ({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const LogOutIcon = ({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

interface MobileMenuProps {
  user: SupabaseUser | null;
  isAdmin: boolean;
  navbarLinks: MenuLink[];
  lang: string;
  categories: Category[];
  availableLanguages: string[];
  settings: any;
  labels: {
    menu: string;
    language: string;
    account: string;
    adminDashboard: string;
    logout: string;
    login: string;
    allProducts: string;
  };
}

type CategoryTrailItem = {
  id: string | null;
  label: string;
};

const createRootCategoryTrail = (label: string): CategoryTrailItem[] => [
  { id: null, label },
];

export function MobileMenu({ user, isAdmin, navbarLinks, lang, categories, availableLanguages, settings, labels }: MobileMenuProps) {
  const { isMobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  
  const localLabels = {
    allProducts: settings.searchProductsResultsText?.[lang] || 'All Products',
    categories: settings.categoriesLabel?.[lang] || 'Categories',
    login: settings.loginText?.[lang] || 'Login',
    account: settings.accountLabel?.[lang] || 'Account',
    adminDashboard: settings.adminDashboardText?.[lang] || 'Admin Dashboard',
    logout: settings.logoutText?.[lang] || 'Log Out',
    language: settings.languageLabel?.[lang] || 'Language'
  };

  const [isDesktop, setIsDesktop] = useState(false);
  const [categoryTrail, setCategoryTrail] = useState<CategoryTrailItem[]>(createRootCategoryTrail(localLabels.allProducts));
  const [categoryDirection, setCategoryDirection] = useState(1);

  const getCategoryLabel = (category: Category) => category.translations?.[lang]?.name || category.name;

  const categoryChildrenMap = new Map<string | null, Category[]>();

  for (const category of categories) {
    const parentId = category.parentId || null;
    const existing = categoryChildrenMap.get(parentId) || [];
    existing.push(category);
    categoryChildrenMap.set(parentId, existing);
  }

  for (const entry of categoryChildrenMap.values()) {
    entry.sort((left, right) => getCategoryLabel(left).localeCompare(getCategoryLabel(right), lang));
  }

  const currentParentId = categoryTrail[categoryTrail.length - 1]?.id ?? null;
  const currentCategories = categoryChildrenMap.get(currentParentId) || [];

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

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      await performClientLogout({
        supabase,
        redirectTo: localizeHref(lang, '/'),
      });
    } catch (error) {
      window.location.assign(localizeHref(lang, '/'));
    }
  };

  const openCategoryLevel = (category: Category) => {
    setCategoryDirection(1);
    setCategoryTrail((previous) => [
      ...previous,
      {
        id: category.id || null,
        label: getCategoryLabel(category),
      },
    ]);
  };

  const goBackCategoryLevel = () => {
    setCategoryDirection(-1);
    setCategoryTrail((previous) => (
      previous.length > 1 ? previous.slice(0, previous.length - 1) : previous
    ));
  };

  if (isDesktop) return null;

  return (
    <>
      <button
        className="lg:hidden p-2 text-slate-600 hover:text-brand-ink transition-colors"
        onClick={() => {
          if (!isMobileMenuOpen) {
            setCategoryDirection(1);
            setCategoryTrail(createRootCategoryTrail(labels.allProducts));
          }
          setMobileMenuOpen(!isMobileMenuOpen);
        }}
        aria-label="Open mobile menu"
      >
        <MenuIcon className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <Portal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-[200]"
            />
            <motion.div
              ref={menuRef}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 left-0 h-[100dvh] w-full sm:w-[85vw] sm:max-w-sm bg-white border-r border-gray-100 z-[201] flex flex-col shadow-none will-change-transform overflow-hidden"
            >
              <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                  <LanguageSwitcher availableLanguages={availableLanguages} variant="drawer" align="left" />
                  
                  {user ? (
                    <div className="flex items-center">
                       <Link
                        href={localizeHref(lang, '/profile')}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 bg-slate-50/80 hover:bg-slate-100 text-brand-ink transition-all text-[11px] font-bold uppercase tracking-widest border border-slate-200/50 rounded-full"
                      >
                        <UserIcon className="w-3.5 h-3.5" strokeWidth={2} />
                        <span>{localLabels.account}</span>
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="ml-2 p-2 text-slate-400 hover:text-brand-ink transition-colors"
                        >
                          <SettingsIcon className="w-4 h-4" strokeWidth={2} />
                        </Link>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={localizeHref(lang, '/auth')}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 bg-slate-50/80 hover:bg-slate-100 text-brand-ink transition-all text-[11px] font-bold uppercase tracking-widest border border-slate-200/50 rounded-full"
                    >
                      <UserIcon className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>{localLabels.login}</span>
                    </Link>
                  )}
                </div>
                
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-gray-400 hover:text-brand-ink transition-colors"
                  aria-label="Close menu"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
                <nav className="flex flex-col space-y-8">
                  {/* Collections */}
                  {categoryTrail.length === 1 && (
                    <Link
                      href={localizeHref(lang, `/products`)}
                      onClick={() => setMobileMenuOpen(false)}
                      className="group flex items-center justify-between py-3"
                    >
                      <span className="!text-[18px] !font-bold !uppercase !tracking-widest text-brand-ink group-hover:text-brand-ink transition-all duration-300">
                        {localLabels.allProducts}
                      </span>
                      <ChevronRightIcon className="w-5 h-5 text-slate-400 transition-colors group-hover:text-slate-700" />
                    </Link>
                  )}

                  <div className="overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={currentParentId || 'root'}
                        initial={{ x: categoryDirection > 0 ? 40 : -40, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: categoryDirection > 0 ? -40 : 40, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="space-y-2"
                      >
                        {categoryTrail.length > 1 ? (
                          <div className="space-y-4">
                            <button
                              type="button"
                              onClick={goBackCategoryLevel}
                              className="flex w-full items-center gap-2 pb-2 text-left text-[14px] font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-900"
                            >
                              <ChevronLeftIcon className="h-5 w-5" />
                              {categoryTrail[categoryTrail.length - 2]?.label || labels.allProducts}
                            </button>
                            
                            <div className="flex flex-col space-y-1">
                              {currentCategories.map((category) => {
                                const childCategories = categoryChildrenMap.get(category.id || null) || [];
                                const hasChildren = childCategories.length > 0;
                                const categoryHref = `/${lang}/products?category=${encodeURIComponent(category.slug)}`;

                                return (
                                  <div key={category.id} className="group flex items-center justify-between border-b border-slate-50 last:border-0">
                                    <Link
                                      href={categoryHref}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className="flex min-w-0 flex-1 items-center py-4"
                                    >
                                      <span className="!text-[16px] !font-bold !uppercase !tracking-[0.05em] text-brand-ink transition-all duration-300">
                                        {getCategoryLabel(category)}
                                      </span>
                                    </Link>

                                    {hasChildren ? (
                                      <button
                                        type="button"
                                        onClick={() => openCategoryLevel(category)}
                                        className="group flex shrink-0 items-center justify-center p-4 -mr-2 text-slate-400 transition-colors hover:text-slate-700"
                                        aria-label={`Open subcategories for ${getCategoryLabel(category)}`}
                                      >
                                        <ChevronRightIcon className="h-5 w-5" />
                                      </button>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-x-2 gap-y-6">
                            {currentCategories.map((category) => {
                              const childCategories = categoryChildrenMap.get(category.id || null) || [];
                              const hasChildren = childCategories.length > 0;
                              const categoryHref = `/${lang}/products?category=${encodeURIComponent(category.slug)}`;

                              return (
                                <div key={category.id} className="flex flex-col items-center">
                                  <div className="relative group w-full">
                                    <Link
                                      href={categoryHref}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className="flex flex-col items-center gap-3 w-full"
                                    >
                                      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100/50 shadow-sm transition-transform active:scale-95 duration-200">
                                        {category.imageUrl ? (
                                          <Image
                                            src={getOptimizedImageUrl(category.imageUrl, 240, 75)}
                                            alt={getCategoryLabel(category)}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 33vw, 120px"
                                            priority
                                            fetchPriority="high"
                                            unoptimized={true}
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-slate-200">
                                            <ShoppingBag className="w-8 h-8" strokeWidth={1} />
                                          </div>
                                        )}
                                      </div>
                                      <span className="text-[10px] font-black uppercase tracking-[0.1em] text-brand-ink text-center leading-tight line-clamp-2 px-1">
                                        {getCategoryLabel(category)}
                                      </span>
                                    </Link>

                                    {hasChildren && (
                                      <button
                                        type="button"
                                        onClick={() => openCategoryLevel(category)}
                                        className="absolute -top-2 -right-2 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-black shadow-md active:scale-110 transition-transform z-10"
                                        aria-label={`Open subcategories for ${getCategoryLabel(category)}`}
                                      >
                                        <Plus className="w-5 h-5" strokeWidth={3} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  
                  {categoryTrail.length === 1 && (
                    <>
                      {categories.length > 0 && (
                        <div className="w-8 h-px bg-gray-200 my-2" />
                      )}

                      {/* Pages */}
                      {(navbarLinks || [])
                        .filter((link: MenuLink) => link.href !== '/products' && link.href !== '/products/')
                        .map((link: MenuLink, index: number) => (
                        <Link
                          key={index}
                          href={localizeHref(lang, link.href)}
                          onClick={() => setMobileMenuOpen(false)}
                          className="group flex items-center justify-between py-3"
                        >
                          <span className="!text-[18px] !font-bold !uppercase !tracking-widest text-brand-ink group-hover:text-brand-ink transition-all duration-300">
                            {link.label[lang] || link.label['en']}
                          </span>
                          <ChevronRightIcon className="w-5 h-5 text-slate-400 transition-colors group-hover:text-slate-700" />
                        </Link>
                      ))}
                      {/* User Actions Panel - Redesigned Hub */}
                      <div className="mt-auto pt-8 border-t border-slate-100">
                        <div className="bg-slate-50 p-2 space-y-1 border border-slate-100">
                          {isAdmin && (
                            <Link
                              href="/admin"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 p-3 text-slate-600 hover:text-black hover:bg-white transition-all group"
                            >
                              <div className="w-8 h-8 bg-white border border-slate-200 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                <LayoutDashboard className="w-4 h-4" />
                              </div>
                              <span className="text-[11px] font-bold uppercase tracking-widest">{localLabels.adminDashboard}</span>
                            </Link>
                          )}
                          
                          {user ? (
                            <>
                              <Link
                                href={localizeHref(lang, '/profile')}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 p-3 text-slate-600 hover:text-black hover:bg-white transition-all group"
                              >
                                <div className="w-8 h-8 bg-white border border-slate-200 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                  <User className="w-4 h-4" />
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-widest">{localLabels.account}</span>
                              </Link>
                              
                              <button
                                onClick={async () => {
                                  await performClientLogout({ supabase, redirectTo: '/' });
                                  setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 p-3 text-rose-500 hover:text-rose-700 hover:bg-rose-50/50 transition-all group mt-2 border-t border-slate-200 pt-4"
                              >
                                <div className="w-8 h-8 bg-white border border-rose-100 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors">
                                  <LogOut className="w-4 h-4" />
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-widest">{localLabels.logout}</span>
                              </button>
                            </>
                          ) : (
                            <Link
                              href={localizeHref(lang, '/auth')}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 p-3 text-slate-600 hover:text-black hover:bg-white transition-all group"
                            >
                              <div className="w-8 h-8 bg-white border border-slate-200 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                <User className="w-4 h-4" />
                              </div>
                              <span className="text-[11px] font-bold uppercase tracking-widest">{localLabels.login}</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </nav>
              </div>

              {/* Removed Bottom Section */}
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </>
  );
}
