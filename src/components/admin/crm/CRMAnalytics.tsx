"use client";

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  MessageSquare,
  RefreshCcw,
  Settings,
  X,
  Package,
  AlertTriangle,
  User as UserIcon,
} from 'lucide-react';

import type { CRMCustomer, CRMOrder, RefundRecord, SupportTicket } from './types';
import { StableChartContainer } from '../charts/StableChartContainer';

interface CRMAnalyticsProps {
  tickets: SupportTicket[];
  customers: CRMCustomer[];
  refunds: RefundRecord[];
  orders: CRMOrder[];
}





function EmptyPanel({ message, error }: { message: string, error?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
      <p className="max-w-xs text-xs font-semibold uppercase tracking-widest text-slate-400">
        {message}
      </p>
      {error && (
        <p className="mt-2 max-w-sm text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded">
          {error}
        </p>
      )}
    </div>
  );
}

export function CRMAnalytics({ tickets, customers, refunds, orders }: CRMAnalyticsProps) {

  const ticketDistribution = useMemo(() => {
    const counts = {
      open: tickets.filter(t => t.status === 'open').length,
      'in-progress': tickets.filter(t => t.status === 'in-progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
    };
    
    return [
      { name: 'Open', value: counts.open, color: '#0F172A' },
      { name: 'In-Progress', value: counts['in-progress'], color: '#475569' },
      { name: 'Resolved', value: counts.resolved, color: '#94A3B8' },
    ];
  }, [tickets]);

  const refundDistribution = useMemo(() => {
    const counts = {
      Pending: refunds.filter(r => r.status === 'Pending').length,
      Approved: refunds.filter(r => r.status === 'Approved').length,
      Refunded: refunds.filter(r => r.status === 'Refunded').length,
      Rejected: refunds.filter(r => r.status === 'Rejected').length,
    };
    
    return [
      { name: 'Pending', value: counts.Pending, color: '#F59E0B' },
      { name: 'Approved', value: counts.Approved, color: '#10B981' },
      { name: 'Refunded', value: counts.Refunded, color: '#3B82F6' },
      { name: 'Rejected', value: counts.Rejected, color: '#EF4444' },
    ];
  }, [refunds]);

  const stats = useMemo(() => [
    { name: 'Total Clients', value: customers.length.toString(), icon: Users, change: '+12%', changeType: 'positive' as const },
    { name: 'Open Tickets', value: tickets.filter((ticket) => ticket.status === 'open').length.toString(), icon: MessageSquare, change: 'Active', changeType: 'positive' as const },
    { name: 'Pending Returns', value: refunds.filter((refund) => refund.status === 'Pending').length.toString(), icon: RefreshCcw, change: 'Queue', changeType: 'negative' as const },
    { name: 'System Performance', value: 'Optimal', icon: Package, change: 'Stable', changeType: 'positive' as const },
  ], [customers.length, refunds, tickets]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Intelligence Dashboard</h2>
            <div className="flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-700">
                Optimized Mode
              </span>
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-500">Cross-platform traffic, engagement, and service metrics</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 rounded border border-slate-100 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-800 shadow-sm transition-all">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Service Stream Active
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded border border-slate-300 bg-white p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-900">
                <MessageSquare className="h-4 w-4 text-indigo-500" />
                Service Pulse (Tickets)
              </h3>
              <p className="mt-1 text-[11px] font-medium text-slate-500">Live support queue distribution</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-slate-900 font-mono">{tickets.length}</span>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Total Active</p>
            </div>
          </div>
          
          <StableChartContainer className="h-[200px] w-full" minHeight={200}>
            {tickets.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={ticketDistribution} layout="vertical" margin={{ left: -10, right: 30, top: 0, bottom: 0 }} barSize={12}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                    width={80}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(15, 23, 42, 0.02)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length > 0) {
                        return (
                          <div className="rounded border border-slate-200 bg-white px-3 py-2 shadow-lg scale-90">
                            <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">{payload[0].payload.name}</p>
                            <p className="text-xs font-black text-slate-900">{payload[0].value} <span className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter">Tickets</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {ticketDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyPanel message="No support signal detected" />
            )}
          </StableChartContainer>
          
          <div className="mt-6 flex items-center justify-center gap-6 border-t border-slate-100 pt-6">
            {ticketDistribution.map((t) => (
              <div key={t.name} className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{t.name}</span>
                <span className="text-[10px] font-black text-slate-900">{t.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-slate-300 bg-white p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-900">
                <RefreshCcw className="h-4 w-4 text-orange-500" />
                Logistics Flow (Returns)
              </h3>
              <p className="mt-1 text-[11px] font-medium text-slate-500">Refund and exchange lifecycle</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-slate-900 font-mono">{refunds.length}</span>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Total Entries</p>
            </div>
          </div>

          <StableChartContainer className="h-[200px] w-full" minHeight={200}>
            {refunds.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={refundDistribution} layout="vertical" margin={{ left: -10, right: 30, top: 0, bottom: 0 }} barSize={12}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                    width={80}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(15, 23, 42, 0.02)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length > 0) {
                        return (
                          <div className="rounded border border-slate-200 bg-white px-3 py-2 shadow-lg scale-90">
                            <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">{payload[0].payload.name}</p>
                            <p className="text-xs font-black text-slate-900">{payload[0].value} <span className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter">Units</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {refundDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyPanel message="No logistics flow data" />
            )}
          </StableChartContainer>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
            {refundDistribution.map((r) => (
              <div key={r.name} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: r.color }} />
                <div className="flex flex-1 items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{r.name}</span>
                  <span className="text-[10px] font-black text-slate-900">{r.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="rounded border border-slate-300 bg-white p-6 transition-all hover:bg-slate-50">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 bg-white text-slate-900">
                <stat.icon className="h-4 w-4" />
              </div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{stat.name}</h3>
            </div>
            <p className="text-2xl font-bold tracking-tight text-slate-900">{stat.value}</p>
            <div className={`mt-2 inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              stat.changeType === 'positive'
                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                : 'border-rose-100 bg-rose-50 text-rose-700'
            }`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
