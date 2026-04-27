import { createBrowserClient } from '@supabase/ssr';

/**
 * Hardened Supabase Client for Cloudflare Workers
 * Always re-evaluates the environment to prevent stale "missing" connections.
 */

function getSafeEnv(key: string): string | undefined {
  if (typeof window === 'undefined') return undefined;

  const g = globalThis as any;
  
  // Priority 1: Values injected by StoreHydrator at runtime
  if (key === 'NEXT_PUBLIC_SUPABASE_URL' && g.__supabase_url) return g.__supabase_url;
  if (key === 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' && g.__supabase_key) return g.__supabase_key;

  // Priority 2: Process Env (if baked in)
  let value = process.env[key] || (process.env as any)[`NEXT_PUBLIC_${key}`];
  
  if (value && value.includes('=')) {
    const parts = value.split('=');
    if (parts[0].trim().includes('SUPABASE')) {
      value = parts.slice(1).join('=').trim();
    }
  }

  return value;
}

declare global {
  var __supabase_client: ReturnType<typeof createBrowserClient> | undefined;
}

export function createClient(customUrl?: string, customKey?: string) {
  // Always get the latest values
  const currentUrl = customUrl || getSafeEnv('NEXT_PUBLIC_SUPABASE_URL');
  const currentKey = customKey || getSafeEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');

  const isDummy = (url?: string) => !url || url.includes('missing') || !url.startsWith('http');

  if (typeof window !== 'undefined') {
    const g = globalThis as any;
    
    // If we have a cached client, check if it's still valid
    if (g.__supabase_client) {
      const usedUrl = g.__supabase_url_used;
      
      // If we were using a dummy URL but now have a real one, FORCE RECREATION
      if (isDummy(usedUrl) && !isDummy(currentUrl)) {
        g.__supabase_client = undefined;
      } else {
        return g.__supabase_client;
      }
    }
  }

  const finalUrl = currentUrl || 'https://missing.supabase.co';
  const finalKey = currentKey || 'missing';

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
    const g = globalThis as any;
    g.__supabase_client = client;
    g.__supabase_url_used = finalUrl;
  }

  return client;
}
