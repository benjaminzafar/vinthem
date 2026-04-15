import { NextRequest, NextResponse } from 'next/server';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";
import { requireAdminUser } from '@/lib/admin';

export async function POST(req: NextRequest) {
  try {
    const { path, contentType } = await req.json();

    if (!path) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    await requireAdminUser();

    // 2. Generate Presigned URL
    const bucketName = process.env.R2_BUCKET_NAME;
    if (!bucketName) {
      return NextResponse.json({ error: 'R2_BUCKET_NAME not configured' }, { status: 500 });
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: path,
      ContentType: contentType || 'application/octet-stream',
    });

    // URL is valid for 15 minutes
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    const publicUrl = process.env.R2_PUBLIC_URL 
      ? `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${path}`
      : `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}/${path}`;

    return NextResponse.json({ 
      uploadUrl: signedUrl,
      publicUrl: publicUrl
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate upload URL';
    console.error('Presigned URL Error:', message);
    const status = message === 'Authentication required.' ? 401 : message === 'Admin access required.' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
