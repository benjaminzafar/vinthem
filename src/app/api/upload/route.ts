import { NextRequest, NextResponse } from 'next/server';
import { getBearerUserWithRole } from '@/lib/admin';
import { logger } from '@/lib/logger';
import { getS3Client, hasMediaBucketBinding, toMediaProxyKeyUrl } from '@/lib/s3';

function normalizeUploadPath(path: string) {
  const trimmedPath = path.trim().replace(/^\/+/, '').replace(/\\/g, '/');
  if (!trimmedPath || trimmedPath.includes('..')) {
    throw new Error('Invalid upload path');
  }

  return trimmedPath.replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, '_');
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file || !path) {
      return NextResponse.json({ error: 'Missing file or path' }, { status: 400 });
    }

    const authorizationHeader = req.headers.get('authorization');
    const userContext = authorizationHeader
      ? await getBearerUserWithRole(authorizationHeader)
      : await (await import('@/lib/admin')).getSessionUserWithRole();
    
    if (!userContext.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const sanitizedPath = normalizeUploadPath(path);

    if (!userContext.isAdmin) {
      const isSupportPath = sanitizedPath.startsWith('support/');
      const isOwnPath = sanitizedPath.startsWith(`support/${userContext.user.id}/`);
      if (!isSupportPath || !isOwnPath) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const usesBinding = await hasMediaBucketBinding();
    if (!usesBinding) {
      return NextResponse.json({ error: 'MEDIA_BUCKET binding is not configured for this deployment.' }, { status: 500 });
    }

    const s3Client = await getS3Client();
    await s3Client.upload(sanitizedPath, arrayBuffer, file.type || 'application/octet-stream');

    return NextResponse.json({ url: toMediaProxyKeyUrl(sanitizedPath) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    logger.error('Upload Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

