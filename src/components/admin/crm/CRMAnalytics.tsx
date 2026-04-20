"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import {
  Users,
  MessageSquare,
  RefreshCcw,
  Target,
  Package,
  TrendingUp,
  Activity,
  Globe,
  Settings,
  X,
  ShieldCheck,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

import { getIntegrationsAction, saveIntegrationAction } from '@/app/actions/integrations';
import type { CRMCustomer, CRMOrder, RefundRecord, SupportTicket } from './types';
import { StableChartContainer } from '../charts/StableChartContainer';

type TrafficPoint = {
  name: string;
  visits: number;
  unique: number;
};

type TrafficSource = {
  name: string;
  value: number;
  color: string;
};

type TopPage = {
  path: string;
  views: number;
  growth: string;
};

type RecentActivity = {
  id: number;
  user: string;
  action: string;
  target: string;
  path: string;
  time: string;
};

type TrafficResponse = {
  pulse?: TrafficPoint[];
  sources?: TrafficSource[];
  topPages?: TopPage[];
  recentActivity?: RecentActivity[];
  activeNow?: number;
  isReal?: boolean;
  error?: string;
};

type PostHogConfig = {
  POSTHOG_PROJECT_ID: string;
  POSTHOG_PROJECT_KEY: string;
  POSTHOG_API_KEY: string;
  POSTHOG_HOST: string;
};

interface CRMAnalyticsProps {
  tickets: SupportTicket[];
  customers: CRMCustomer[];
  refunds: RefundRecord[];
  orders: CRMOrder[];
}

const DEFAULT_CONFIG: PostHogConfig = {
  POSTHOG_PROJECT_ID: '',
  POSTHOG_PROJECT_KEY: '',
  POSTHOG_API_KEY: '',
  POSTHOG_HOST: 'https://eu.i.posthog.com',
};

const DEFAULT_TRAFFIC_DATA: Required<TrafficResponse> = {
  pulse: [],
  sources: [],
  topPages: [],
  recentActivity: [],
  activeNow: 0,
  isReal: false,
  error: '',
};

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
      <p className="max-w-xs text-xs font-semibold uppercase tracking-widest text-slate-400">
        {message}
      </p>
    </div>
  );
}

export function CRMAnalytics({ tickets, customers, refunds, orders }: CRMAnalyticsProps) {
  const [trafficData, setTrafficData] = useState<TrafficResponse>(DEFAULT_TRAFFIC_DATA);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<PostHogConfig>(DEFAULT_CONFIG);

  const safeTrafficData = {
    pulse: trafficData.pulse ?? [],
    sources: trafficData.sources ?? [],
    topPages: trafficData.topPages ?? [],
    recentActivity: trafficData.recentActivity ?? [],
    activeNow: trafficData.activeNow ?? 0,
    isReal: trafficData.isReal ?? false,
    error: trafficData.error ?? '',
  };

  const fetchTraffic = async () => {
    try {
      const response = await fetch('/api/admin/intelligence/traffic', { cache: 'no-store' });
      const data = (await response.json()) as TrafficResponse;
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load PostHog analytics.');
      }

      setTrafficData(data);
      setLastSynced(new Date());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load traffic stats.';
      setTrafficData((current) => ({
        ...current,
        pulse: [],
        sources: [],
        topPages: [],
        recentActivity: [],
        activeNow: 0,
        isReal: false,
        error: message,
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadConfig = async () => {
      const result = await getIntegrationsAction();

      if (!isMounted || !result.success || !result.data) {
        return;
      }

      setConfig({
        POSTHOG_PROJECT_ID: result.data.POSTHOG_PROJECT_ID || '',
        POSTHOG_PROJECT_KEY: result.data.POSTHOG_PROJECT_KEY || '',
        POSTHOG_API_KEY: '',
        POSTHOG_HOST: result.data.POSTHOG_HOST || DEFAULT_CONFIG.POSTHOG_HOST,
      });
    };

    fetchTraffic();
    void loadConfig();

    const interval = window.setInterval(() => {
      void fetchTraffic();
    }, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const handleSaveConfig = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const updates = Object.entries(config).reduce<Record<string, string>>((accumulator, [key, value]) => {
      const sanitizedValue = value.trim();
      if (sanitizedValue.length > 0) {
        accumulator[key] = sanitizedValue;
      }
      return accumulator;
    }, {});

    if (Object.keys(updates).length === 0) {
      toast.info('Add your PostHog details before saving.');
      return;
    }

    setSaving(true);

    try {
      const result = await saveIntegrationAction(updates);

      if (!result.success) {
        throw new Error(result.message);
      }

      const refreshedConfig = await getIntegrationsAction();
      if (refreshedConfig.success && refreshedConfig.data) {
        setConfig({
          POSTHOG_PROJECT_ID: refreshedConfig.data.POSTHOG_PROJECT_ID || '',
          POSTHOG_PROJECT_KEY: refreshedConfig.data.POSTHOG_PROJECT_KEY || '',
          POSTHOG_API_KEY: '',
          POSTHOG_HOST: refreshedConfig.data.POSTHOG_HOST || DEFAULT_CONFIG.POSTHOG_HOST,
        });
      }

      toast.success('PostHog settings saved securely.');
      setIsSettingsOpen(false);
      await fetchTraffic();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save PostHog settings.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => [
    { name: 'Total Clients', value: customers.length.toString(), icon: Users, change: '+12%', changeType: 'positive' as const },
    { name: 'Open Tickets', value: tickets.filter((ticket) => ticket.status === 'open').length.toString(), icon: MessageSquare, change: 'Active', changeType: 'positive' as const },
    { name: 'Pending Returns', value: refunds.filter((refund) => refund.status === 'Pending').length.toString(), icon: RefreshCcw, change: 'Queue', changeType: 'negative' as const },
    { name: 'Active Now', value: safeTrafficData.activeNow.toString(), icon: Activity, change: 'Real-time', changeType: 'positive' as const },
    { name: 'Growth Rate', value: '2.4%', icon: TrendingUp, change: 'Steady', changeType: 'positive' as const },
    { name: 'System Health', value: safeTrafficData.error ? 'Check Feed' : 'Optimal', icon: Package, change: safeTrafficData.error ? 'Attention' : 'Checked', changeType: safeTrafficData.error ? 'negative' as const : 'positive' as const },
  ], [customers.length, refunds, safeTrafficData.activeNow, safeTrafficData.error, tickets]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Intelligence Dashboard</h2>
            <div className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${
              safeTrafficData.isReal && !safeTrafficData.error 
                ? 'border-emerald-100 bg-emerald-50' 
                : 'border-amber-100 bg-amber-50'
            }`}>
              <div className={`h-1.5 w-1.5 rounded-full ${
                safeTrafficData.isReal && !safeTrafficData.error 
                  ? 'animate-pulse bg-emerald-500' 
                  : 'bg-amber-400'
              }`} />
              <span className={`text-[9px] font-black uppercase tracking-widest ${
                safeTrafficData.isReal && !safeTrafficData.error 
                  ? 'text-emerald-700' 
                  : 'text-amber-700'
              }`}>
                {safeTrafficData.isReal && !safeTrafficData.error ? 'Pure Real Mode' : 'Simulated Mode'}
              </span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="rounded p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900"
              title="Connect Real-time Data"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-500">Cross-platform traffic, engagement, and service metrics</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {!safeTrafficData.isReal && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 rounded bg-slate-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-slate-800"
            >
              <ShieldCheck className="h-3 w-3" />
              Activate Real Mode
            </button>
          )}
          <div className="flex items-center gap-2 rounded border border-slate-100 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-800 shadow-sm transition-all">
            <div className={`h-1.5 w-1.5 rounded-full ${safeTrafficData.isReal ? 'animate-pulse bg-emerald-500' : 'bg-amber-400'}`} />
            {safeTrafficData.isReal ? 'Live Signal Active' : 'Simulated Traffic Mode'}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Synced {Math.floor((new Date().getTime() - lastSynced.getTime()) / 60000)}m ago
            </span>
            <button
              onClick={() => {
                setLoading(true);
                void fetchTraffic();
              }}
              className="rounded p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900"
              title="Refresh Data"
            >
              <RefreshCcw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {!safeTrafficData.isReal && !safeTrafficData.error && (
        <div className="mb-6 flex items-start gap-3 rounded border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-amber-900 border-dashed">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-amber-700">Connect Real-Time Traffic Stream</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              You are currently viewing <strong>Demonstration Data</strong>. To see real visitors from Instagram, Google, and direct shop traffic, enter your 
              <strong> Personal API Key (phx_...)</strong> and <strong>Project ID (160056)</strong> in the Intelligence Settings (gear icon top right).
            </p>
          </div>
        </div>
      )}

      {safeTrafficData.error && (
        <div className="mb-6 flex items-start gap-3 rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-rose-700">PostHog Sync Error</p>
            <p className="mt-1 text-xs leading-relaxed text-rose-800">{safeTrafficData.error}</p>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in overflow-hidden rounded border border-slate-300 bg-white shadow-2xl fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-900">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Connect Real-time Data
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 p-6">
              <p className="mb-4 text-xs leading-relaxed text-slate-500">
                Connect your <strong>PostHog</strong> account to switch from demonstration mode to real-time traffic and page tracking. Your keys will be <strong>encrypted</strong> and saved securely.
              </p>

              <div className="space-y-1.5">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Project Token (Public Tracking Key)</label>
                <input
                  type="text"
                  value={config.POSTHOG_PROJECT_KEY}
                  onChange={(event) => setConfig((current) => ({ ...current, POSTHOG_PROJECT_KEY: event.target.value }))}
                  className="h-10 w-full rounded border border-slate-300 bg-slate-50 px-3 text-sm transition-all focus:border-slate-900 focus:outline-none"
                  placeholder="phc_..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Personal API Key (Private Query Key)</label>
                <input
                  type="password"
                  value={config.POSTHOG_API_KEY}
                  onChange={(event) => setConfig((current) => ({ ...current, POSTHOG_API_KEY: event.target.value }))}
                  className="h-10 w-full rounded border border-slate-300 bg-slate-50 px-3 text-sm transition-all focus:border-slate-900 focus:outline-none"
                  placeholder="phx_..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Project ID</label>
                <input
                  type="text"
                  value={config.POSTHOG_PROJECT_ID}
                  onChange={(event) => setConfig((current) => ({ ...current, POSTHOG_PROJECT_ID: event.target.value }))}
                  className="h-10 w-full rounded border border-slate-300 bg-slate-50 px-3 text-sm transition-all focus:border-slate-900 focus:outline-none"
                  placeholder="12345"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Host URL</label>
                <input
                  type="url"
                  value={config.POSTHOG_HOST}
                  onChange={(event) => setConfig((current) => ({ ...current, POSTHOG_HOST: event.target.value }))}
                  className="h-10 w-full rounded border border-slate-300 bg-slate-50 px-3 text-sm transition-all focus:border-slate-900 focus:outline-none"
                  placeholder="https://eu.i.posthog.com"
                  required
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <a
                  href="https://eu.posthog.com/settings/project"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900"
                >
                  Get Keys <ExternalLink className="h-3 w-3" />
                </a>
                <button
                  disabled={saving}
                  className="h-10 rounded bg-slate-900 px-6 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Activate Real Mode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="rounded border border-slate-300 bg-white p-6 sm:p-8 lg:col-span-2">
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900">
                <Activity className="h-4 w-4 text-slate-400" />
                Traffic Pulse
              </h3>
              <p className="mt-1 text-xs text-slate-500">Real-time website hits over the last 24 hours</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tracking-tight text-slate-900">{safeTrafficData.activeNow}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Sessions</p>
            </div>
          </div>

          <StableChartContainer className="h-[350px] w-full" minHeight={350}>
            {safeTrafficData.pulse.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={200}>
                <AreaChart data={safeTrafficData.pulse} margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                  <defs>
                    <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.05} />
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
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
                      if (active && payload && payload.length > 0) {
                        return (
                          <div className="min-w-[140px] rounded border border-slate-300 bg-white p-4 shadow-xl">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
                            <div className="space-y-1">
                              {payload.map((entry) => (
                                <div key={entry.name} className="flex items-center justify-between gap-4">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{entry.name}</span>
                                  <span className="text-sm font-bold text-slate-900">{entry.value}</span>
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
                    animationDuration={1500}
                    stackId="1"
                  />
                  <Area
                    type="monotone"
                    dataKey="unique"
                    name="Unique Users"
                    stroke="#334155"
                    fill="transparent"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyPanel message={loading ? 'Loading PostHog traffic data' : 'No traffic pulse available yet'} />
            )}
          </StableChartContainer>
        </div>

        <div className="rounded border border-slate-300 bg-white p-6 sm:p-8">
          <div className="mb-8">
            <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900">
              <Package className="h-4 w-4 text-slate-400" />
              Efficiency & Performance
            </h3>
            <p className="mt-1 text-xs text-slate-500">Business health and conversion logistics</p>
          </div>

          <div className="space-y-10">
            {/* Sell Rate / Sales Conversion */}
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Purchase Conversions</p>
                  <p className="text-2xl font-bold text-slate-900">{orders.length} <span className="text-sm font-medium text-slate-400">Orders</span></p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {safeTrafficData.pulse.reduce((a, b) => a + b.visits, 0) > 0 
                      ? ((orders.length / safeTrafficData.pulse.reduce((a, b) => a + b.visits, 0)) * 100).toFixed(2)
                      : '0.00'}%
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Sell Rate (vs Traffic)</p>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 p-0.5 shadow-inner">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 shadow-sm transition-all duration-1000"
                  style={{ width: `${Math.min(100, (orders.length / Math.max(1, safeTrafficData.pulse.reduce((a, b) => a + b.visits, 0) / 10)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Refund Rate */}
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logistics & Returns</p>
                  <p className="text-2xl font-bold text-slate-900">{refunds.length} <span className="text-sm font-medium text-slate-400">Returns</span></p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-rose-500">
                    {orders.length > 0 ? ((refunds.length / orders.length) * 100).toFixed(1) : '0.0'}%
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-rose-400">Return Rate</p>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 p-0.5 shadow-inner">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-500 shadow-sm transition-all duration-1000"
                  style={{ width: `${Math.min(100, (refunds.length / Math.max(1, orders.length)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Success Rate</p>
                <p className="text-sm font-bold text-emerald-600">
                  {orders.length > 0 ? (100 - (refunds.length / orders.length) * 100).toFixed(1) : '100'}%
                </p>
              </div>
              <div className="border-l border-slate-200 text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Churn Risk</p>
                <p className="text-sm font-bold text-amber-600">Low</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded border border-slate-300 bg-white">
          <div className="border-b border-slate-300 bg-slate-50/50 px-6 py-4">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-900">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Top Performing Content
            </h3>
          </div>
          {safeTrafficData.topPages.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-300 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <th className="px-6 py-3">Path / Product</th>
                    <th className="px-6 py-3">Views</th>
                    <th className="px-6 py-3 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {safeTrafficData.topPages.map((page) => (
                    <tr key={page.path} className="group transition-colors hover:bg-slate-50">
                      <td className="px-6 py-3">
                        <span className="block max-w-[200px] truncate text-xs font-bold text-slate-900">{page.path}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-xs font-bold text-slate-500">{page.views.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${page.growth.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {page.growth}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6">
              <EmptyPanel message="Top content will appear here when PostHog page rankings are available" />
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded border border-slate-300 bg-white">
          <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50/50 px-6 py-4">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-900">
              <Globe className="h-4 w-4 text-slate-400" />
              Traffic Sources (Channels)
            </h3>
            <span className="flex items-center gap-1.5 rounded border border-blue-100 bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-blue-600">
              Active Stream
            </span>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {safeTrafficData.sources.length > 0 ? (
                safeTrafficData.sources.map((source) => (
                  <div key={source.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{source.name}</span>
                      <span className="text-xs font-bold text-slate-900">{source.value}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div 
                        className="h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${source.value}%`, backgroundColor: source.color }} 
                      />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyPanel message="Waiting for channel source signals..." />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
