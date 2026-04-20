import { createBrowserClient } from '@supabase/ssr';

/**
 * Sticky Singleton Supabase Client
 * 
 * In development, Next.js refreshes the bundle frequently (HMR).
 * This can lead to multiple Supabase clients competing for the same
 * browser auth lock, causing "Lock broken" or "Lock stolen" errors.
 * 
 * We use `globalThis` to ensure only one client exists per browser window,
 * even after hot reloads.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Define the global type for our singleton
declare global {
  var __supabase_client: ReturnType<typeof createBrowserClient> | undefined;
}

export function createClient() {
  // Check globalThis first for persistence across HMR
  if (typeof window === 'undefined') {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  if (typeof window !== 'undefined' && globalThis.__supabase_client) {
    return globalThis.__supabase_client;
  }

  const client = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Stability Hardening: Prevent "Lock broken" AbortError
        lockAcquireTimeout: 10000, 
        lockRetryDelay: 50,         
      },
    }
  );

  // Store in globalThis for the next call
  if (typeof window !== 'undefined') {
    globalThis.__supabase_client = client;
  }

  return client;
}
