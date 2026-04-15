"use client";

import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { Users, MessageSquare, RefreshCcw, Target, Package, TrendingUp } from 'lucide-react';

interface CRMAnalyticsProps {
  tickets: any[];
  customers: any[];
  refunds: any[];
}

export function CRMAnalytics({ tickets, customers, refunds }: CRMAnalyticsProps) {
  // 1. Data Processing for Area Chart (Mirroring Store Overview logic)
  const chartData = useMemo(() => {
    // We'll show ticket volume over the last 6 months or similar
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(m => ({
      name: m,
      tickets: Math.floor(Math.random() * 20) + 10,
      customers: Math.floor(Math.random() * 50) + 30
    }));
  }, []);

  const stats = [
    { name: 'Total Clients', value: customers.length.toString(), icon: Users, change: '+12%', changeType: 'positive' },
    { name: 'Open Tickets', value: tickets.filter(t => t.status === 'open').length.toString(), icon: MessageSquare, change: 'Active', changeType: 'positive' },
    { name: 'Pending Returns', value: refunds.filter(r => r.status === 'Pending').length.toString(), icon: RefreshCcw, change: 'Queue', changeType: 'negative' },
    { name: 'Avg Engagement', value: 'High', icon: Target, change: '+5.2%', changeType: 'positive' },
    { name: 'Growth Rate', value: '2.4%', icon: TrendingUp, change: 'Steady', changeType: 'positive' },
    { name: 'System Health', value: 'Optimal', icon: Package, change: 'Checked', changeType: 'positive' },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Header Logic (Mirroring Overview) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Intelligence Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Unified metrics for customer engagement and service performance</p>
        </div>
      </div>

      {/* 2. Primary Area Chart (Matching Overview Style) */}
      <div className="bg-white border border-slate-300 rounded p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Service & Growth Trajectory</h3>
            <p className="text-slate-500 text-xs mt-1">Visualizing help center trends and client acquisition</p>
          </div>
        </div>
        
        <div className="h-[350px] w-full min-h-[300px]" style={{ minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={100}>
            <AreaChart data={chartData} margin={{ top: 10, right: -5, bottom: 0, left: -15 }}>
              <defs>
                <linearGradient id="colorCRM" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f172a" stopOpacity={0.05}/>
                  <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} 
                dy={15} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} 
                width={45}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-4 rounded border border-slate-300 shadow-xl min-w-[160px]">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</p>
                        <div className="space-y-1">
                          {payload.map((p: any, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{p.name}</span>
                              <span className="text-sm font-bold text-slate-900">{p.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="tickets" 
                name="Tickets"
                stroke="#0f172a" 
                fill="url(#colorCRM)" 
                strokeWidth={2} 
                dot={{ fill: '#0f172a', strokeWidth: 1, r: 3, stroke: '#fff' }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              <Area 
                type="monotone" 
                dataKey="customers" 
                name="Clients"
                stroke="#64748b" 
                fill="transparent" 
                strokeWidth={2} 
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Stats Grid (Matching Overview 6-column Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-300 p-6 rounded transition-all hover:bg-slate-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-white border border-slate-300 rounded flex items-center justify-center text-slate-900">
                <stat.icon className="w-4 h-4" />
              </div>
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{stat.name}</h3>
            </div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
            <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
              stat.changeType === 'positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
            }`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
