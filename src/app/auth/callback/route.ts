import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ensureUserProfile } from '@/lib/admin';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';
  
  // Robust origin detection for production environments
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const host = request.headers.get('host') || requestUrl.host;
  const origin = `${proto}://${host}`;

  if (code) {
    // CRITICAL: We must use the branded domain for the server client too
    // so it looks for the correct branded cookies!
    const brandedUrl = 'https://auth.vinthem.com';
    const isProd = host.includes('vinthem.com');
    
    const supabase = await createClient();
    
    // If we are in production, we MUST swap the technical URL for the branded one
    // to match the cookies created by AuthClient.tsx
    if (isProd && (supabase as any).supabaseUrl) {
      (supabase as any).supabaseUrl = brandedUrl;
    }

    // Attempt to exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      try {
        await ensureUserProfile(data.user, data.user.user_metadata?.full_name);
      } catch (profileError) {
        console.error('[Auth Callback] Profile sync skipped:', profileError);
      }

      const redirectResponse = NextResponse.redirect(`${origin}${next}`);
      return redirectResponse;
    } else {
      console.error('[Auth Callback] Exchange Error:', error?.message);
    }
  }

  // If something went wrong, redirect to auth with an error
  return NextResponse.redirect(`${origin}/auth?error=oauth_callback_failed`);
}
