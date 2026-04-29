import { NextResponse } from 'next/server';
import { getBrowserSupabaseConfig } from '@/lib/supabase-browser-config';

export async function GET() {
  const { url, anonKey } = getBrowserSupabaseConfig();

  if (!url || !anonKey) {
    return NextResponse.json(
      { error: 'Supabase browser configuration is missing.' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }

  return NextResponse.json(
    { url, anonKey },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
