"use client";

interface CloudflareLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudflareLoader({ src, width, quality }: CloudflareLoaderProps) {
  if (!src) return '';

  // 1. Normalize source - ensure it is an absolute path or full URL
  const normalizedSrc = src.startsWith('http') ? src : (src.startsWith('/') ? src : `/${src}`);
  
  // 2. Identify Environment
  // Bypass Cloudflare resizing for local development AND Vercel preview environments (*.vercel.app)
  // This is because localhost and vercel.app domains aren't behind the Cloudflare proxy yet.
  const isDev = process.env.NODE_ENV === 'development' || 
                (typeof window !== 'undefined' && 
                 (window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' || 
                  window.location.hostname.includes('vercel.app')));

  if (isDev) {
    // Return direct link with space encoding to prevent broken srcsets
    return normalizedSrc.replace(/ /g, '%20');
  }

  // 3. Cloudflare Image Resizing (Production Only)
  // Check if it's an R2 link or a relative path on our domain
  const isR2 = normalizedSrc.includes('pub-f44233c26dba4e9795b3ccf51fe6f2cb.r2.dev');
  
  if (isR2 || normalizedSrc.startsWith('/')) {
    const params = [
      `width=${width}`,
      `quality=${quality || 85}`,
      'format=avif'
    ];
    
    // Construct the Cloudflare Resizing path
    // We Encode the source URL to protect protocol slashes (https:// -> https%3A%2F%2F)
    const encodedSrc = normalizedSrc.startsWith('http') 
      ? encodeURIComponent(normalizedSrc) 
      : normalizedSrc.replace(/ /g, '%20');

    return `/cdn-cgi/image/${params.join(',')}/${encodedSrc}`;
  }

  // Final fallback
  return normalizedSrc.replace(/ /g, '%20');
}
