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
import type { CRMCustomer, RefundRecord, SupportTicket } from './types';
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

export function CRMAnalytics({ tickets, customers, refunds }: CRMAnalyticsProps) {
  const [trafficData, setTrafficData] = useState<TrafficResponse>(DEFAULT_TRAFFIC_DATA);
  const [loading, setLoading] = useState(true);
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
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Intelligence Dashboard</h2>
            {safeTrafficData.isReal && !safeTrafficData.error && (
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Pure Real Mode</span>
              </div>
            )}
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
          <div className="flex items-center gap-2 rounded border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {loading ? 'Checking Traffic Feed' : 'Live Traffic Monitoring Active'}
          </div>
        </div>
      </div>

      {safeTrafficData.error && (
        <div className="flex items-start gap-3 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest">PostHog needs attention</p>
            <p className="mt-1 text-xs leading-relaxed">{safeTrafficData.error}</p>
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
                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Project API Key (Public)</label>
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
                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Personal API Key (Private)</label>
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

          <StableChartContainer className="h-[350px] w-full">
            {safeTrafficData.pulse.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={100}>
                <AreaChart data={safeTrafficData.pulse} margin={{ top: 10, right: -5, bottom: 0, left: -15 }}>
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
              <Globe className="h-4 w-4 text-slate-400" />
              Source Origins
            </h3>
            <p className="mt-1 text-xs text-slate-500">Top acquisition channels</p>
          </div>

          <StableChartContainer className="h-[350px] w-full">
            {safeTrafficData.sources.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={100}>
                <BarChart data={safeTrafficData.sources} layout="vertical" margin={{ left: -20, right: 30 }}>
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
                          <div className="rounded bg-slate-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white">
                            {payload[0].value}% Volume
                          </div>
                        );
                      }

                      return null;
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                    {safeTrafficData.sources.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyPanel message={loading ? 'Loading traffic sources' : 'No source breakdown available yet'} />
            )}
          </StableChartContainer>

          {safeTrafficData.sources.length > 0 && (
            <div className="mt-8 space-y-4">
              {safeTrafficData.sources.map((source) => (
                <div key={source.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: source.color }} />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{source.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">{source.value}%</span>
                </div>
              ))}
            </div>
          )}
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
              <Target className="h-4 w-4 text-slate-400" />
              Live Activity Stream
            </h3>
            <span className="flex items-center gap-1.5 rounded border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Active
            </span>
          </div>
          {safeTrafficData.recentActivity.length > 0 ? (
            <>
              <div className="divide-y divide-slate-100">
                {safeTrafficData.recentActivity.map((activity) => (
                  <div key={activity.id} className="group flex items-start justify-between px-6 py-4 transition-all hover:bg-slate-50">
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-900 transition-all group-hover:border-slate-300">
                        {activity.user.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs text-slate-900">
                          <span className="font-bold">{activity.user}</span>{' '}
                          <span className="text-slate-500">{activity.action}</span>{' '}
                          <span className="font-bold text-slate-900">{activity.target}</span>
                        </p>
                        <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 opacity-60">
                          {activity.path}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 opacity-60">{activity.time}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 bg-slate-50/50 p-4 text-center">
                <button className="text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-all hover:text-slate-900">
                  View All Activity Logs
                </button>
              </div>
            </>
          ) : (
            <div className="p-6">
              <EmptyPanel message="Live activity will stream here once behavioral events are available" />
            </div>
          )}
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
