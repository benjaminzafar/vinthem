import { getEnv } from './env';

const AES_IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const HEX_SECRET_LENGTH = 64;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function getEncryptionSecret(): string {
  const secret = getEnv('ENCRYPTION_SECRET');
  if (!secret) {
    throw new Error(
      'CRITICAL SECURITY FATAL: ENCRYPTION_SECRET is missing. Stopping operation.'
    );
  }

  return secret;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string');
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < hex.length; index += 2) {
    bytes[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16);
  }

  return bytes;
}

async function deriveRawKey(secret: string): Promise<Uint8Array> {
  if (secret.length === HEX_SECRET_LENGTH && /^[a-f0-9]+$/i.test(secret)) {
    return hexToBytes(secret);
  }

  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(secret));
  return new Uint8Array(digest);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function importAesKey(secret: string, usages: KeyUsage[]): Promise<CryptoKey> {
  const rawKey = await deriveRawKey(secret);
  return crypto.subtle.importKey(
    'raw',
    toArrayBuffer(rawKey),
    { name: 'AES-GCM' },
    false,
    usages
  );
}

export async function encrypt(text: string): Promise<string> {
  const key = await importAesKey(getEncryptionSecret(), ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(AES_IV_LENGTH));
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv), tagLength: AUTH_TAG_LENGTH * 8 },
    key,
    toArrayBuffer(textEncoder.encode(text))
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);
  const authTagStart = encryptedBytes.length - AUTH_TAG_LENGTH;
  const cipherBytes = encryptedBytes.slice(0, authTagStart);
  const authTag = encryptedBytes.slice(authTagStart);

  return `${bytesToHex(iv)}:${bytesToHex(authTag)}:${bytesToHex(cipherBytes)}`;
}

export async function decrypt(encryptedData: string): Promise<string> {
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    return encryptedData;
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  try {
    const key = await importAesKey(getEncryptionSecret(), ['decrypt']);
    const iv = hexToBytes(ivHex);
    const authTag = hexToBytes(authTagHex);
    const encryptedBytes = hexToBytes(encryptedHex);
    const combined = new Uint8Array(encryptedBytes.length + authTag.length);
    combined.set(encryptedBytes);
    combined.set(authTag, encryptedBytes.length);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv), tagLength: AUTH_TAG_LENGTH * 8 },
      key,
      toArrayBuffer(combined)
    );

    return textDecoder.decode(decryptedBuffer);
  } catch {
    throw new Error('DECRYPTION_FAILED');
  }
}
