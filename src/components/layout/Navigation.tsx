
import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { getSettings } from '@/lib/data';
import Image from 'next/image';
import { ShoppingBag, User } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { LanguageSwitcher } from './LanguageSwitcher';
import { AccountDropdown } from './AccountDropdown';
import { MobileMenu } from './MobileMenu';
import { CartToggle } from './CartToggle';
import { cookies } from 'next/headers';
import { localizeHref } from '@/lib/i18n-routing';
import { ConsentGuardian } from '../auth/ConsentGuardian';

export default async function Navigation() {
  const supabase = await createClient();
  const settings = await getSettings();
  const { data: { user } } = await supabase.auth.getUser();
  // Check if admin
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    isAdmin = profile?.role === 'admin';
  }

  // Fetch categories for the premium grid and hierarchy
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('id, name, slug, image_url, icon_url, show_in_hero, translations, parent_id')
    .limit(100);

  const categories = (categoriesData || []).map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    parentId: cat.parent_id,
    translations: cat.translations,
    imageUrl: cat.image_url,
    iconUrl: cat.icon_url,
    pinnedInSearch: false,
    showInHero: cat.show_in_hero,
    isFeatured: false
  }));

  // Resolve language from cookie
  const cookieStore = await cookies();
  const lang = (cookieStore.get('NEXT_LOCALE')?.value || 'en') as string;
  
  // Truly dynamic: use settings or fallback ONLY to the active language to prevent ghost flags
  const availableLanguages = settings?.languages?.length ? settings.languages : [lang];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <ConsentGuardian />
      <h1 className="sr-only">{settings?.seoTitle?.[lang] || settings?.seoTitle?.en || 'Vinthem - Premium Scandinavian Interior Design'}</h1>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center relative">
          {/* Brand Logo */}
          <div className="flex-1 flex items-center">
            <Link href={localizeHref(lang, '/')} className="flex items-center space-x-3 group">
              {settings?.logoImage && settings.logoImage.length > 5 && settings.logoImage.startsWith('h') ? (
                <div className="relative h-6 w-24">
                  <Image
                    src={settings.logoImage}
                    alt={`${settings.seoTitle?.[lang] || settings.seoTitle?.en || settings.storeName?.[lang] || 'Vinthem'}`}
                    fill
                    className="object-contain transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 100px, 128px"
                    priority
                  />
                </div>
              ) : (
                <span className="text-xl font-normal text-gray-900">
                  {settings?.storeName?.[lang] || settings.storeName?.en || 'Vinthem'}
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {(settings?.navbarLinks || []).map((link: { href: string; label: Record<string, string> }, index: number) => (
              <Link
                key={index}
                href={localizeHref(lang, link.href)}
                className="text-[12px] font-bold uppercase text-zinc-600 hover:text-brand-ink transition-colors tracking-widest"
              >
                {link.label[lang] || link.label['en']}
              </Link>
            ))}
          </div>

          {/* Right Actions: Rebuilt from Scratch for Perfection */}
          <div className="flex-1 flex justify-end h-full">
            <div className="flex h-full space-x-0.5 sm:space-x-1">
              
              {/* 1. Search Action */}
              <div className="relative group flex items-center h-full">
                <SearchBar
                  placeholder={settings?.searchPlaceholder?.[lang]}
                  categories={categories}
                  lang={lang}
                  labels={{
                    collections: settings?.searchCollectionsResultsText?.[lang] || 'Collections',
                    products: settings?.searchProductsResultsText?.[lang] || 'Products',
                    viewAllResults: settings?.viewAllResultsText?.[lang] || 'View all results',
                    noResults: settings?.searchNoProductsResultsText?.[lang] || settings?.noProductsMatchingText?.[lang] || 'No products found matching your search.',
                    sortNewest: settings?.sortNewestText?.[lang] || 'Newest Arrivals',
                    sortPriceAsc: settings?.sortPriceAscText?.[lang] || 'Price: Low to High',
                    sortPriceDesc: settings?.sortPriceDescText?.[lang] || 'Price: High to Low'
                  }}
                />
              </div>

              {/* 2. Language Action */}
              <div className="hidden md:flex h-full">
                <LanguageSwitcher availableLanguages={availableLanguages} />
              </div>

              {/* 3. Cart Action */}
              <div className="flex h-full">
                <CartToggle />
              </div>

              {/* 4. Account/Login Action */}
              <div className="hidden md:flex h-full">
                {user ? (
                  <AccountDropdown
                    user={user}
                    isAdmin={isAdmin}
                    locale={lang}
                    labels={{
                      profile: settings?.myProfileText?.[lang] || 'My Profile',
                      adminPanel: settings?.adminPanelText?.[lang] || 'Admin Panel',
                      logout: settings?.logoutText?.[lang] || 'Logout',
                      loggedOutSuccess: settings?.loggedOutSuccessText?.[lang] || 'Logged out successfully'
                    }}
                  />
                ) : (
                  <Link
                    href={localizeHref(lang, '/auth')}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all rounded flex items-center justify-center"
                    aria-label={settings?.loginText?.[lang] || 'Login'}
                  >
                    <User className="w-5 h-5" strokeWidth={1.5} />
                  </Link>
                )}
              </div>

              {/* 5. Mobile Menu Trigger */}
              <div className="lg:hidden flex items-center h-full ml-2">
                <MobileMenu
                  user={user}
                  isAdmin={isAdmin}
                  navbarLinks={settings?.navbarLinks || []}
                  lang={lang}
                  categories={categories}
                  availableLanguages={availableLanguages}
                  labels={{
                    menu: settings?.menuText?.[lang] || 'Menu',
                    language: settings?.languageLabel?.[lang] || 'Language',
                    account: settings?.accountLabel?.[lang] || 'Account',
                    adminDashboard: settings?.adminDashboardText?.[lang] || 'Admin Dashboard',
                    logout: settings?.logoutText?.[lang] || 'Logout',
                    login: settings?.loginText?.[lang] || 'Login',
                    allProducts: settings?.searchProductsResultsText?.[lang] || 'All Products'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
