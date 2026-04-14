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

  // 3. Source-Specific Optimizations
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

  // 4. Vercel Native Optimization (For R2 and Internal)
  // Since we are on Vercel, the fastest way to resize non-proxied images (like R2)
  // is to use Vercel's built-in optimizer which handles R2 remote patterns natively.
  // This converts massive original files into tiny AVIF/WebP versions on the Edge.
  const encodedSrc = encodeURIComponent(normalizedSrc);
  return `/_next/image?url=${encodedSrc}&w=${width}&q=${quality || 75}`;
}
