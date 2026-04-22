"use client";

import React from 'react';
import { LifeBuoy, RotateCcw, Search, ShieldCheck, ShoppingBag, Globe } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import type { CRMCustomer } from './types';

interface CustomerTableProps {
  customers: CRMCustomer[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectCustomer: (customer: CRMCustomer) => void;
}

export function CustomerTable({
  customers,
  loading,
  searchQuery,
  onSearchChange,
  onSelectCustomer,
}: CustomerTableProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Customer Intelligence Desk</h3>
          <p className="max-w-2xl text-sm text-slate-500">
            Inspect order value, support history, refunds, and recent activity without leaving the CRM workspace.
          </p>
        </div>

        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search customer database..."
            className="h-11 w-full rounded border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-slate-300">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-300 text-[11px] font-bold uppercase tracking-widest text-slate-500">
              <th className="px-6 py-4">Client Identity</th>
              <th className="px-6 py-4 text-center"><Globe className="w-3.5 h-3.5 inline-block" /></th>
              <th className="px-6 py-4">Portfolio</th>
              <th className="px-6 py-4">Activity</th>
              <th className="px-6 py-4">Access Level</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-20 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Syncing CRM databases...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-20 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  No matching records found
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="group transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-900">
                        {customer.email?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{customer.name || customer.email}</p>
                        <p className="truncate text-xs text-slate-400">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight bg-slate-100 text-slate-500 border border-slate-200">
                      {customer.preferred_lang || 'EN'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <ShoppingBag className="h-3 w-3" /> {customer.orderCount} Orders
                      </span>
                      <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {formatPrice(customer.totalSpent, 'en')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <LifeBuoy className="h-3 w-3" /> {customer.ticketCount}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <RotateCcw className="h-3 w-3" /> {customer.refundCount}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <ShieldCheck className="h-3 w-3" /> {customer.lastActiveAt ? new Date(customer.lastActiveAt).toLocaleDateString() : 'No activity'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${
                        customer.role === 'admin'
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 bg-white text-slate-500'
                      }`}
                    >
                      {customer.role || 'client'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onSelectCustomer(customer)}
                      className="border-b border-transparent text-[11px] font-bold uppercase tracking-widest text-slate-400 transition-all hover:border-slate-900 hover:text-slate-900"
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
