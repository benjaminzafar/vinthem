
import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { getSettings } from '@/lib/data';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { LanguageSwitcher } from './LanguageSwitcher';
import { AccountDropdown } from './AccountDropdown';
import { MobileMenu } from './MobileMenu';
import { CartBadge } from './CartBadge';
import { cookies } from 'next/headers';

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
      .single();
    isAdmin = profile?.role === 'admin';
  }

  // Resolve language from cookie
  const cookieStore = await cookies();
  const lang = (cookieStore.get('NEXT_LOCALE')?.value || 'en') as string;
  const availableLanguages = settings?.languages?.length ? settings.languages : ['en', 'sv', 'fi', 'da'];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <h1 className="sr-only">Mavren Shop - Premium Scandinavian Interior Design</h1>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center relative">
          {/* Brand Logo */}
          <div className="flex-1 flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              {settings?.logoImage && settings.logoImage.trim() !== "" ? (
                <div className="relative h-8 w-32">
                  <Image 
                    src={settings.logoImage} 
                    alt={settings.storeName?.[lang] || 'Mavren'} 
                    fill
                    className="object-contain transition-transform group-hover:scale-105" 
                    sizes="(max-width: 768px) 100px, 128px"
                    priority
                  />
                </div>
              ) : (
                <span className="text-xl font-normal text-gray-900">
                  {settings?.storeName?.[lang] || 'Mavren'}
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {(settings?.navbarLinks || []).map((link: any, index: number) => (
              <Link 
                key={index} 
                href={link.href} 
                className="text-sm font-medium text-slate-600 hover:text-brand-ink transition-colors"
              >
                {link.label[lang] || link.label['en']}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex-1 flex items-center justify-end space-x-4">
            <SearchBar placeholder={settings?.searchPlaceholder?.[lang]} />
            
            <div className="hidden md:block">
              <LanguageSwitcher availableLanguages={availableLanguages} />
            </div>

            <Link 
              href="/cart" 
              className="relative p-2 text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
              <CartBadge />
            </Link>

            <div className="hidden md:block">
              {user ? (
                <AccountDropdown 
                  user={user} 
                  isAdmin={isAdmin} 
                  labels={{
                    profile: settings?.myProfileText?.[lang] || 'My Profile',
                    adminPanel: settings?.adminPanelText?.[lang] || 'Admin Panel',
                    logout: settings?.logoutText?.[lang] || 'Logout',
                    loggedOutSuccess: settings?.loggedOutSuccessText?.[lang] || 'Logged out successfully'
                  }}
                />
              ) : (
                <Link 
                  href="/auth"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-brand-ink rounded-none hover:bg-gray-800 transition-colors"
                >
                  {settings?.loginText?.[lang] || 'Login'}
                </Link>
              )}
            </div>
            
            <div className="lg:hidden">
              <MobileMenu 
                user={user} 
                isAdmin={isAdmin} 
                settings={settings} 
                lang={lang} 
                availableLanguages={availableLanguages}
                labels={{
                  menu: settings?.menuText?.[lang] || 'Menu',
                  language: settings?.languageLabel?.[lang] || 'Language',
                  account: settings?.accountLabel?.[lang] || 'Account',
                  adminDashboard: settings?.adminDashboardText?.[lang] || 'Admin Dashboard',
                  logout: settings?.logoutText?.[lang] || 'Logout',
                  login: settings?.loginText?.[lang] || 'Login'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
