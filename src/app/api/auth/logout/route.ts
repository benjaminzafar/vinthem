import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Sign out on the server (clears cookies)
    await supabase.auth.signOut();

    // 2. Clear server-side cache
    const origin = new URL(request.url).origin;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Logout API Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to sign out' }, { status: 500 });
  }
}
