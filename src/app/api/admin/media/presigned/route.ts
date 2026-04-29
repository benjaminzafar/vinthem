import { NextRequest, NextResponse } from 'next/server';
import { requireAdminBearerUser, requireAdminUser } from '@/lib/admin';
import { toMediaProxyUrl } from '@/lib/media';
import { getR2Credentials, getS3Client } from '@/lib/s3';

export const runtime = 'nodejs';

async function requireAdminPresignedAccess(req: NextRequest) {
  const authorizationHeader = req.headers.get('authorization');
  if (authorizationHeader) {
    return requireAdminBearerUser(authorizationHeader);
  }

  return requireAdminUser();
}

function normalizeMediaPath(path: string) {
  const trimmedPath = path.trim().replace(/^\/+/, '').replace(/\\/g, '/');
  if (!trimmedPath || trimmedPath.includes('..')) {
    throw new Error('Invalid path');
  }

  return trimmedPath;
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminPresignedAccess(req);

    const { path, contentType } = await req.json();

    if (!path) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    const normalizedPath = normalizeMediaPath(path);

    const { bucketName, publicUrl, accountId } = await getR2Credentials();

    if (!bucketName || bucketName === 'DECRYPTION_FAILED') {
      return NextResponse.json({ error: 'R2_BUCKET_NAME not configured' }, { status: 500 });
    }
    if (!accountId || accountId === 'DECRYPTION_FAILED') {
      return NextResponse.json({ error: 'R2_ACCOUNT_ID not configured' }, { status: 500 });
    }

    const s3Client = await getS3Client();
    const signedUrl = await s3Client.getPresignedUrl(
      normalizedPath, 
      contentType || 'application/octet-stream', 
      900
    );

    const encodedPath = normalizedPath.split('/').map((segment) => encodeURIComponent(segment)).join('/');
    const finalPublicUrl = publicUrl 
      ? `${publicUrl.replace(/\/$/, '')}/${encodedPath}`
      : `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${encodedPath}`;

    return NextResponse.json({ 
      uploadUrl: signedUrl,
      publicUrl: toMediaProxyUrl(finalPublicUrl)
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate upload URL';
    // Removed console.error for production hardening
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

