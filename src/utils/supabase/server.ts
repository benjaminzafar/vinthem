import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

export async function createClient() {
  const url = getEnv('SUPABASE_URL');
  const key = getEnv('SUPABASE_PUBLISHABLE_KEY');

  if (!url || !key) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('Supabase client failed: SUPABASE_URL or PUBLISHABLE_KEY is missing.');
    }
    return createServerClient('https://missing.supabase.co', 'missing', { 
      cookies: { getAll() { return [] }, setAll() {} } 
    });
  }

  const cookieStore = await cookies();

  return createServerClient(
    url,
    key,
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
            // Safe to ignore
          }
        },
      },
    }
  );
}

export function createAdminClient() {
  const url = getEnv('SUPABASE_URL');
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!url || !serviceRoleKey) {
    return createSupabaseClient(
      url || 'https://missing.supabase.co',
      'missing-key',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }

  return createSupabaseClient(
    url,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
