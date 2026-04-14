import { createClient } from '@/utils/supabase/client';

export async function uploadImageWithTimeout(
  file: File,
  path: string,
  timeoutMs: number = 120000
): Promise<string> {
  const uploadPromise = new Promise<string>(async (resolve, reject) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', path);

      // We need the session for auth
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const { url } = await response.json();
      resolve(url);
    } catch (error) {
      console.error('Upload Error:', error);
      reject(error);
    }
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Upload timed out (${timeoutMs/1000}s). Please check your internet connection and R2 configuration.`));
    }, timeoutMs);
  });

  return Promise.race([uploadPromise, timeoutPromise]);
}
