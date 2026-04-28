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
  
  // 2. Try globalThis (Cloudflare / Edge style)
  const g = globalThis as any;
  if (g[key]) return g[key];
  const publicRef = `NEXT_PUBLIC_${key}`;
  if (g[publicRef]) return g[publicRef];

  return undefined;
}
