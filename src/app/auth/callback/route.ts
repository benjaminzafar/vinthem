import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Ensure user row exists in users table
      await supabase.from('users').upsert({
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || '',
        role: data.user.email === 'benjaminzafar10@gmail.com' ? 'admin' : 'client',
      }, { onConflict: 'id', ignoreDuplicates: true });

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=oauth`);
}
