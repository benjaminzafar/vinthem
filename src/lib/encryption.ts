import { getEnv } from './env';
import crypto from 'crypto';

/**
 * AES-256-GCM encryption using Node.js crypto module.
 * Optimized for reliability in Node environments.
 */

function getEncryptionSecret(): string {
  const secret = getEnv('ENCRYPTION_SECRET');
  if (!secret) {
    throw new Error(
      'CRITICAL SECURITY FATAL: ENCRYPTION_SECRET is missing. Stopping operation.'
    );
  }
  return secret;
}

function deriveKey(secret: string): Buffer {
  // If the secret is 64 chars of hex, it represents a 32-byte key
  if (secret.length === 64 && /^[a-f0-9]+$/i.test(secret)) {
    return Buffer.from(secret, 'hex');
  }
  // Otherwise, hash the secret to get a 32-byte key
  return crypto.createHash('sha256').update(secret).digest();
}

export async function encrypt(text: string): Promise<string> {
  const key = deriveKey(getEncryptionSecret());
  const iv = crypto.randomBytes(12);
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export async function decrypt(encryptedData: string): Promise<string> {
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    return encryptedData;
  }

  try {
    const key = deriveKey(getEncryptionSecret());
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (e) {
    // If decryption fails, we throw an error that the integration layer will catch
    throw new Error('DECRYPTION_FAILED');
  }
}
