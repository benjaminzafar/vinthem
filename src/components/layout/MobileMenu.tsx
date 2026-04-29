"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Menu, X, ChevronRight, ChevronLeft, User, Settings, LogOut } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { StorefrontSettings, MenuLink } from '@/store/useSettingsStore';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Portal } from './Portal';
import { Category } from '@/types';
import { localizeHref } from '@/lib/i18n-routing';
import { performClientLogout } from '@/lib/client-auth';

interface MobileMenuProps {
  user: SupabaseUser | null;
  isAdmin: boolean;
  navbarLinks: MenuLink[];
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

export function MobileMenu({ user, isAdmin, navbarLinks, lang, categories, availableLanguages, labels }: MobileMenuProps) {
  const { isMobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const [isDesktop, setIsDesktop] = useState(false);
  const [categoryTrail, setCategoryTrail] = useState<CategoryTrailItem[]>(createRootCategoryTrail(labels.allProducts));
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

  const handleLogout = async (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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
              className="fixed inset-0 bg-black/40 z-[200]"
            />
            <motion.div
              ref={menuRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 right-0 h-[100dvh] w-full sm:w-[85vw] sm:max-w-sm bg-white border-l border-gray-100 z-[201] flex flex-col shadow-2xl will-change-transform"
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
                      {labels.allProducts}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 transition-colors group-hover:text-slate-700" />
                  </Link>

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
                          <button
                            type="button"
                            onClick={goBackCategoryLevel}
                            className="flex w-full items-center gap-2 pb-2 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-900"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            {categoryTrail[categoryTrail.length - 2]?.label || labels.allProducts}
                          </button>
                        ) : null}

                        {currentCategories.map((category) => {
                          const childCategories = categoryChildrenMap.get(category.id || null) || [];
                          const hasChildren = childCategories.length > 0;
                          const categoryHref = `/${lang}/products?category=${encodeURIComponent(category.slug)}`;

                          return (
                            <div key={category.id} className="rounded-md border border-slate-100 bg-white">
                              <div className="flex items-stretch">
                                <Link
                                  href={categoryHref}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="flex min-w-0 flex-1 items-center px-4 py-3"
                                >
                                  <span className="!text-[12px] !font-bold !uppercase !tracking-widest text-brand-ink transition-all duration-300">
                                    {getCategoryLabel(category)}
                                  </span>
                                </Link>

                                {hasChildren ? (
                                  <button
                                    type="button"
                                    onClick={() => openCategoryLevel(category)}
                                    className="group flex shrink-0 items-center justify-center px-3 text-slate-500 transition-colors hover:text-slate-900"
                                    aria-label={`Open subcategories for ${getCategoryLabel(category)}`}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <span className="flex shrink-0 items-center justify-center px-3 text-slate-300">
                                    <ChevronRight className="h-4 w-4" />
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  
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
                      className="group flex items-center justify-between"
                    >
                      <span className="!text-[12px] !font-bold !uppercase !tracking-widest text-brand-ink group-hover:text-brand-ink transition-all duration-300">
                        {link.label[lang] || link.label['en']}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 transition-colors group-hover:text-slate-700" />
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
