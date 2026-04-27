import { createBrowserClient } from '@supabase/ssr';

/**
 * God-Tier Lazy Supabase Client for Cloudflare Workers.
 * This proxy-based client delays initialization until the first method call,
 * ensuring that it always picks up the correct URL/Key even if called 
 * at the top level of a module before hydration.
 */

function getSafeEnv(key: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const g = globalThis as any;
  if (key === 'NEXT_PUBLIC_SUPABASE_URL' && g.__supabase_url) return g.__supabase_url;
  if (key === 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' && g.__supabase_key) return g.__supabase_key;
  return process.env[key] || (process.env as any)[`NEXT_PUBLIC_${key}`];
}

export function createClient(customUrl?: string, customKey?: string) {
  if (typeof window === 'undefined') {
    return createBrowserClient(
      customUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://missing.supabase.co',
      customKey || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'missing'
    );
  }

  const g = globalThis as any;
  
  // Return the existing lazy proxy if it exists
  if (g.__supabase_lazy_proxy && !customUrl) {
    return g.__supabase_lazy_proxy;
  }

  // Define the target that will hold the real client
  let realClient: any = null;

  const initialize = () => {
    const url = customUrl || getSafeEnv('NEXT_PUBLIC_SUPABASE_URL') || 'https://missing.supabase.co';
    const key = customKey || getSafeEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || 'missing';
    
    // If we already have a real client and the config hasn't changed from a "missing" state, reuse it
    if (realClient && !g.__supabase_url_used?.includes('missing')) {
      return realClient;
    }

    // If the config is STILL missing, but we already tried once, just return what we have
    if (url.includes('missing') && realClient) {
      return realClient;
    }

    realClient = createBrowserClient(url, key, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    g.__supabase_url_used = url;
    return realClient;
  };

  // Create a Proxy that intercepts all property accesses
  const proxy = new Proxy({}, {
    get(_, prop) {
      const client = initialize();
      const value = Reflect.get(client, prop);
      return typeof value === 'function' ? value.bind(client) : value;
    }
  });

  if (!customUrl) {
    g.__supabase_lazy_proxy = proxy;
  }

  return proxy as ReturnType<typeof createBrowserClient>;
}
