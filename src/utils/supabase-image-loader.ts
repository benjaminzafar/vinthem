export default function supabaseLoader({ src, width, quality }: { src: string, width: number, quality?: number }) {
  // If it's already a full URL and not from our supabase, just return it
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xeatyjjiywcrkuvifyhm.supabase.co';
  
  if (!src.startsWith(supabaseUrl)) {
    return src;
  }

  // Parse the URL to get the bucket and path
  // Expected: https://.../storage/v1/object/public/BUCKET/PATH
  try {
    const url = new URL(src);
    const pathParts = url.pathname.split('/');
    
    // Check if it's a storage URL
    if (pathParts.includes('object') && pathParts.includes('public')) {
      const publicIndex = pathParts.indexOf('public');
      const bucket = pathParts[publicIndex + 1];
      const path = pathParts.slice(publicIndex + 2).join('/');
      
      const params = new URLSearchParams();
      params.set('width', width.toString());
      params.set('quality', (quality || 75).toString());
      params.set('format', 'webp'); // Always use webp for best performance

      return `${supabaseUrl}/storage/v1/render/image/public/${bucket}/${path}?${params.toString()}`;
    }
  } catch (e) {
    return src;
  }

  return src;
}
