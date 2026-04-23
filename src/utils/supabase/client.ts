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

export function createClient(customUrl?: string, customKey?: string) {
  const url = customUrl || supabaseUrl;
  const key = customKey || supabaseAnonKey;

  // Check globalThis first for persistence across HMR
  // Only use singleton if no custom overrides are provided
  if (typeof window === 'undefined') {
    return createBrowserClient(url, key);
  }

  // In development, Next.js refreshes frequently. We use a singleton
  // BUT we must bypass it if a custom URL is requested (like for branded auth)
  if (!customUrl && typeof window !== 'undefined' && globalThis.__supabase_client) {
    return globalThis.__supabase_client;
  }

  const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  const client = createBrowserClient(
    url,
    key,
    {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'vinthem-auth-token',
        cookieOptions: {
          path: '/',
          sameSite: 'lax',
          secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
        }
      },
    }
  );

  // Store in globalThis for the next call if no custom overrides
  if (typeof window !== 'undefined' && !customUrl) {
    globalThis.__supabase_client = client;
  }

  return client;
}
