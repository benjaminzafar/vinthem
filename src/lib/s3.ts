import 'server-only';
import { S3Client } from "@aws-sdk/client-s3";
import { createAdminClient } from '@/utils/supabase/server';

type IntegrationRow = {
  key: string;
  value: string | null;
};

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

  if (error) {
    throw new Error(`Failed to load R2 integrations: ${error.message}`);
  }

  const integrations = (data ?? []) as IntegrationRow[];

  const accountIdRaw = integrations.find((row) => row.key === 'R2_ACCOUNT_ID')?.value;
  const encryptedAccessKey = integrations.find((row) => row.key === 'R2_ACCESS_KEY_ID')?.value;
  const encryptedSecretKey = integrations.find((row) => row.key === 'R2_SECRET_ACCESS_KEY')?.value;
  const bucketNameRaw = integrations.find((row) => row.key === 'R2_BUCKET_NAME')?.value;
  const publicUrlRaw = integrations.find((row) => row.key === 'R2_PUBLIC_URL')?.value;

  const { maybeDecryptStoredValue } = await import('@/lib/integrations');

  const credentials = {
    accountId: (accountIdRaw ? await maybeDecryptStoredValue(accountIdRaw) : '').trim(),
    accessKeyId: (encryptedAccessKey ? await maybeDecryptStoredValue(encryptedAccessKey) : '').trim(),
    secretAccessKey: (encryptedSecretKey ? await maybeDecryptStoredValue(encryptedSecretKey) : '').trim(),
    bucketName: (bucketNameRaw ? await maybeDecryptStoredValue(bucketNameRaw) : '').trim(),
    publicUrl: (publicUrlRaw ? await maybeDecryptStoredValue(publicUrlRaw) : '').trim(),
  };

  // Fix malformed https:/ URLs
  if (credentials.publicUrl && credentials.publicUrl.includes('https:/') && !credentials.publicUrl.includes('https://')) {
    credentials.publicUrl = credentials.publicUrl.replace('https:/', 'https://');
  }

  return credentials;
}

export async function getS3Client(): Promise<S3Client> {
  const { accountId, accessKeyId, secretAccessKey } = await getR2Credentials();

  if (!accountId || !accessKeyId || !secretAccessKey) {
    const missing: string[] = [];
    if (!accountId) missing.push('Account ID');
    if (!accessKeyId) missing.push('Access Key ID');
    if (!secretAccessKey) missing.push('Secret Access Key');
    throw new Error(`R2 configuration incomplete. Missing: ${missing.join(', ')}. Please update in Admin -> Integrations.`);
  }

  const cleanAccountId = accountId.trim()
    .replace(/^https?:\/\//, '')
    .replace(/\.r2\.cloudflarestorage\.com$/, '')
    .replace(/\/$/, '');

  return new S3Client({
    region: "auto",
    endpoint: `https://${cleanAccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
    },
    forcePathStyle: true,
    // fetch-based requestHandler: avoids Node.js 'fs' module, compatible with Cloudflare Workers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    requestHandler: { metadata: { handlerProtocol: "fetch" } } as any,
  });
}
