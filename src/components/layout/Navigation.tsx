
import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { getSettings } from '@/lib/data';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { LanguageSwitcher } from './LanguageSwitcher';
import { AccountDropdown } from './AccountDropdown';
import { MobileMenu } from './MobileMenu';
import { CartToggle } from './CartToggle';
import { cookies } from 'next/headers';
import { localizeHref } from '@/lib/i18n-routing';
import { ConsentGuardian } from '../auth/ConsentGuardian';

const UserIcon = ({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

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
      <h1 className="sr-only">{settings?.seoTitle?.[lang] || settings?.seoTitle?.en || 'Vinthem - Quality Everyday Essentials'}</h1>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">
          
          {/* 1. Mobile Menu Trigger (Left on Mobile, Hidden on Desktop) */}
          <div className="flex-1 lg:hidden">
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

          {/* 2. Brand Logo (Centered on Mobile, Left on Desktop) */}
          <div className="flex lg:flex-none items-center justify-center lg:justify-start flex-1 lg:flex-initial">
            <Link href={localizeHref(lang, '/')} className="flex items-center space-x-3 group">
              {settings?.logoImage && settings.logoImage.length > 5 && settings.logoImage.startsWith('h') ? (
                <div className="relative h-7 w-28">
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

          {/* 3. Desktop Navigation (Center on Desktop, Hidden on Mobile) */}
          <div className="hidden lg:flex flex-1 justify-center items-center space-x-8 px-8">
            {(settings?.navbarLinks || []).map((link: { href: string; label: Record<string, string> }, index: number) => (
              <Link
                key={index}
                href={localizeHref(lang, link.href)}
                className="text-[12px] font-bold uppercase text-zinc-600 hover:text-brand-ink transition-colors tracking-widest whitespace-nowrap"
              >
                {link.label[lang] || link.label['en']}
              </Link>
            ))}
          </div>

          {/* 4. Right Actions (Search, Language, Cart, Account) */}
          <div className="flex-1 flex justify-end items-center h-full">
            <div className="flex items-center h-full space-x-0.5 sm:space-x-1">
              
              {/* Search Action */}
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

              {/* Language Action (Desktop Only) */}
              <div className="hidden md:flex h-full items-center">
                <LanguageSwitcher availableLanguages={availableLanguages} />
              </div>

              {/* Cart Action */}
              <div className="flex h-full items-center">
                <CartToggle />
              </div>

              {/* Account/Login Action (Desktop Only) */}
              <div className="hidden md:flex h-full items-center">
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
                    className="px-2 py-2 text-slate-600 hover:text-brand-ink transition-colors flex items-center justify-center"
                    aria-label={settings?.loginText?.[lang] || 'Login'}
                  >
                     <UserIcon className="w-5 h-5" strokeWidth={1.5} />
                  </Link>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
