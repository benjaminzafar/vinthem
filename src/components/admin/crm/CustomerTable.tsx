"use client";

import React from 'react';
import { Search } from 'lucide-react';

interface CustomerTableProps {
  customers: any[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectCustomer: (customer: any) => void;
}

export function CustomerTable({ 
  customers, 
  loading, 
  searchQuery, 
  onSearchChange, 
  onSelectCustomer 
}: CustomerTableProps) {
  return (
    <div className="space-y-8">
      {/* 1. Search Logic (Aligned with Slate professional style) */}
      <div className="relative w-full sm:max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          value={searchQuery} 
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search customer database..."
          className="w-full pl-10 pr-4 h-10 bg-white border border-slate-300 rounded text-sm focus:outline-none focus:border-slate-900 transition-all text-slate-900 placeholder:text-slate-400"
        />
      </div>

      {/* 2. Table Section (Aligned with Overview 'Top Performers' table) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-300 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
              <th className="px-6 py-4">Client Identity</th>
              <th className="px-6 py-4">Joined At</th>
              <th className="px-6 py-4">Access Level</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[11px]">Syncing CRM databases...</td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[11px]">No matching records found</td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 bg-slate-100 border border-slate-200 text-slate-900 rounded flex items-center justify-center text-[10px] font-bold shrink-0">
                        {customer.email?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span className="font-bold text-slate-900 text-sm">{customer.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">
                    {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                      customer.role === 'admin' 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-white text-slate-500 border-slate-300'
                    }`}>
                      {customer.role || 'client'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onSelectCustomer(customer)} 
                      className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all border-b border-transparent hover:border-slate-900"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
