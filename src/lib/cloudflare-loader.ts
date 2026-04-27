
export default function cloudflareLoader({ src, width, quality }: { src: string, width: number, quality?: number }) {
  // If it's not a remote image or doesn't need optimization, return as is
  if (!src.startsWith('http')) return src;
  
  // Use Cloudflare Image Resizing via the main domain or CDN domain
  // Format: https://vinthem.com/cdn-cgi/image/width=X,quality=Y,format=auto/HTTPS_URL
  const params = [
    `width=${width}`,
    `quality=${quality || 75}`,
    'format=auto',
    'fit=cover'
  ].join(',');
  
  return `https://vinthem.com/cdn-cgi/image/${params}/${src}`;
}
