"use server";

import { getEnv } from "@/lib/env";

/**
 * Server Action to retrieve the Supabase configuration at runtime.
 * This is used to bypass build-time environment variable limitations in Cloudflare.
 */
export async function getSupabaseConfigAction() {
  return {
    url: getEnv('SUPABASE_URL') || '',
    anonKey: getEnv('SUPABASE_PUBLISHABLE_KEY') || ''
  };
}
