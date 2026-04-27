/**
 * Centralized Environment Variable Resolver for Cloudflare Workers
 */
export function getEnv(key: string): string | undefined {
  // 1. Try standard process.env (Node.js style)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key];
    const publicRef = `NEXT_PUBLIC_${key}`;
    if (process.env[publicRef]) return process.env[publicRef];
  }
  
  // 2. Try Cloudflare Request Context (Edge style)
  try {
    // Dynamically require to avoid build-time issues on non-cloudflare envs
    const { getRequestContext } = require('@opennextjs/cloudflare');
    const ctx = getRequestContext();
    if (ctx && ctx.env) {
      const publicRef = `NEXT_PUBLIC_${key}`;
      return ctx.env[key] || ctx.env[publicRef];
    }
  } catch (e) {
    // Fallback if context is not available
  }

  // 3. Try globalThis (Some edge runtimes)
  const g = globalThis as any;
  if (g[key]) return g[key];
  const publicRef = `NEXT_PUBLIC_${key}`;
  if (g[publicRef]) return g[publicRef];

  return undefined;
}
