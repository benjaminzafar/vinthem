"use client";

interface CloudflareLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudflareLoader({ src, width, quality }: CloudflareLoaderProps) {
  // Normalize src - ensure it's properly encoded for the browser
  const normalizedSrc = src.startsWith('http') ? src : (src.startsWith('/') ? src : `/${src}`);
  
  // Only use Cloudflare Image Resizing in production on custom domains
  const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
  const isDev = process.env.NODE_ENV === 'development' || 
                (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ||
                isVercel;

  if (isDev) {
    // Escape spaces in dev mode to prevent broken srcsets
    return normalizedSrc.replace(/ /g, '%20');
  }

  // If it's a relative path or an R2 link, we use Cloudflare Image Resizing
  const isR2 = normalizedSrc.includes('pub-f44233c26dba4e9795b3ccf51fe6f2cb.r2.dev');
  
  if (isR2 || normalizedSrc.startsWith('/')) {
    const params = [
      `width=${width}`,
      `quality=${quality || 85}`,
      'format=avif'
    ];
    
    // Construct the URL - Note: Cloudflare prefers the source URL at the end
    // Use the absolute URL if it's already one, otherwise return relative
    return `/cdn-cgi/image/${params.join(',')}/${normalizedSrc.replace(/ /g, '%20')}`;
  }

  return normalizedSrc.replace(/ /g, '%20');
}
