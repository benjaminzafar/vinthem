import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn(
                'Supabase cookie propagation was skipped because cookies cannot be mutated in this server context.',
                error
              );
            }
          }
        },
      },
    }
  );
}

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    if (process.env.NODE_ENV === 'production') {
      console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing. Admin features and settings hydration will fail.');
    }
    // Return a dummy client that will fail gracefully on calls instead of crashing the whole server
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      'missing-key',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
