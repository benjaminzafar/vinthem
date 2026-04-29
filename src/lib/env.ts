/**
 * Centralized Environment Variable Resolver for Cloudflare Workers
 */
export function getEnv(key: string): string | undefined {
  // 1. Try standard process.env (Node.js style)
  if (typeof process !== 'undefined' && process.env) {
    const val = process.env[key];
    if (val !== undefined && val !== null) return String(val).trim();
    
    const publicVal = process.env[`NEXT_PUBLIC_${key}`];
    if (publicVal !== undefined && publicVal !== null) return String(publicVal).trim();
  }
  
  // 2. Try globalThis (Cloudflare / Edge style)
  const g = globalThis as any;
  const gVal = g[key];
  if (gVal !== undefined && gVal !== null) return String(gVal).trim();
  
  const gPublicVal = g[`NEXT_PUBLIC_${key}`];
  if (gPublicVal !== undefined && gPublicVal !== null) return String(gPublicVal).trim();

  return undefined;
}
