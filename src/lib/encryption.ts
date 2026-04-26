/**
 * AES-256-GCM encryption using the Web Crypto API.
 * Compatible with Node.js (>=18), Cloudflare Workers, and Edge runtimes.
 */

function getEncryptionSecret(): string {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error(
      'CRITICAL SECURITY FATAL: ENCRYPTION_SECRET is missing from environment variables. Stopping operation to prevent unencrypted secrets.'
    );
  }
  return secret;
}

async function deriveKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const rawKey = secret.length === 64
    ? hexToBytes(secret)
    : encoder.encode(secret);

  // Import raw bytes as AES-256-GCM key
  if (rawKey.length === 32) {
    return globalThis.crypto.subtle.importKey(
      'raw',
      rawKey as any,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Derive 32-byte key via SHA-256 if not already 32 bytes
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', rawKey as any);
  return globalThis.crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function encrypt(text: string): Promise<string> {
  const key = await deriveKey(getEncryptionSecret());
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);

  // AES-GCM appends the 16-byte auth tag to the ciphertext
  const cipherBuffer = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    encoded as any
  );

  const cipherBytes = new Uint8Array(cipherBuffer);
  const cipherText = cipherBytes.slice(0, -16);
  const authTag = cipherBytes.slice(-16);

  // Format: iv:authTag:encryptedText (same as before)
  return `${bytesToHex(iv)}:${bytesToHex(authTag)}:${bytesToHex(cipherText)}`;
}

export async function decrypt(encryptedData: string): Promise<string> {
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format.');
  }

  const key = await deriveKey(getEncryptionSecret());
  const iv = hexToBytes(parts[0]);
  const authTag = hexToBytes(parts[1]);
  const cipherText = hexToBytes(parts[2]);

  // Recombine cipher + tag (Web Crypto expects them together)
  const combined = new Uint8Array(cipherText.length + authTag.length);
  combined.set(cipherText);
  combined.set(authTag, cipherText.length);

  const decrypted = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    combined as any
  );

  return new TextDecoder().decode(decrypted);
}
