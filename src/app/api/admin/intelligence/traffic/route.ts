import { NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/server';
import {
  maybeDecryptStoredValue,
  normalizePostHogAppHost,
} from '@/lib/integrations';

type IntegrationRow = {
  key: string;
  value: string;
};

type PostHogSeries = {
  action?: {
    name?: string;
  };
  breakdown_value?: string | null;
  count?: number | string;
  data?: Array<number | string | null>;
  labels?: Array<string | null>;
};

type PulsePoint = {
  name: string;
  visits: number;
  unique: number;
};

type TrafficSource = {
  name: string;
  value: number;
  color: string;
};

type PageSummary = {
  path: string;
  views: number;
  growth: string;
};

type ActivityItem = {
  id: number;
  user: string;
  action: string;
  target: string;
  path: string;
  time: string;
};

type TrafficPayload = {
  pulse: PulsePoint[];
  sources: TrafficSource[];
  topPages: PageSummary[];
  recentActivity: ActivityItem[];
  activeNow: number;
  isReal: boolean;
  error?: string;
};

const SOURCE_COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8'];

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function extractSeries(payload: unknown): PostHogSeries[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const typedPayload = payload as {
    results?: unknown;
    result?: unknown;
    query?: { results?: unknown; result?: unknown };
  };

  const candidates = [
    typedPayload.results,
    typedPayload.result,
    typedPayload.query?.results,
    typedPayload.query?.result,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as PostHogSeries[];
    }
  }

  return [];
}

function buildPulse(results: PostHogSeries[]): PulsePoint[] {
  const seriesLength = results.reduce((maxLength, series) => {
    return Math.max(maxLength, series.data?.length ?? 0);
  }, 0);

  return Array.from({ length: seriesLength }).map((_, index) => {
    const defaultLabel = `${index}:00`;

    return results.reduce<PulsePoint>(
      (accumulator, series) => {
        const label = series.labels?.[index];
        if (typeof label === 'string' && label.trim().length > 0) {
          accumulator.name = label;
        }

        const value = toNumber(series.data?.[index]);
        if (series.action?.name === 'Pageviews') {
          accumulator.visits += value;
        }

        if (series.action?.name === 'Unique Users') {
          accumulator.unique += value;
        }

        return accumulator;
      },
      { name: defaultLabel, visits: 0, unique: 0 }
    );
  });
}

function buildSources(results: PostHogSeries[]): TrafficSource[] {
  const sourceTotals = new Map<string, number>();

  for (const series of results) {
    if (series.action?.name !== 'Pageviews') {
      continue;
    }

    const key = series.breakdown_value && series.breakdown_value !== 'null'
      ? series.breakdown_value
      : 'Direct';

    const total = (series.data ?? []).reduce<number>((sum, value) => sum + toNumber(value), 0);
    sourceTotals.set(key, (sourceTotals.get(key) ?? 0) + total);
  }

  const totalVisits = Array.from(sourceTotals.values()).reduce((sum, value) => sum + value, 0);

  return Array.from(sourceTotals.entries())
    .map(([name, count], index) => ({
      name,
      value: totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0,
      color: SOURCE_COLORS[index % SOURCE_COLORS.length],
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 4);
}

function buildEmptyRealPayload(error: string): TrafficPayload {
  return {
    pulse: [],
    sources: [],
    topPages: [],
    recentActivity: [],
    activeNow: 0,
    isReal: true,
    error,
  };
}

function getMockTrafficData(): TrafficPayload {
  const hours = Array.from({ length: 24 }, (_, index) => {
    const hour = (new Date().getHours() - (23 - index) + 24) % 24;
    return `${hour}:00`;
  });

  const products = [
    { name: 'Minimalist Oak Chair', path: '/product/oak-chair' },
    { name: 'Ceramic Vase Set', path: '/product/ceramic-vases' },
    { name: 'Linen Pillow Case', path: '/product/linen-pillows' },
    { name: 'Wool Throw Blanket', path: '/product/wool-throw' },
    { name: 'Canvas Wall Art', path: '/product/wall-art' },
  ];

  const recentNames = ['Someone', 'A guest', 'Returning client', 'User'];

  return {
    pulse: hours.map((hour) => ({
      name: hour,
      visits: Math.floor(Math.random() * 50) + 10,
      unique: Math.floor(Math.random() * 30) + 5,
    })),
    sources: [
      { name: 'Direct', value: 45, color: '#0f172a' },
      { name: 'Google', value: 30, color: '#334155' },
      { name: 'Instagram', value: 15, color: '#64748b' },
      { name: 'Other', value: 10, color: '#94a3b8' },
    ],
    topPages: [
      { path: '/product/minimalist-desk', views: 842, growth: '+15%' },
      { path: '/product/terrazzo-lamp', views: 654, growth: '+8%' },
      { path: '/collection/new-arrivals', views: 432, growth: '+22%' },
      { path: '/product/scandinavian-rug', views: 321, growth: '-2%' },
      { path: '/blog/interior-trends-2026', views: 189, growth: '+10%' },
    ],
    recentActivity: Array.from({ length: 6 }, (_, index) => {
      const product = products[Math.floor(Math.random() * products.length)];

      return {
        id: index,
        user: recentNames[Math.floor(Math.random() * recentNames.length)],
        action: 'viewed',
        target: product.name,
        path: product.path,
        time: `${index + 1}m ago`,
      };
    }),
    activeNow: Math.floor(Math.random() * 14) + 5,
    isReal: false,
  };
}

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.from('integrations').select('key, value');

  const config = (data ?? []).reduce<Record<string, string>>((accumulator, row) => {
    const integration = row as IntegrationRow;
    accumulator[integration.key.toUpperCase()] = integration.value;
    return accumulator;
  }, {});

  const apiKey = maybeDecryptStoredValue(config.POSTHOG_API_KEY);
  const projectId = maybeDecryptStoredValue(config.POSTHOG_PROJECT_ID);
  const host = normalizePostHogAppHost(config.POSTHOG_HOST);

  if (!apiKey || !projectId) {
    return NextResponse.json(getMockTrafficData());
  }

  try {
    // We perform TWO queries in parallel:
    // 1. Total traffic baseline (to ensure Pulse charts always have data)
    // 2. Referrer breakdown (for the Sources pie chart)
    const [totalRes, breakdownRes] = await Promise.all([
      fetch(`${host}/api/projects/${projectId}/query/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: {
            kind: 'InsightVizNode',
            source: {
              kind: 'TrendsQuery',
              series: [
                { kind: 'EventsNode', event: '$pageview', name: 'Pageviews', math: 'total' },
                { kind: 'EventsNode', event: '$pageview', name: 'Unique Users', math: 'dau' },
              ],
              dateRange: { date_from: '-24h' },
              interval: 'hour',
            },
          },
        }),
        cache: 'no-store',
      }),
      fetch(`${host}/api/projects/${projectId}/query/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: {
            kind: 'InsightVizNode',
            source: {
              kind: 'TrendsQuery',
              series: [{ kind: 'EventsNode', event: '$pageview', name: 'Pageviews', math: 'total' }],
              dateRange: { date_from: '-24h' },
              interval: 'hour',
              breakdownFilter: { breakdown: '$initial_referrer', breakdown_type: 'event' },
            },
          },
        }),
        cache: 'no-store',
      }),
    ]);

    if (!totalRes.ok) {
      const errorText = await totalRes.text();
      return NextResponse.json(buildEmptyRealPayload(`PostHog query failed (${totalRes.status}). ${errorText.slice(0, 160)}`));
    }

    const [totalPayload, breakdownPayload] = await Promise.all([
      totalRes.json(),
      breakdownRes.ok ? breakdownRes.json() : Promise.resolve({ results: [] })
    ]);

    const totalResults = extractSeries(totalPayload);
    const breakdownResults = extractSeries(breakdownPayload);

    if (totalResults.length === 0 && breakdownResults.length === 0) {
      return NextResponse.json(buildEmptyRealPayload('PostHog returned no usable chart series.'));
    }

    const pulse = buildPulse(totalResults);
    const sources = buildSources(breakdownResults);

    return NextResponse.json({
      pulse,
      sources,
      topPages: [],
      recentActivity: [],
      activeNow: pulse[pulse.length - 1]?.visits ?? 0,
      isReal: true,
    } satisfies TrafficPayload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown PostHog error';
    console.error('Real-mode fetch failed:', error);
    return NextResponse.json(buildEmptyRealPayload(message));
  }
}
