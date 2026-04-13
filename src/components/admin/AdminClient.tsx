"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Search,
  X,
  Database
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

// Dynamic imports for better code splitting
const Overview = dynamic(() => import('@/components/admin/Overview').then(m => m.Overview), { ssr: false });
const OrderManager = dynamic(() => import('@/components/admin/OrderManager').then(m => m.OrderManager), { ssr: false });
const ProductManager = dynamic(() => import('@/components/admin/ProductManager').then(m => m.ProductManager), { ssr: false });
const CollectionManager = dynamic(() => import('@/components/admin/CollectionManager').then(m => m.CollectionManager), { ssr: false });
const CustomersAndCRMManager = dynamic(() => import('@/components/admin/CustomersAndCRMManager').then(m => m.CustomersAndCRMManager), { ssr: false });
const BlogManager = dynamic(() => import('@/components/admin/BlogManager').then(m => m.BlogManager), { ssr: false });
const PageManager = dynamic(() => import('@/components/admin/PageManager').then(m => m.PageManager), { ssr: false });
const DatabaseManager = dynamic(() => import('@/components/admin/DatabaseManager').then(m => m.DatabaseManager), { ssr: false });
const StorefrontSettingsNew = dynamic(() => import('@/components/admin/StorefrontSettings').then(m => m.StorefrontSettings), { ssr: false });
const IntegrationsManager = dynamic(() => import('@/components/admin/IntegrationsManager').then(m => m.IntegrationsManager), { ssr: false });
const NotificationCenter = dynamic(() => import('@/components/admin/NotificationCenter').then(m => m.NotificationCenter), { ssr: false });

export function AdminClient() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'collections', label: 'Collections', icon: Layout },
    { id: 'customers', label: 'Customers & CRM', icon: Users },
    { id: 'blogs', label: 'Journal / Blog', icon: FileText },
    { id: 'pages', label: 'Pages', icon: FileCode },
    { id: 'storefront', label: 'Storefront', icon: Settings },
    { id: 'integrations', label: 'Integrations', icon: LinkIcon },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white flex w-full font-sans selection:bg-zinc-900/30">
      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-white/50 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-72 bg-white text-zinc-600 z-50 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between px-6 h-16 border-b border-slate-200/60">
                <h1 className="text-xl font-bold text-zinc-900 flex items-center tracking-tight">
                  <Settings className="w-5 h-5 mr-2 text-zinc-900" /> Admin
                </h1>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-zinc-500 hover:text-zinc-900 rounded transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { 
                      setActiveTab(item.id); 
                      setSelectedProductId(null);
                      setIsMobileMenuOpen(false); 
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-md transition-all ${
                      activeTab === item.id 
                        ? 'bg-zinc-900 text-white font-medium' 
                        : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-white' : 'text-zinc-500'}`} />
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
              <div className="p-4 border-t border-slate-200/60">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center space-x-3 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/50 px-6 py-3 text-sm font-medium rounded-md transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-white text-zinc-600 flex-shrink-0 flex-col h-screen sticky top-0 z-20 border-r border-slate-200/60">
        <div className="flex items-center p-6 h-16 border-b border-slate-200/60">
          <h1 className="text-lg font-bold text-zinc-900 flex items-center tracking-tight">
            <Settings className="w-5 h-5 mr-3 text-zinc-900" />
            Admin
          </h1>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div className="px-4 mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Menu</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSelectedProductId(null);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-all ${
                activeTab === item.id 
                  ? 'bg-zinc-900 text-white font-semibold shadow-sm' 
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-white' : 'text-zinc-400'}`} />
              <span className="text-sm tracking-tight">{item.label}</span>
            </button>
          ))}
        </div>
        
        <div className="p-6 border-t border-slate-200/60">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center text-white font-bold text-sm mr-3">
              A
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm font-bold text-zinc-900 truncate">Admin User</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-2 text-zinc-500 hover:text-zinc-900 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200/60 sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 mr-2 text-zinc-500 hover:bg-slate-100 rounded md:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold text-slate-800 capitalize hidden sm:block">
                {navItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
              </h2>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="hidden md:flex relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-9 pr-4 py-2 bg-slate-100/50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-900 transition-all w-64"
                />
              </div>
              
              <NotificationCenter onNavigate={(path) => setActiveTab(path)} />
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:px-6 lg:py-8 custom-scrollbar">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="max-w-7xl mx-auto w-full pb-12"
          >
            {activeTab === 'overview' && <Overview onProductClick={(p) => { setSelectedProductId(p.id); setActiveTab('products'); }} onSeedClick={() => setActiveTab('database')} />}
            {activeTab === 'orders' && <OrderManager onSeedClick={() => setActiveTab('database')} />}
            {activeTab === 'products' && <ProductManager selectedProductId={selectedProductId} onClearSelection={() => setSelectedProductId(null)} />}
            {activeTab === 'collections' && <CollectionManager />}
            {activeTab === 'customers' && <CustomersAndCRMManager />}
            {activeTab === 'blogs' && <BlogManager />}
            {activeTab === 'pages' && <PageManager />}
            {activeTab === 'database' && <DatabaseManager />}
            {activeTab === 'storefront' && (
              <StorefrontSettingsNew 
                handleSaveSettings={async (settings) => {
                  const toastId = toast.loading('Saving storefront settings...');
                  try {
                    await supabase.from('settings').upsert({ id: 'primary', data: settings });
                    toast.success('Storefront settings saved successfully', { id: toastId });
                  } catch (error) {
                    console.error('Error saving settings:', error);
                    toast.error('Failed to save settings', { id: toastId });
                  }
                }} 
              />
            )}
            {activeTab === 'integrations' && <IntegrationsManager />}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
