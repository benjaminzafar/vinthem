
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
import { LoginLink } from './LoginLink';
import { cookies } from 'next/headers';
import { localizeHref } from '@/lib/i18n-routing';
import { ConsentGuardian } from '../auth/ConsentGuardian';
import { t } from '@/lib/dictionary';

const UserIcon = ({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default async function Navigation() {
  const supabase = await createClient();
  const settings = await getSettings();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
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

  const productsLink = (settings?.navbarLinks || []).find((link: any) => link.href === '/products' || link.href === '/products/');
  const productsLabel = productsLink ? (productsLink.label[lang] || productsLink.label['en']) : (settings?.searchProductsResultsText?.[lang]);

  const labels = {
    allProducts: productsLabel || t('allProducts', lang),
    menu: t('menu', lang, settings?.menuText?.[lang]),
    language: t('language', lang, settings?.languageLabel?.[lang]),
    account: t('account', lang, settings?.accountLabel?.[lang]),
    adminDashboard: t('adminDashboard', lang, settings?.adminDashboardText?.[lang]),
    logout: t('logout', lang, settings?.logoutText?.[lang]),
    login: t('login', lang, settings?.loginText?.[lang])
  };

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
              settings={settings}
              labels={{
                menu: labels.menu,
                language: labels.language,
                account: labels.account,
                adminDashboard: labels.adminDashboard,
                logout: labels.logout,
                login: labels.login,
                allProducts: labels.allProducts
              }}
            />
          </div>

          {/* 2. Brand Logo (Centered on Mobile, Left on Desktop) */}
          <div className="flex lg:flex-none items-center justify-center lg:justify-start flex-1 lg:flex-initial -ml-1 lg:ml-0">
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
                  placeholder={t('searchPlaceholder', lang, settings?.searchPlaceholder?.[lang])}
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
                      profile: t('account', lang, settings?.myProfileText?.[lang] || settings?.profileText?.[lang]),
                      orders: t('orders', lang, settings?.ordersText?.[lang]),
                      support: t('support', lang),
                      addresses: t('addresses', lang, settings?.addressesText?.[lang]),
                      adminPanel: t('adminDashboard', lang, settings?.adminPanelText?.[lang] || settings?.adminDashboardText?.[lang]),
                      logout: t('logout', lang, settings?.logoutText?.[lang]),
                      loggedOutSuccess: settings?.loggedOutSuccessText?.[lang] || 'Logged out successfully'
                    }}
                  />
                ) : (
                  <LoginLink 
                    lang={lang} 
                    loginText={labels.login} 
                  />
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
