"use client";

interface CloudflareLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudflareLoader({ src, width, quality }: CloudflareLoaderProps) {
  if (!src) return '';

  // 1. Normalize source
  const normalizedSrc = src.startsWith('http') ? src : (src.startsWith('/') ? src : `/${src}`);
  
  // 2. Identify Source Type
  const isUnsplash = normalizedSrc.includes('images.unsplash.com');
  const isR2 = normalizedSrc.includes('pub-f44233c26dba4e9795b3ccf51fe6f2cb.r2.dev') || 
               normalizedSrc.includes('r2.cloudflarestorage.com');

  // 3. Environment Toggle
  // We only disable optimization on localhost.
  // Production (Vercel) should ALWAYS use optimization if the flag is set.
  const isCloudflareActive = process.env.NEXT_PUBLIC_CLOUDFLARE_OPTIMIZATION === 'true';
  const isLocalhost = typeof window !== 'undefined' && 
                     (window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1');

  // 4. Source-Specific Optimizations
  if (isUnsplash) {
    // Unsplash has a powerful built-in API. We should use it directly.
    // We force avif format for maximum compression.
    const url = new URL(normalizedSrc);
    url.searchParams.set('w', width.toString());
    url.searchParams.set('q', (quality || 75).toString());
    url.searchParams.set('fm', 'avif');
    url.searchParams.set('auto', 'format');
    url.searchParams.set('fit', 'crop');
    return url.toString();
  }

  // Cloudflare R2 / Internal Optimization
  if (isCloudflareActive && !isLocalhost && (isR2 || normalizedSrc.startsWith('/'))) {
    const params = [
      `width=${width}`,
      `quality=${quality || 85}`,
      'format=avif'
    ];
    
    // Construct the Cloudflare Resizing path
    const encodedSrc = normalizedSrc.startsWith('http') 
      ? encodeURIComponent(normalizedSrc) 
      : normalizedSrc.replace(/ /g, '%20');

    return `/cdn-cgi/image/${params.join(',')}/${encodedSrc}`;
  }

  // Final fallback (Return direct link with basic encoding)
  return normalizedSrc.replace(/ /g, '%20');
}
