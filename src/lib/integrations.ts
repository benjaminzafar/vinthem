import { decrypt } from '@/lib/encryption';
import { logger } from '@/lib/logger';

const ENCRYPTED_VALUE_PARTS = 3;
const HEX_SEGMENT_PATTERN = /^[a-f0-9]+$/i;

function looksEncrypted(value: string): boolean {
  const parts = value.split(':');

  return (
    parts.length === ENCRYPTED_VALUE_PARTS &&
    parts.every((part) => part.length > 0 && HEX_SEGMENT_PATTERN.test(part))
  );
}

export async function maybeDecryptStoredValue(value: string | null | undefined): Promise<string> {
  if (!value || value.trim() === '') {
    return '';
  }

  // If it doesn't even look encrypted, it's a raw value
  if (!looksEncrypted(value)) {
    return value.trim();
  }

  try {
    const decrypted = await decrypt(value);
    if (!decrypted) return '';
    return decrypted.trim();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('DECRYPTION_FAILURE: Falling back to empty string to prevent URL crashes.', { value: value.slice(0, 10) + '...' });
    }
    // Return a safe string that our S3 client validation will catch
    return 'DECRYPTION_FAILED';
  }
}

export function isSensitiveIntegrationKey(key: string): boolean {
  return ['API_KEY', 'SECRET', 'PASS', 'TOKEN', 'ACCOUNT_ID', 'KEY_ID'].some((segment) => key.includes(segment));
}





