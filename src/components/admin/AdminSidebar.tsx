'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Layout, 
  Users, 
  FileText, 
  FileCode, 
  Settings, 
  LinkIcon,
  LogOut,
  Menu,
  X,
  Images,
  User as UserIcon
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/utils/supabase/client';
import { performClientLogout } from '@/lib/client-auth';

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/admin/overview' },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, href: '/admin/orders' },
  { id: 'products', label: 'Products', icon: Package, href: '/admin/products' },
  { id: 'media', label: 'Media Center', icon: Images, href: '/admin/media' },
  { id: 'collections', label: 'Collections', icon: Layout, href: '/admin/collections' },
  { id: 'customers', label: 'Customers & CRM', icon: Users, href: '/admin/customers' },
  { id: 'blogs', label: 'Journal / Blog', icon: FileText, href: '/admin/blogs' },
  { id: 'pages', label: 'Pages', icon: FileCode, href: '/admin/pages' },
  { id: 'storefront', label: 'Storefront', icon: Settings, href: '/admin/storefront' },
  { id: 'integrations', label: 'Integrations', icon: LinkIcon, href: '/admin/integrations' },
];

function SidebarContent({
  pathname,
  activeUserEmail,
  onSignOut,
  onNavItemClick,
}: {
  pathname: string;
  activeUserEmail?: string;
  onSignOut: () => Promise<void>;
  onNavItemClick?: () => void;
}) {
  return (
    <>
      <div className="flex items-center px-6 h-16 border-b border-slate-300 bg-white shrink-0">
        <h1 className="text-[13px] font-semibold tracking-[0.18em] text-slate-900 flex items-center uppercase">
          <Settings className="w-4 h-4 mr-3 text-slate-900" />
          Admin
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5 custom-scrollbar">
        <div className="px-3 mb-3 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em]">Menu</div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onNavItemClick}
              className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span className="text-[13px] font-medium tracking-normal">{item.label}</span>
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-slate-300 bg-white">
        <div className="flex items-center mb-4 px-1">
          <div className="w-10 h-10 rounded-md bg-slate-900 flex items-center justify-center text-white font-semibold text-[13px] mr-3 shrink-0">
            {activeUserEmail?.[0].toUpperCase() || 'A'}
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 truncate">Admin User</p>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">{activeUserEmail}</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center space-x-2 px-4 h-10 rounded-md border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all text-[12px] font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );
}

export default function AdminSidebar({ 
  activeUserEmail,
  isOpen,
  onClose
}: { 
  activeUserEmail?: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const supabase = createClient();

  const handleSignOut = async () => {
    await performClientLogout({
      supabase,
      redirectTo: '/',
    });
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-[272px] bg-white text-slate-600 flex-shrink-0 flex-col h-screen sticky top-0 z-20 border-r border-slate-300 shadow-none">
        <SidebarContent pathname={pathname} activeUserEmail={activeUserEmail} onSignOut={handleSignOut} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-72 max-w-[86vw] bg-white text-slate-600 z-[60] flex flex-col lg:hidden border-r border-slate-300"
            >
              <SidebarContent 
                pathname={pathname} 
                activeUserEmail={activeUserEmail} 
                onSignOut={handleSignOut} 
                onNavItemClick={onClose}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
