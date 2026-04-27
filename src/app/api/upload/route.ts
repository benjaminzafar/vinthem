import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireAdminUser } from '@/lib/admin';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file || !path) {
      return NextResponse.json({ error: 'Missing file or path' }, { status: 400 });
    }

    let userContext;
    try {
      const { getSessionUserWithRole } = await import('@/lib/admin');
      userContext = await getSessionUserWithRole();
      
      if (!userContext.user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      // Authorization Logic:
      // 1. Admins can upload anywhere.
      // 2. Clients can ONLY upload to support/{userId}/...
      if (!userContext.isAdmin) {
        const isSupportPath = path.startsWith('support/');
        const isOwnPath = path.startsWith(`support/${userContext.user.id}/`);
        
        if (!isSupportPath || !isOwnPath) {
          return NextResponse.json({ error: 'Forbidden: Insufficient permissions for this path' }, { status: 403 });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Auth error';
      return NextResponse.json({ error: message }, { status: 401 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { getR2Credentials, getS3Client } = await import("@/lib/s3");
    const credentials = await getR2Credentials();
    const { bucketName, publicUrl, accountId } = credentials;
    const s3Client = await getS3Client();
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");

    if (!bucketName) {
      return NextResponse.json({ error: 'Configuration Error: R2_BUCKET_NAME is missing. Please check Admin -> Integrations.' }, { status: 500 });
    }

    // Sanitize path: remove spaces and special characters that often break S3 uploads
    const sanitizedPath = path.replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, '_');

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: sanitizedPath,
          Body: buffer,
          ContentType: file.type || 'application/octet-stream',
        })
      );

      const baseUrl = publicUrl ? publicUrl.replace(/\/$/, '') : `https://${accountId}.r2.cloudflarestorage.com/${bucketName}`;
      const encodedPath = sanitizedPath.split('/').map(segment => encodeURIComponent(segment)).join('/');
      const finalUrl = `${baseUrl}/${encodedPath}`;
      return NextResponse.json({ url: finalUrl });
    } catch (uploadError: any) {
      const message = uploadError?.message || 'S3/R2 Network Error during upload';
      logger.error('R2 Upload Error:', message);
      return NextResponse.json({ error: `R2 Storage Error: ${message}` }, { status: 500 });
    }
  } catch (error: any) {
    const msg = error?.message || 'Server-side processing failed';
    logger.error('Global Upload Route Error:', msg);
    return NextResponse.json({ error: `Upload Route Error: ${msg}` }, { status: 500 });
  }
}

