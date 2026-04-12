import crypto from 'node:crypto';

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;

if (!ENCRYPTION_SECRET) {
  throw new Error("CRITICAL SECURITY FATAL: ENCRYPTION_SECRET is missing from environment variables. Stopping server to prevent unencrypted secrets.");
}

// AES-256 requires exactly 32 bytes. If the provided secret is a hex string, parse it, otherwise hash it to 32 bytes to ensure safe usage.
const KEY = ENCRYPTION_SECRET.length === 64 
  ? Buffer.from(ENCRYPTION_SECRET, 'hex') 
  : crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();

const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encryptedText
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format.');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedText = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
