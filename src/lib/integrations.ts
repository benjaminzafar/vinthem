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
  if (!value) {
    return '';
  }

  if (!looksEncrypted(value)) {
    return value;
  }

  try {
    return await decrypt(value);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Encrypted integration value could not be decrypted. Falling back to the stored raw value.', error);
    }
    return value;
  }
}

export function isSensitiveIntegrationKey(key: string): boolean {
  return ['API_KEY', 'SECRET', 'PASS', 'TOKEN', 'ACCOUNT_ID', 'KEY_ID'].some((segment) => key.includes(segment));
}





