import { createBrowserClient } from '@supabase/ssr';

type BrowserSupabaseGlobals = typeof globalThis & {
  __supabase_url?: string;
  __supabase_key?: string;
  __supabase_real_client?: ReturnType<typeof createBrowserClient>;
  __supabase_signature?: string;
};

function getSafeEnv(key: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const g = globalThis as BrowserSupabaseGlobals;
  if (key === 'NEXT_PUBLIC_SUPABASE_URL' && g.__supabase_url) return g.__supabase_url;
  if (key === 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' && g.__supabase_key) return g.__supabase_key;
  return process.env[key] || process.env[`NEXT_PUBLIC_${key}`];
}

export function createClient(customUrl?: string, customKey?: string) {
  if (typeof window === 'undefined') {
    return createBrowserClient(
      customUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://missing.supabase.co',
      customKey || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'missing'
    );
  }

  const g = globalThis as BrowserSupabaseGlobals;
  const url = customUrl || getSafeEnv('NEXT_PUBLIC_SUPABASE_URL') || 'https://missing.supabase.co';
  const key = customKey || getSafeEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || 'missing';
  const signature = `${url}::${key}`;

  if (g.__supabase_real_client && g.__supabase_signature === signature) {
    return g.__supabase_real_client;
  }

  const client = createBrowserClient(url, key, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  g.__supabase_real_client = client;
  g.__supabase_signature = signature;

  return client;
}
