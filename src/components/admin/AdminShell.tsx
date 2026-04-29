'use client';

import React, { useState, ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminNavHeader from './AdminNavHeader';

interface AdminShellProps {
  children: ReactNode;
  activeUserEmail?: string;
}

export default function AdminShell({ children, activeUserEmail }: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="admin-surface min-h-screen bg-slate-50 flex w-full font-sans selection:bg-slate-900/10">
      <AdminSidebar 
        activeUserEmail={activeUserEmail} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <AdminNavHeader onToggle={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8 custom-scrollbar relative">
          <div className="max-w-[1400px] mx-auto w-full pb-16 sm:pb-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
