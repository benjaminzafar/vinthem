import 'server-only';
import { S3Client } from "@aws-sdk/client-s3";
import { decrypt } from '@/lib/encryption';
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

  // Enforce Rule 11: Priority to Supabase encrypted keys, fallback to env for migration but ideally env should be purged
  const credentials = {
    accountId: accountIdRaw ? maybeDecryptStoredValue(accountIdRaw) : (process.env.R2_ACCOUNT_ID || ''),
    accessKeyId: encryptedAccessKey ? maybeDecryptStoredValue(encryptedAccessKey) : (process.env.R2_ACCESS_KEY_ID || ''),
    secretAccessKey: encryptedSecretKey ? maybeDecryptStoredValue(encryptedSecretKey) : (process.env.R2_SECRET_ACCESS_KEY || ''),
    bucketName: bucketNameRaw ? maybeDecryptStoredValue(bucketNameRaw) : (process.env.R2_BUCKET_NAME || ''),
    publicUrl: publicUrlRaw ? maybeDecryptStoredValue(publicUrlRaw) : (process.env.R2_PUBLIC_URL || ''),
  };

  // Robustness check: Ensure publicUrl is a valid absolute URL and doesn't have protocol mangling
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

  // Ensure accountId doesn't have spaces or protocol
  const cleanAccountId = accountId.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

  return new S3Client({
    region: "auto",
    endpoint: `https://${cleanAccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
    },
    forcePathStyle: true,
  });
}
