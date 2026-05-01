import { NextResponse } from 'next/server';
import { getBrowserSupabaseConfig } from '@/lib/supabase-browser-config';

export async function GET() {
  const { url, anonKey } = getBrowserSupabaseConfig();

  if (!url || !anonKey) {
    return NextResponse.json(
      {
        success: false,
        error: 'Supabase browser configuration is missing.'
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }

  return NextResponse.json(
    {
      success: true,
      url,
      anonKey
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
