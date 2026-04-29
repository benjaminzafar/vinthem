import 'server-only';
import { S3Client } from "@aws-sdk/client-s3";
import { createAdminClient } from '@/utils/supabase/server';
import { maybeDecryptStoredValue } from '@/lib/integrations';

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
  
  const accountId = (await maybeDecryptStoredValue(integrations.find((row) => row.key === 'R2_ACCOUNT_ID')?.value)).trim();
  const accessKeyId = (await maybeDecryptStoredValue(integrations.find((row) => row.key === 'R2_ACCESS_KEY_ID')?.value)).trim();
  const secretAccessKey = (await maybeDecryptStoredValue(integrations.find((row) => row.key === 'R2_SECRET_ACCESS_KEY')?.value)).trim();

  if (!accountId) {
    throw new Error('R2 account ID is missing from encrypted integrations.');
  }

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('R2 access credentials are missing from encrypted integrations.');
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
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
