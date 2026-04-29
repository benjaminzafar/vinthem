import type { SupabaseClient } from '@supabase/supabase-js';

type LogoutOptions = {
  supabase: SupabaseClient;
  redirectTo: string;
};

export async function performClientLogout({ supabase, redirectTo }: LogoutOptions) {
  let firstError: Error | null = null;

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  } catch (error) {
    firstError = error instanceof Error ? error : new Error('Client sign-out failed.');
  }

  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    });
  } catch (error) {
    if (!firstError) {
      firstError = error instanceof Error ? error : new Error('Server sign-out failed.');
    }
  }

  window.location.assign(redirectTo);

  if (firstError) {
    throw firstError;
  }
}
