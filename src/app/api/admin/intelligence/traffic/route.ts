import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { decrypt } from '@/lib/encryption';

const SOURCE_COLORS = ['#0F172A', '#475569', '#94A3B8', '#E2E8F0'];

interface PostHogSeries {
  action?: { name?: string };
  breakdown_value?: string;
  data?: (number | null)[];
}

interface SourcePayload {
  name: string;
  value: number;
  color: string;
}

interface PageSummary {
  path: string;
  visits: number;
}

interface PulsePoint {
  time: string;
  visits: number;
}

interface TrafficPayload {
  sources: SourcePayload[];
  pages: PageSummary[];
  pulse: PulsePoint[];
  totalVisits: number;
  activeNow: number;
  isReal: boolean;
}

const logger = {
  info: (msg: string, ...args: unknown[]) => {}, // Purged for production
  error: (msg: string, ...args: unknown[]) => console.error(`[TrafficAPI][ERROR] ${msg}`, ...args),
};

function toNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  return Number(val) || 0;
}

function buildEmptyRealPayload(message?: string): TrafficPayload {
  return {
    sources: [],
    pages: [],
    pulse: [],
    totalVisits: 0,
    activeNow: 0,
    isReal: true,
    ...(message ? { message } : {})
  } as TrafficPayload & { message?: string };
}

function buildSources(results: PostHogSeries[]): SourcePayload[] {
  const sourceTotals = new Map<string, number>();

  for (const series of results) {
    const seriesName = series.action?.name?.toLowerCase() || '';
    if (!seriesName.includes('pageview') && !seriesName.includes('$pageview')) {
      continue;
    }

    const rawValue = series.breakdown_value || '';
    let key = 'Direct Link';
    const lowerValue = rawValue.toLowerCase();

    // Normalize technical and null markers (case-insensitive) to human-readable 'Direct Link'
    if (
      rawValue && 
      lowerValue !== 'null' && 
      lowerValue !== 'undefined' && 
      !lowerValue.includes('posthog_breakdown_null') && 
      !lowerValue.includes('an_null_$$')
    ) {
      key = rawValue;
      
      // Secondary Human-friendliness cleanup
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('google')) key = 'Google Search';
      else if (lowerKey.includes('instagram')) key = 'Instagram';
      else if (lowerKey.includes('facebook')) key = 'Facebook';
      else if (lowerKey.includes('t.co')) key = 'Twitter/X';
      else if (lowerKey.includes('pinterest')) key = 'Pinterest';
      else if (lowerKey.includes('linkedin')) key = 'LinkedIn';
      else if (lowerKey.includes('youtube')) key = 'YouTube';
    }

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

function buildPages(results: PostHogSeries[]): PageSummary[] {
  const pages: PageSummary[] = [];

  for (const series of results) {
    const rawPath = String(series.breakdown_value || '/');
    
    // Clean up technical markers for paths
    if (
      !rawPath || 
      rawPath === 'null' || 
      rawPath === 'undefined' || 
      rawPath.includes('POSTHOG_BREAKDOWN_NULL') || 
      rawPath.includes('an_null_$$')
    ) {
      continue;
    }
    
    const count = (series.data ?? []).reduce<number>((sum, val) => sum + toNumber(val), 0);
    if (count > 0) {
      pages.push({ path: rawPath, visits: count });
    }
  }

  return pages
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);
}

function buildPulse(results: PostHogSeries[]): PulsePoint[] {
  const timeMap = new Map<string, number>();

  for (const series of results) {
    if (!series.data || !Array.isArray(series.data)) continue;
    
    series.data.forEach((val, i) => {
      const timeStr = `T-${24 - i}h`;
      timeMap.set(timeStr, (timeMap.get(timeStr) ?? 0) + toNumber(val));
    });
  }

  return Array.from(timeMap.entries()).map(([time, visits]) => ({ time, visits }));
}

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Fetch encrypted PostHog credentials from public.integrations
    const { data: integrations, error: fetchErr } = await supabase
      .from('integrations')
      .select('key, value')
      .in('key', ['POSTHOG_API_KEY', 'POSTHOG_HOST', 'POSTHOG_PROJECT_ID']);

    if (fetchErr || !integrations) throw new Error('Could not fetch PostHog integration settings.');

    const config = Object.fromEntries(integrations.map((i) => [i.key, i.value]));
    const apiKeyEnc = config['POSTHOG_API_KEY'];
    const host = config['POSTHOG_HOST'] || 'https://eu.i.posthog.com';
    const projectId = config['POSTHOG_PROJECT_ID'];

    if (!apiKeyEnc || !projectId) throw new Error('PostHog API key or Project ID missing.');

    const apiKey = decrypt(apiKeyEnc);

    // 2. Query PostHog Trends API
    // We fetch data from the last 24h, broken down by referrer ($initial_referrer) for sources 
    // and by path ($pathname) for pages.
    const queryUrl = `${host}/api/projects/${projectId}/insights/trend/?` + new URLSearchParams({
      insight: 'TRENDS',
      interval: 'hour',
      date_from: '-24h',
      display: 'ActionsLineGraph',
      events: JSON.stringify([{ id: '$pageview', math: 'dau' }]),
      breakdown: '$initial_referrer',
      breakdown_type: 'event'
    }).toString();

    const pagesQueryUrl = `${host}/api/projects/${projectId}/insights/trend/?` + new URLSearchParams({
      insight: 'TRENDS',
      interval: 'hour',
      date_from: '-24h',
      display: 'ActionsLineGraph',
      events: JSON.stringify([{ id: '$pageview', math: 'dau' }]),
      breakdown: '$pathname',
      breakdown_type: 'event'
    }).toString();

    const headers = { 'Authorization': `Bearer ${apiKey}` };
    const [sourcesRes, pagesRes] = await Promise.all([
      fetch(queryUrl, { headers }),
      fetch(pagesQueryUrl, { headers })
    ]);

    if (!sourcesRes.ok || !pagesRes.ok) {
      throw new Error(`PostHog API responded with error: ${sourcesRes.status} / ${pagesRes.status}`);
    }

    const sourcesData = await sourcesRes.json();
    const pagesData = await pagesRes.json();

    const results = (sourcesData.result || []) as PostHogSeries[];
    const pageResults = (pagesData.result || []) as PostHogSeries[];

    // 3. Transform data for our CRM Dashboard
    const sources = buildSources(results);
    const pages = buildPages(pageResults);
    const pulse = buildPulse(results);

    return NextResponse.json({
      sources,
      pages,
      pulse,
      totalVisits: Array.from(sources.values()).reduce((sum, s) => sum + s.value, 0),
      activeNow: pulse[pulse.length - 1]?.visits ?? 0,
      isReal: true,
    } satisfies TrafficPayload);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown PostHog error';
    logger.error('Real-mode fetch failed:', error);
    return NextResponse.json(buildEmptyRealPayload(message));
  }
}
