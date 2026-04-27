import { createBrowserClient } from '@supabase/ssr';

/**
 * Sticky Singleton Supabase Client with Runtime Configuration Support
 */

function getSafeEnv(key: string): string | undefined {
  // 1. Try globalThis (Persisted by StoreHydrator from Server)
  const g = globalThis as any;
  if (key === 'NEXT_PUBLIC_SUPABASE_URL' && g.__supabase_url) return g.__supabase_url;
  if (key === 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' && g.__supabase_key) return g.__supabase_key;

  // 2. Try standard process.env (Build-time)
  let value = process.env[key] || (process.env as any)[`NEXT_PUBLIC_${key}`];
  
  if (!value) return undefined;

  // Fix common mistake: "NAME=VALUE"
  if (value.includes('=')) {
    const parts = value.split('=');
    if (parts[0].trim() === key || parts[0].trim().includes('SUPABASE')) {
      value = parts.slice(1).join('=').trim();
    }
  }

  return value;
}

const supabaseUrl = getSafeEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getSafeEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');

declare global {
  var __supabase_client: ReturnType<typeof createBrowserClient> | undefined;
}

export function createClient(customUrl?: string, customKey?: string) {
  const url = customUrl || getSafeEnv('NEXT_PUBLIC_SUPABASE_URL') || supabaseUrl;
  const key = customKey || getSafeEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || supabaseAnonKey;

  if (typeof window !== 'undefined' && globalThis.__supabase_client) {
    return globalThis.__supabase_client;
  }

  if (!url || !key || !url.startsWith('http')) {
    // If we're on the server or don't have config yet, return a temporary client
    // StoreHydrator will trigger a re-render once config is available
    return createBrowserClient(url || 'https://missing.supabase.co', key || 'missing');
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

  if (typeof window !== 'undefined') {
    globalThis.__supabase_client = client;
  }

  return client;
}
