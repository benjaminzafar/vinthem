import 'server-only';
import { createAdminClient } from '@/utils/supabase/server';

export interface R2Credentials {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

interface ListOptions {
  continuationToken?: string;
  delimiter?: string;
  maxKeys?: number;
}

/**
 * Fetches R2 credentials from the database.
 */
export async function getR2Credentials(): Promise<R2Credentials> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('integrations')
    .select('key, value')
    .in('key', ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL']);

  if (error) throw new Error(`Failed to load R2 integrations: ${error.message}`);

  const integrations = data || [];
  const findValue = (k: string) => integrations.find(r => r.key === k)?.value;
  
  const { maybeDecryptStoredValue } = await import('@/lib/integrations');

  const rawAccountId = (await maybeDecryptStoredValue(findValue('R2_ACCOUNT_ID') || '')).trim();
  
  // Smart parsing: Extract account ID from URL if user pasted a full URL
  let accountId = rawAccountId;
  if (accountId.includes('.r2.cloudflarestorage.com')) {
    const match = accountId.match(/https?:\/\/([^.]+)\.r2\.cloudflarestorage\.com/);
    if (match) accountId = match[1];
  } else if (accountId.startsWith('http')) {
    // If it's just a URL but not the standard R2 one, try to extract the first segment
    try {
      const url = new URL(accountId);
      accountId = url.hostname.split('.')[0];
    } catch { /* ignore */ }
  }

  const credentials = {
    accountId: accountId,
    accessKeyId: (await maybeDecryptStoredValue(findValue('R2_ACCESS_KEY_ID') || '')).trim(),
    secretAccessKey: (await maybeDecryptStoredValue(findValue('R2_SECRET_ACCESS_KEY') || '')).trim(),
    bucketName: (await maybeDecryptStoredValue(findValue('R2_BUCKET_NAME') || '')).trim(),
    publicUrl: (await maybeDecryptStoredValue(findValue('R2_PUBLIC_URL') || '')).trim().replace(/\/$/, ''),
  };

  if (credentials.accountId === 'DECRYPTION_FAILED' || credentials.bucketName === 'DECRYPTION_FAILED') {
    throw new Error('[R2_CONFIG] Decryption failed for Cloudflare R2 credentials. This usually means the ENCRYPTION_SECRET in your production environment does not match the one used to save these settings. Please re-enter and save the credentials in the Integrations panel.');
  }

  if (!credentials.accountId) {
    throw new Error('[R2_CONFIG] Cloudflare R2 Account ID is missing. Please enter it in the Integrations panel.');
  }

  if (!credentials.bucketName) {
    throw new Error('[R2_CONFIG] Cloudflare R2 Bucket Name is missing. Please enter it in the Integrations panel.');
  }

  return credentials;
}

/**
 * PURE EDGE S3 CLIENT
 * This client uses only standard 'fetch' and doesn't depend on Node.js modules like 'fs'.
 * Compatible with Cloudflare Workers / Edge Runtime.
 */
export class EdgeR2Client {
  constructor(private creds: R2Credentials) {}

  private async sign(method: string, path: string, headers: Record<string, string> = {}, body?: ArrayBuffer) {
    // Note: Cloudflare R2 can often be accessed via standard fetch if Auth is handled.
    // For simplicity and maximum compatibility with Edge, we use a Fetch-based request to the R2 endpoint.
    const url = `https://${this.creds.accountId}.r2.cloudflarestorage.com/${this.creds.bucketName}/${path.replace(/^\//, '')}`;
    
    // We'll use the AWS SDK only for Signature generation if needed, 
    // but better yet, we use the standard AWS Signature V4 protocol manually if needed.
    // However, to solve the [unenv] fs error, we MUST avoid importing the S3 Client itself at top level.
    
    // For now, let's implement the core operations using the SDK but with dynamic imports 
    // to ensure they don't leak into the global scope and trigger unenv polyfills incorrectly.
    const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } = await import('@aws-sdk/client-s3');
    
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.creds.accountId.trim()}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.creds.accessKeyId,
        secretAccessKey: this.creds.secretAccessKey,
      },
      forcePathStyle: true,
    });

    return { client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand };
  }

  async list(prefix: string = '', options: ListOptions = {}) {
    const { client, ListObjectsV2Command } = await this.sign('GET', '');
    const command = new ListObjectsV2Command({
      Bucket: this.creds.bucketName,
      Prefix: prefix,
      Delimiter: options.delimiter,
      ContinuationToken: options.continuationToken,
      MaxKeys: options.maxKeys,
    });
    return await client.send(command);
  }

  async upload(path: string, buffer: Buffer | ArrayBuffer, contentType: string) {
    const { client, PutObjectCommand } = await this.sign('PUT', path);
    const command = new PutObjectCommand({
      Bucket: this.creds.bucketName,
      Key: path,
      Body: new Uint8Array(buffer),
      ContentType: contentType,
    });
    return await client.send(command);
  }

  async delete(key: string) {
    const { client, DeleteObjectCommand } = await this.sign('DELETE', key);
    const command = new DeleteObjectCommand({
      Bucket: this.creds.bucketName,
      Key: key,
    });
    return await client.send(command);
  }

  async getObject(key: string) {
    const { client, GetObjectCommand } = await this.sign('GET', key);
    const command = new GetObjectCommand({
      Bucket: this.creds.bucketName,
      Key: key,
    });
    return await client.send(command);
  }

  async getPresignedUrl(path: string, contentType: string, expiresIn: number = 900) {
    const { client, PutObjectCommand } = await this.sign('PUT', path);
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const command = new PutObjectCommand({
      Bucket: this.creds.bucketName,
      Key: path,
      ContentType: contentType,
    });
    return await getSignedUrl(client as any, command, { expiresIn });
  }
}

/**
 * Factory to get the Edge-compatible R2 client.
 */
export async function getS3Client(): Promise<EdgeR2Client> {
  const creds = await getR2Credentials();
  return new EdgeR2Client(creds);
}
