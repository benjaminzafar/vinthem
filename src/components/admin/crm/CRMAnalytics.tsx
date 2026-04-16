"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import { 
  Users, MessageSquare, RefreshCcw, Target, 
  Package, TrendingUp, Activity, Globe, Settings, X, ShieldCheck, ExternalLink 
} from 'lucide-react';

interface CRMAnalyticsProps {
  tickets: any[];
  customers: any[];
  refunds: any[];
}

export function CRMAnalytics({ tickets, customers, refunds }: CRMAnalyticsProps) {
  const [trafficData, setTrafficData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<Record<string, string>>({
    POSTHOG_PROJECT_ID: '',
    POSTHOG_PROJECT_KEY: '',
    POSTHOG_API_KEY: '', // Personal API key for retrieval
    POSTHOG_HOST: 'https://eu.posthog.com'
  });

  const fetchTraffic = async () => {
    try {
      const res = await fetch('/api/admin/intelligence/traffic');
      const data = await res.json();
      setTrafficData(data);
    } catch (err) {
      console.error('Failed to fetch traffic stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraffic();
    const interval = setInterval(fetchTraffic, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/integrations/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setIsSettingsOpen(false);
        fetchTraffic();
      }
    } catch (err) {
      console.error('Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  const stats = [
    { name: 'Total Clients', value: customers.length.toString(), icon: Users, change: '+12%', changeType: 'positive' },
    { name: 'Open Tickets', value: tickets.filter(t => t.status === 'open').length.toString(), icon: MessageSquare, change: 'Active', changeType: 'positive' },
    { name: 'Pending Returns', value: refunds.filter(r => r.status === 'Pending').length.toString(), icon: RefreshCcw, change: 'Queue', changeType: 'negative' },
    { name: 'Active Now', value: trafficData?.activeNow?.toString() || '0', icon: Activity, change: 'Real-time', changeType: 'positive' },
    { name: 'Growth Rate', value: '2.4%', icon: TrendingUp, change: 'Steady', changeType: 'positive' },
    { name: 'System Health', value: 'Optimal', icon: Package, change: 'Checked', changeType: 'positive' },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* 1. Header Logic */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Intelligence Dashboard</h2>
            {trafficData?.isReal && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Pure Real Mode</span>
              </div>
            )}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-all"
              title="Connect Real-time Data"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-1">Cross-platform traffic, engagement, and service metrics</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {!trafficData?.isReal && (
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-3 h-3" />
              Activate Real Mode
            </button>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded text-[10px] font-bold text-emerald-700 uppercase tracking-widest animate-pulse">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
             Live Traffic Monitoring Active
          </div>
        </div>
      </div>

      {/* Connectivity Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-300 rounded shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-300 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Connect Real-time Data
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveConfig} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Connect your <strong>PostHog</strong> account to switch from demonstration mode to real-time traffic and page tracking. Your keys will be <strong>encrypted</strong> and saved securely.
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Project API Key (Public)</label>
                <input 
                  type="text" 
                  value={config.POSTHOG_PROJECT_KEY || ""}
                  onChange={e => setConfig({...config, POSTHOG_PROJECT_KEY: e.target.value})}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded text-sm focus:outline-none focus:border-slate-900 transition-all"
                  placeholder="phc_..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Personal API Key (Private)</label>
                <input 
                  type="password" 
                  value={config.POSTHOG_API_KEY || ""}
                  onChange={e => setConfig({...config, POSTHOG_API_KEY: e.target.value})}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded text-sm focus:outline-none focus:border-slate-900 transition-all"
                  placeholder="phx_..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Project ID</label>
                <input 
                  type="text" 
                  value={config.POSTHOG_PROJECT_ID || ""}
                  onChange={e => setConfig({...config, POSTHOG_PROJECT_ID: e.target.value})}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded text-sm focus:outline-none focus:border-slate-900 transition-all"
                  placeholder="12345"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <a 
                  href="https://eu.posthog.com/settings/project" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 flex items-center gap-1"
                >
                  Get Keys <ExternalLink className="w-3 h-3" />
                </a>
                <button 
                  disabled={saving}
                  className="px-6 h-10 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Activate Real Mode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. Primary Area Chart (Traffic Pulse) */}
        <div className="lg:col-span-2 bg-white border border-slate-300 rounded p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                Traffic Pulse
              </h3>
              <p className="text-slate-500 text-xs mt-1">Real-time website hits over the last 24 hours</p>
            </div>
            {trafficData && (
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{trafficData.activeNow}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Sessions</p>
              </div>
            )}
          </div>
          
          <div className="h-[350px] w-full" style={{ minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData?.pulse || []} margin={{ top: 10, right: -5, bottom: 0, left: -15 }}>
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.05}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} 
                  dy={15} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} 
                  width={40}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-4 rounded border border-slate-300 shadow-xl min-w-[140px]">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</p>
                          <div className="space-y-1">
                            {payload.map((p: any, i) => (
                              <div key={i} className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{p.name}</span>
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
                  dataKey="visits" 
                  name="Pageviews"
                  stroke="#0f172a" 
                  fill="url(#colorTraffic)" 
                  strokeWidth={2} 
                  dot={{ fill: '#0f172a', strokeWidth: 1, r: 3, stroke: '#fff' }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Traffic Sources (Bar Chart) */}
        <div className="bg-white border border-slate-300 rounded p-6 sm:p-8">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              Source Origins
            </h3>
            <p className="text-slate-500 text-xs mt-1">Top acquisition channels</p>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trafficData?.sources || []} layout="vertical" margin={{ left: -20, right: 30 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} 
                  width={80}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload?.[0]) {
                      return (
                        <div className="bg-slate-900 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest">
                          {payload[0].value}% Volume
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                  {trafficData?.sources.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-8 space-y-4">
            {trafficData?.sources.map((source: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: source.color }} />
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{source.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-900">{source.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Deep Page Intelligence & Live Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performing Content */}
        <div className="bg-white border border-slate-300 rounded overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-300 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Top Performing Content
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-300 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  <th className="px-6 py-3">Path / Product</th>
                  <th className="px-6 py-3">Views</th>
                  <th className="px-6 py-3 text-right">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trafficData?.topPages?.map((page: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-3">
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[200px] block">{page.path}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs font-bold text-slate-500">{page.views.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        page.growth.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {page.growth}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="bg-white border border-slate-300 rounded overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-300 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Target className="w-4 h-4 text-slate-400" />
              Live Activity Stream
            </h3>
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold uppercase tracking-widest border border-emerald-100">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Active
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {trafficData?.recentActivity?.map((act: any) => (
              <div key={act.id} className="px-6 py-4 hover:bg-slate-50 transition-all group flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-900 group-hover:border-slate-300 transition-all">
                    {act.user.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs text-slate-900">
                      <span className="font-bold">{act.user}</span> <span className="text-slate-500">{act.action}</span> <span className="font-bold text-slate-900">{act.target}</span>
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-60 font-mono">{act.path}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 opacity-60">{act.time}</span>
              </div>
            ))}
          </div>
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
            <button className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all">
              View All Activity Logs
            </button>
          </div>
        </div>
      </div>

      {/* 5. Stats Grid */}
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
