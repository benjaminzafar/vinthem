import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin';
import { fetchAdminOverviewStats } from '@/lib/admin-overview';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    await requireAdminUser();
    const stats = await fetchAdminOverviewStats();
    return NextResponse.json(stats);
  } catch (error) {
    logger.error('[Admin Overview API] Failed to load overview stats', error);
    return NextResponse.json(
      { error: 'Failed to load overview stats.' },
      { status: 500 },
    );
  }
}
