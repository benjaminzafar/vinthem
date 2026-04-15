import { NextRequest, NextResponse } from 'next/server';
import { requireAdminBearerUser } from '@/lib/admin';

export async function GET(req: NextRequest) {
  try {
    const { supabase } = await requireAdminBearerUser(req.headers.get('Authorization'));
    const { data, error } = await supabase.from('integrations').select('key');

    if (error) throw error;

    // Return a map of keys that are "Connected"
    const config: Record<string, string> = {};
    data?.forEach((row: { key: string }) => {
      config[row.key] = '********'; // Masked value or just a truthy placeholder
      config[`${row.key}_CONNECTED`] = 'true';
    });

    return NextResponse.json(config);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Integrations GET error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
