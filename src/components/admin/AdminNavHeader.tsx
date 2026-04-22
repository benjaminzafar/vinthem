'use client';

import React from 'react';
import { Search, Menu } from 'lucide-react';
import { NotificationCenter } from '@/components/admin/NotificationCenter';
import { usePathname } from 'next/navigation';

export default function AdminNavHeader({ onToggle }: { onToggle: () => void }) {
  const pathname = usePathname();
  const currentTab = pathname.split('/').pop() || 'Dashboard';
  const isIntegrationsPage = pathname.includes('/integrations');

  return (
    <header className="bg-white border-b border-slate-300 sticky top-0 z-30 flex-shrink-0">
      <div className="flex items-center justify-between px-4 sm:px-8 h-16">
        <div className="flex items-center">
          <button 
            onClick={onToggle}
            className="p-2 -ml-2 mr-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all rounded lg:hidden"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="hidden lg:flex items-center space-x-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
             <span>Admin</span>
             <span className="text-slate-300">/</span>
             <span className="text-slate-900">{currentTab.replace('-', ' ')}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {!isIntegrationsPage && (
            <div className="hidden md:flex relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 h-9 bg-slate-50 border border-slate-300 rounded text-sm focus:outline-none focus:border-slate-900 transition-all w-32 lg:w-64 placeholder:text-slate-400 text-slate-900"
              />
            </div>
          )}
          
          <div className="h-6 w-[1px] bg-slate-200 hidden md:block" />
          
          <NotificationCenter />
          
        </div>
      </div>
    </header>
  );
}
