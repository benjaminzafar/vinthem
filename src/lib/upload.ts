import { auth } from '@/lib/firebase';

export async function uploadImageWithTimeout(file: File, path: string, timeoutMs: number = 15000): Promise<string> {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : '';
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', path);
  formData.append('token', token);

  const uploadPromise = fetch('/api/upload', {
    method: 'POST',
    body: formData,
  }).then(async (res) => {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Upload failed');
    }
    return data.url;
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Upload timed out.'));
    }, timeoutMs);
  });

  return Promise.race([uploadPromise, timeoutPromise]);
}
