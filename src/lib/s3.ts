import 'server-only';
import { S3Client } from "@aws-sdk/client-s3";
import { createAdminClient } from '@/utils/supabase/server';

export interface R2Credentials {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

export async function getR2Credentials(): Promise<R2Credentials> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('integrations')
    .select('key, value')
    .in('key', ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL']);

  if (error) throw new Error(`Failed to load R2 integrations: ${error.message}`);

  const integrations = data || [];
  const find = (key: string) => integrations.find(r => r.key === key)?.value;
  
  const { maybeDecryptStoredValue } = await import('@/lib/integrations');

  const credentials = {
    accountId: (await maybeDecryptStoredValue(find('R2_ACCOUNT_ID') || '')).trim(),
    accessKeyId: (await maybeDecryptStoredValue(find('R2_ACCESS_KEY_ID') || '')).trim(),
    secretAccessKey: (await maybeDecryptStoredValue(find('R2_SECRET_ACCESS_KEY') || '')).trim(),
    bucketName: (await maybeDecryptStoredValue(find('R2_BUCKET_NAME') || '')).trim(),
    publicUrl: (await maybeDecryptStoredValue(find('R2_PUBLIC_URL') || '')).trim(),
  };

  if (credentials.publicUrl && credentials.publicUrl.includes('https:/') && !credentials.publicUrl.includes('https://')) {
    credentials.publicUrl = credentials.publicUrl.replace('https:/', 'https://');
  }

  return credentials;
}

export async function getS3Client(): Promise<S3Client> {
  const { accountId, accessKeyId, secretAccessKey } = await getR2Credentials();

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 configuration incomplete. Check Admin -> Integrations.');
  }

  const cleanAccountId = accountId.replace(/^https?:\/\//, '').replace(/\.r2\.cloudflarestorage\.com$/, '').replace(/\/$/, '').trim();

  return new S3Client({
    region: "auto",
    endpoint: `https://${cleanAccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
    },
    forcePathStyle: true,
    // CRITICAL: Force FETCH handler to bypass Node.js 'fs/http' modules entirely on Cloudflare
    requestHandler: {
      handle: async (request: any) => {
        const { method, url, headers, body } = request;
        const response = await fetch(url, { method, headers, body });
        return { response: { statusCode: response.status, headers: Object.fromEntries(response.headers.entries()), body: response.body } };
      }
    } as any,
  });
}
