import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
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
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      try {
        await ensureUserProfile(data.user, data.user.user_metadata?.full_name);
        
        // Check if user has already accepted terms
        const admin = createAdminClient();
        const { data: profile } = await admin
          .from('users')
          .select('accepted_terms_at')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!profile?.accepted_terms_at) {
          return NextResponse.redirect(`${origin}/auth/consent?next=${next}`);
        }
      } catch (profileError) {
        console.error('[Auth Callback] Profile sync skipped:', profileError);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=oauth`);
}
