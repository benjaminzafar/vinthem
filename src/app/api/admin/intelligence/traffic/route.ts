import { NextResponse } from 'next/server';

interface SourcePayload {
  name: string;
  value: number;
  color: string;
}

interface PageSummary {
  path: string;
  visits: number;
  growth: string;
}

interface PulsePoint {
  name: string;
  visits: number;
  unique: number;
}

interface RecentActivity {
  id: number;
  user: string;
  action: string;
  target: string;
  path: string;
  time: string;
}

interface TrafficPayload {
  pulse: PulsePoint[];
  sources: SourcePayload[];
  topPages: PageSummary[];
  recentActivity: RecentActivity[];
  activeNow: number;
  isReal: boolean;
}

// Simulated data generator for the dashboard
export async function GET() {
  const simulatedPulse: PulsePoint[] = [
    { name: '00:00', visits: 12, unique: 8 },
    { name: '04:00', visits: 5, unique: 3 },
    { name: '08:00', visits: 45, unique: 31 },
    { name: '12:00', visits: 89, unique: 62 },
    { name: '16:00', visits: 120, unique: 88 },
    { name: '20:00', visits: 65, unique: 45 },
    { name: '23:59', visits: 34, unique: 21 },
  ];

  const simulatedSources: SourcePayload[] = [
    { name: 'Direct', value: 45, color: '#0F172A' },
    { name: 'Google', value: 32, color: '#475569' },
    { name: 'Instagram', value: 15, color: '#94A3B8' },
    { name: 'Others', value: 8, color: '#E2E8F0' },
  ];

  const simulatedPages: PageSummary[] = [
    { path: '/', visits: 1450, growth: '+12%' },
    { path: '/products', visits: 890, growth: '+5%' },
    { path: '/cart', visits: 450, growth: '-2%' },
    { path: '/checkout', visits: 120, growth: '+18%' },
  ];

  const simulatedActivity: RecentActivity[] = [
    { id: 1, user: 'User #892', action: 'added to cart', target: 'Oak Chair', path: '/products/oak-chair', time: '2m' },
    { id: 2, user: 'User #121', action: 'viewed', target: 'Modern Vase', path: '/products/modern-vase', time: '5m' },
  ];

  return NextResponse.json({
    pulse: simulatedPulse,
    sources: simulatedSources,
    topPages: simulatedPages,
    recentActivity: simulatedActivity,
    activeNow: 12,
    isReal: false, // PostHog removed
  } satisfies TrafficPayload);
}
