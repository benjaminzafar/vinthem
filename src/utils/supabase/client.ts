import { createBrowserClient } from '@supabase/ssr';

/**
 * Hardened Singleton Supabase Client for Cloudflare Workers
 * Ensures that if the client was initialized with a dummy URL, 
 * it gets recreated once the real URL is available via hydration.
 */

function getSafeEnv(key: string): string | undefined {
  const g = globalThis as any;
  if (key === 'NEXT_PUBLIC_SUPABASE_URL' && g.__supabase_url) return g.__supabase_url;
  if (key === 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' && g.__supabase_key) return g.__supabase_key;

  let value = process.env[key] || (process.env as any)[`NEXT_PUBLIC_${key}`];
  if (!value) return undefined;

  if (value.includes('=')) {
    const parts = value.split('=');
    if (parts[0].trim() === key || parts[0].trim().includes('SUPABASE')) {
      value = parts.slice(1).join('=').trim();
    }
  }
  return value;
}

declare global {
  var __supabase_client: ReturnType<typeof createBrowserClient> | undefined;
}

export function createClient(customUrl?: string, customKey?: string) {
  const url = customUrl || getSafeEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = customKey || getSafeEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');

  // If we already have a client, check if it's a "valid" one
  if (typeof window !== 'undefined' && globalThis.__supabase_client) {
    const currentUrl = (globalThis as any).__supabase_url_used;
    
    // If the current client is using the "missing" fallback but we now have a real URL,
    // we MUST discard it and create a new one.
    if (currentUrl?.includes('missing') && url && !url.includes('missing')) {
      globalThis.__supabase_client = undefined;
    } else {
      return globalThis.__supabase_client;
    }
  }

  const finalUrl = url || 'https://missing.supabase.co';
  const finalKey = key || 'missing';

  const client = createBrowserClient(
    finalUrl,
    finalKey,
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
    (globalThis as any).__supabase_url_used = finalUrl;
  }

  return client;
}
