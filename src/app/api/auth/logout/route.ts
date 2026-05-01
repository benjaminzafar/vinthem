import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Sign out on the server
    // This will trigger the setAll in the server client, clearing cookies via cookieStore.set
    await supabase.auth.signOut();

    // 2. Return a success response
    // The cookies cleared by signOut should be included in the response headers 
    // because createClient uses the Next.js cookies() API.
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Logout API Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to sign out' }, { status: 500 });
  }
}

