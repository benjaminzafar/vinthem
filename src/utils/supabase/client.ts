import { createBrowserClient } from '@supabase/ssr';

/**
 * Sticky Singleton Supabase Client with Hardened Safety
 */

function getSafeEnv(key: string): string | undefined {
  let value = process.env[key] || (process.env as any)[`NEXT_PUBLIC_${key}`];
  
  if (!value) return undefined;

  // Fix common mistake: "NAME=VALUE" instead of just "VALUE"
  if (value.includes('=')) {
    const parts = value.split('=');
    // If the part before = is the key name, take the part after
    if (parts[0].trim() === key || parts[0].trim().includes('SUPABASE')) {
      value = parts.slice(1).join('=').trim();
    }
  }

  return value;
}

const supabaseUrl = getSafeEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getSafeEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');

// Define the global type for our singleton
declare global {
  var __supabase_client: ReturnType<typeof createBrowserClient> | undefined;
}

export function createClient(customUrl?: string, customKey?: string) {
  const url = customUrl || supabaseUrl;
  const key = customKey || supabaseAnonKey;

  // Check globalThis first for persistence across HMR
  if (typeof window !== 'undefined' && globalThis.__supabase_client) {
    return globalThis.__supabase_client;
  }

  if (!url || !key || !url.startsWith('http')) {
    console.warn('Supabase Client: Missing or invalid URL/Key. Client-side features will be limited.');
    // Return a dummy client that won't crash the app
    return createBrowserClient('https://missing.supabase.co', 'missing');
  }

  const client = createBrowserClient(
    url,
    key,
    {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );

  // Store in globalThis for the next call
  if (typeof window !== 'undefined') {
    globalThis.__supabase_client = client;
  }

  return client;
}
