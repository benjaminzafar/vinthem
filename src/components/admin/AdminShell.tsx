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
    <div className="min-h-screen bg-slate-50 flex w-full font-sans selection:bg-slate-900/10">
      <AdminSidebar 
        activeUserEmail={activeUserEmail} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <AdminNavHeader onToggle={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:px-12 lg:py-10 custom-scrollbar relative">
          <div className="max-w-7xl mx-auto w-full pb-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
