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

    try {
      await requireAdminUser();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unauthorized';
      const status = message === 'Admin access required.' ? 403 : 401;
      return NextResponse.json({ error: message }, { status });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { getR2Credentials, getS3Client } = await import("@/lib/s3");
    const { bucketName, publicUrl, accountId } = await getR2Credentials();
    const s3Client = await getS3Client();
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");

    if (!bucketName) {
      return NextResponse.json({ error: 'R2_BUCKET_NAME is not configured' }, { status: 500 });
    }

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: path,
          Body: buffer,
          ContentType: file.type || 'application/octet-stream',
        })
      );

      const baseUrl = publicUrl ? publicUrl.replace(/\/$/, '') : `https://${accountId}.r2.cloudflarestorage.com/${bucketName}`;
      const finalUrl = `${baseUrl}/${path}`;

      return NextResponse.json({ url: finalUrl });
    } catch (uploadError: unknown) {
      const message = uploadError instanceof Error ? uploadError.message : 'Upload failed';
      logger.error('R2 Upload Error:', message);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

