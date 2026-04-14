"use client";

interface CloudflareLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudflareLoader({ src, width, quality }: CloudflareLoaderProps) {
  // If it's a relative path or an R2 link, we use Cloudflare Image Resizing
  const isR2 = src.includes('pub-f44233c26dba4e9795b3ccf51fe6f2cb.r2.dev');
  
  if (isR2 || src.startsWith('/')) {
    // Construct the Cloudflare Resizing URL
    // Format: https://your-site.com/cdn-cgi/image/width=X,quality=Y,format=avif/https://original-url.com
    const params = [
      `width=${width}`,
      `quality=${quality || 85}`,
      'format=avif'
    ];
    
    // We use a relative path for the cdn-cgi to ensure it uses the current domain
    return `/cdn-cgi/image/${params.join(',')}/${src}`;
  }

  // Fallback for external images (Google Avatars, etc.)
  return src;
}
