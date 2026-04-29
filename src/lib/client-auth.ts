import type { SupabaseClient } from '@supabase/supabase-js';

type LogoutOptions = {
  supabase: SupabaseClient;
  redirectTo: string;
};

export async function performClientLogout({ supabase, redirectTo }: LogoutOptions) {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    });
  } finally {
    await supabase.auth.signOut();
    window.location.assign(redirectTo);
  }
}
