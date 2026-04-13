import { createClient } from '@/utils/supabase/client';

export async function uploadImageWithTimeout(
  file: File,
  path: string,
  timeoutMs: number = 15000
): Promise<string> {
  const uploadPromise = new Promise<string>(async (resolve, reject) => {
    try {
      const supabase = createClient();

      const { error } = await supabase.storage
        .from('images')
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage.from('images').getPublicUrl(path);
      resolve(data.publicUrl);
    } catch (error) {
      console.error('Supabase Storage Upload Error:', error);
      reject(error);
    }
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Upload timed out.'));
    }, timeoutMs);
  });

  return Promise.race([uploadPromise, timeoutPromise]);
}
