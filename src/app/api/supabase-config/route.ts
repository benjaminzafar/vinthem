import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/env';

export async function GET() {
  const url = getEnv('SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL') || '';
  const anonKey = getEnv('SUPABASE_PUBLISHABLE_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || '';

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
