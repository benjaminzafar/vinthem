import { decrypt } from '@/lib/encryption';

const ENCRYPTED_VALUE_PARTS = 3;
const HEX_SEGMENT_PATTERN = /^[a-f0-9]+$/i;

function looksEncrypted(value: string): boolean {
  const parts = value.split(':');

  return (
    parts.length === ENCRYPTED_VALUE_PARTS &&
    parts.every((part) => part.length > 0 && HEX_SEGMENT_PATTERN.test(part))
  );
}

export function maybeDecryptStoredValue(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  if (!looksEncrypted(value)) {
    return value;
  }

  try {
    return decrypt(value);
  } catch {
    return value;
  }
}

export function isSensitiveIntegrationKey(key: string): boolean {
  return ['API_KEY', 'SECRET', 'PASS', 'TOKEN', 'ACCOUNT_ID', 'KEY_ID'].some((segment) => key.includes(segment));
}

export function normalizePostHogAppHost(host: string | null | undefined): string {
  const normalizedHost = maybeDecryptStoredValue(host).trim().replace(/\/+$/, '');

  if (!normalizedHost) {
    return 'https://eu.posthog.com';
  }

  if (normalizedHost.includes('.i.posthog.com')) {
    return normalizedHost.replace('.i.posthog.com', '.posthog.com');
  }

  return normalizedHost;
}

export function normalizePostHogIngestionHost(host: string | null | undefined): string {
  const normalizedHost = maybeDecryptStoredValue(host).trim().replace(/\/+$/, '');

  if (!normalizedHost) {
    return 'https://eu.i.posthog.com';
  }

  if (normalizedHost.includes('.posthog.com') && !normalizedHost.includes('.i.posthog.com')) {
    return normalizedHost.replace('.posthog.com', '.i.posthog.com');
  }

  return normalizedHost;
}
