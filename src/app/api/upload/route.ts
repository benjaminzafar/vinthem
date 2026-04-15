import { NextRequest, NextResponse } from 'next/server';
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

    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { s3Client } = await import("@/lib/s3");

    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL;

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

      const finalUrl = publicUrl 
        ? `${publicUrl.replace(/\/$/, '')}/${path}`
        : `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}/${path}`;

      return NextResponse.json({ url: finalUrl });
    } catch (uploadError: unknown) {
      const message = uploadError instanceof Error ? uploadError.message : 'Upload failed';
      console.error('R2 Upload Error:', message);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
