import { createClient } from '@/utils/supabase/client';

export async function uploadImageWithTimeout(
  file: File,
  path: string,
  timeoutMs: number = 300000 // Extended to 5 mins for large direct uploads
): Promise<string> {
  // Use a unique path if not provided
  const finalPath = path || `uploads/${Date.now()}_${file.name}`;

  return new Promise<string>(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Upload timed out (${timeoutMs/1000}s). Please check your connection.`));
    }, timeoutMs);

    try {
      const presignedRes = await fetch('/api/admin/media/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: finalPath, contentType: file.type })
      });

      if (!presignedRes.ok) {
        const errorText = await presignedRes.text();
        throw new Error(`Failed to get upload permission: ${presignedRes.status} ${errorText}`);
      }
      
      const { uploadUrl, publicUrl } = await presignedRes.json();

      // 2. Upload DIRECTLY to Cloudflare R2
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        console.error('[Upload] R2 Error Response:', errorText);
        throw new Error(`Direct upload to R2 failed: ${uploadRes.status} ${errorText}`);
      }

      clearTimeout(timeout);
      resolve(publicUrl);

    } catch (error: unknown) {
      clearTimeout(timeout);
      console.error('[Upload] Failed to fetch. Possible causes: CORS blocks, invalid credentials, or network timeout.', error);
      reject(error);
    }
  });
}
