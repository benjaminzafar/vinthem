export function getOptimizedImageUrl(src: string, width: number = 800, quality: number = 75) {
  if (!src) return src;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xeatyjjiywcrkuvifyhm.supabase.co';
  
  if (!src.startsWith(supabaseUrl)) {
    return src;
  }

  try {
    const url = new URL(src);
    const pathParts = url.pathname.split('/');
    
    if (pathParts.includes('object') && pathParts.includes('public')) {
      const publicIndex = pathParts.indexOf('public');
      const bucket = pathParts[publicIndex + 1];
      const path = pathParts.slice(publicIndex + 2).join('/');
      
      const params = new URLSearchParams();
      params.set('width', width.toString());
      params.set('quality', quality.toString());
      params.set('format', 'webp');

      return `${supabaseUrl}/storage/v1/render/image/public/${bucket}/${path}?${params.toString()}`;
    }
  } catch (e) {
    return src;
  }

  return src;
}
