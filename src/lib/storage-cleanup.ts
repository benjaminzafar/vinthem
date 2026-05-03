import { createAdminClient } from '@/utils/supabase/server';
import { extractMediaKey } from '@/lib/media';
import { logger } from '@/lib/logger';

/**
 * Deletes a file from Supabase storage given its public URL or key.
 */
export async function deleteMediaFromStorage(url: string | null | undefined) {
  if (!url) return;
  
  const key = extractMediaKey(url);
  if (!key) return;

  try {
    const supabase = createAdminClient();
    // We assume the bucket is 'media' or 'products' based on typical project structure
    // If bucket is not specified, we try common ones or just 'public'
    const bucket = 'public'; 
    
    const { error } = await supabase.storage.from(bucket).remove([key]);
    
    if (error) {
      logger.error(`[Storage Cleanup] Failed to delete ${key}:`, error.message);
    } else {
      logger.info(`[Storage Cleanup] Successfully deleted ${key}`);
    }
  } catch (err) {
    logger.error('[Storage Cleanup] Critical Error:', err);
  }
}

/**
 * Bulk deletes media from storage
 */
export async function bulkDeleteMediaFromStorage(urls: (string | null | undefined)[]) {
  const keys = urls
    .map(url => extractMediaKey(url))
    .filter((key): key is string => !!key);

  if (keys.length === 0) return;

  try {
    const supabase = createAdminClient();
    const bucket = 'public';
    
    const { error } = await supabase.storage.from(bucket).remove(keys);
    
    if (error) {
      logger.error(`[Storage Cleanup] Bulk deletion failed:`, error.message);
    } else {
      logger.info(`[Storage Cleanup] Bulk deleted ${keys.length} files`);
    }
  } catch (err) {
    logger.error('[Storage Cleanup] Bulk Critical Error:', err);
  }
}
