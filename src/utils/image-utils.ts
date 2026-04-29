import { toMediaProxyUrl } from '@/lib/media';

export function getOptimizedImageUrl(src: string, width: number = 800, quality: number = 75) {
  if (!src) return src;

  const proxiedSource = toMediaProxyUrl(src);
  if (proxiedSource.startsWith('/api/media?key=')) {
    return proxiedSource;
  }
  
  // Supported domains for optimization
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xeatyjjiywcrkuvifyhm.supabase.co';
  const customCdnUrl = 'https://cdn.vinthem.com';
  
  const isSupabase = proxiedSource.startsWith(supabaseUrl);
  const isCustomCdn = proxiedSource.startsWith(customCdnUrl);

  if (!isSupabase && !isCustomCdn) {
    return proxiedSource;
  }

  // Use Weserv.nl as a high-performance, free image proxy for Cloudflare R2/Supabase
  // This is much faster than standard Next.js optimization on Cloudflare Free Workers
  try {
    const encodedUrl = encodeURIComponent(proxiedSource);
    return `https://images.weserv.nl/?url=${encodedUrl}&w=${width}&q=${quality}&output=webp&il`;
  } catch (e) {
    return proxiedSource;
  }
}
