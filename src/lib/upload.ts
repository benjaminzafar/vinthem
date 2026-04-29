import { logger } from '@/lib/logger';

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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', finalPath);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        logger.error('[Upload] API Error Response:', errorText);
        throw new Error(`Upload failed: ${uploadRes.status} ${errorText}`);
      }

      const { url } = await uploadRes.json() as { url?: string };
      if (!url) {
        throw new Error('Upload completed without a media URL.');
      }

      clearTimeout(timeout);
      resolve(url);

    } catch (error: unknown) {
      clearTimeout(timeout);
      logger.error('[Upload] Failed to fetch. Possible causes: CORS blocks, invalid credentials, or network timeout.', error);
      reject(error);
    }
  });
}

