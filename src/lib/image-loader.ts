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
    // Unsplash has its own optimization API
    const url = new URL(normalizedSrc);
    url.searchParams.set('w', width.toString());
    url.searchParams.set('q', (quality || 75).toString());
    url.searchParams.set('fm', 'avif');
    url.searchParams.set('auto', 'format');
    url.searchParams.set('fit', 'crop');
    return url.toString();
  }

  // 4. Default Pass-through
  // Let Next.js handle the optimization natively through its own loaders
  // We just return the normalized path.
  return normalizedSrc.replace(/ /g, '%20');
}
