import { NextRequest, NextResponse } from 'next/server';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getS3Client } from "@/lib/s3";

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { path, contentType } = await req.json();

    if (!path) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    // Generate Presigned URL
    const { getR2Credentials, getS3Client } = await import("@/lib/s3");
    const { bucketName, publicUrl, accountId } = await getR2Credentials();

    if (!bucketName) {
      return NextResponse.json({ error: 'R2_BUCKET_NAME not configured' }, { status: 500 });
    }

    const s3Client = await getS3Client();
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: path,
      ContentType: contentType || 'application/octet-stream',
    });

    // URL is valid for 15 minutes
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    const finalPublicUrl = publicUrl 
      ? `${publicUrl.replace(/\/$/, '')}/${path}`
      : `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${path}`;

    return NextResponse.json({ 
      uploadUrl: signedUrl,
      publicUrl: finalPublicUrl
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate upload URL';
    // Removed console.error for production hardening
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

