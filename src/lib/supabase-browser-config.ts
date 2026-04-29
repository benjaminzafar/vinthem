import { getEnv } from '@/lib/env';

export type BrowserSupabaseConfig = {
  url: string;
  anonKey: string;
};

export function getBrowserSupabaseConfig(): BrowserSupabaseConfig {
  const url = getEnv('SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL') || '';
  const anonKey = getEnv('SUPABASE_PUBLISHABLE_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || '';

  return {
    url,
    anonKey,
  };
}
