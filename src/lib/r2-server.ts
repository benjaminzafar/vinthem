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
}

export async function getR2Credentials(): Promise<R2Credentials> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('integrations')
    .select('key, value')
    .in('key', ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']);

  if (error) {
    throw new Error(`Failed to load R2 integrations: ${error.message}`);
  }

  const integrations = (data ?? []) as IntegrationRow[];
  
  const accountId = integrations.find((row) => row.key === 'R2_ACCOUNT_ID')?.value;
  const encryptedAccessKey = integrations.find((row) => row.key === 'R2_ACCESS_KEY_ID')?.value;
  const encryptedSecretKey = integrations.find((row) => row.key === 'R2_SECRET_ACCESS_KEY')?.value;

  return {
    accountId: accountId || process.env.R2_ACCOUNT_ID || '',
    accessKeyId: encryptedAccessKey ? decrypt(encryptedAccessKey) : (process.env.R2_ACCESS_KEY_ID || ''),
    secretAccessKey: encryptedSecretKey ? decrypt(encryptedSecretKey) : (process.env.R2_SECRET_ACCESS_KEY || ''),
  };
}

export async function getS3Client(): Promise<S3Client> {
  const { accountId, accessKeyId, secretAccessKey } = await getR2Credentials();

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
    forcePathStyle: true,
  });
}
