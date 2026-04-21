'use client';

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
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/utils/supabase/client';

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
        <h1 className="text-lg font-bold text-slate-900 flex items-center tracking-tight">
          <Settings className="w-5 h-5 mr-3 text-slate-900" />
          Admin
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        <div className="px-3 mb-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Menu</div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onNavItemClick}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded transition-all ${
                isActive
                  ? 'bg-slate-900 text-white font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>
      
      <div className="p-6 border-t border-slate-300 bg-white">
        <div className="flex items-center mb-6 px-1">
          <div className="w-9 h-9 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-sm mr-3 shrink-0">
            {activeUserEmail?.[0].toUpperCase() || 'A'}
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">Admin User</p>
            <p className="text-xs text-slate-500 truncate mt-0.5">{activeUserEmail}</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center space-x-2 px-4 h-10 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all text-sm font-medium rounded"
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
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-white text-slate-600 flex-shrink-0 flex-col h-screen sticky top-0 z-20 border-r border-slate-300 shadow-none">
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
              className="fixed inset-y-0 left-0 w-72 bg-white text-slate-600 z-[60] flex flex-col lg:hidden border-r border-slate-300"
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
