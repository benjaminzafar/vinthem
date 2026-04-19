import { NextRequest, NextResponse } from 'next/server';
import { getS3Client } from '@/lib/s3';
import { ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const prefix = searchParams.get('prefix') || '';
  const continuationToken = searchParams.get('token') || undefined;

  const { getR2Credentials, getS3Client } = await import("@/lib/s3");
  const { bucketName, publicUrl } = await getR2Credentials();

  if (!bucketName) return NextResponse.json({ error: 'R2_BUCKET_NAME not configured' }, { status: 500 });
  
  try {
    const s3Client = await getS3Client();
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      Delimiter: '/',
      ContinuationToken: continuationToken,
      MaxKeys: 50 // Faster batch for infinite scroll
    });

    const data = await s3Client.send(command);
    
    // Folders come from CommonPrefixes
    const folders = data.CommonPrefixes?.map(cp => cp.Prefix?.slice(prefix.length).replace(/\/$/, '')).filter(Boolean) || [];
    
    // Files come from Contents
    const files = (data.Contents || [])
      .filter(obj => obj.Key !== prefix) // Don't include the folder itself
      .map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        url: publicUrl ? `${publicUrl.replace(/\/$/, '')}/${obj.Key}` : `${process.env.R2_PUBLIC_URL}/${obj.Key}`
      }));

    const statsResult = {
      totalSize: files.reduce((acc, f) => acc + (f.size || 0), 0),
      fileCount: files.length,
      nextContinuationToken: data.NextContinuationToken
    };

    return NextResponse.json({
      folders: folders.sort(),
      objects: files,
      stats: statsResult
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load media';
    // Removed console.error for production hardening (Rule 5/8)
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const key = body.key ? decodeURIComponent(body.key) : null;
    
    if (!key) return NextResponse.json({ error: 'Missing object key' }, { status: 400 });

    const { getR2Credentials, getS3Client } = await import("@/lib/s3");
    const { bucketName } = await getR2Credentials();
    const s3Client = await getS3Client();

    // Recursive delete for prefixes (folders)
    if (key.endsWith('/')) {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: key
      });
      const listedObjects = await s3Client.send(listCommand);
      
      if (listedObjects.Contents && listedObjects.Contents.length > 0) {
        const { DeleteObjectsCommand } = await import('@aws-sdk/client-s3');
        const deleteParams = {
          Bucket: bucketName,
          Delete: {
            Objects: listedObjects.Contents.map(({ Key }) => ({ Key }))
          }
        };
        await s3Client.send(new DeleteObjectsCommand(deleteParams));
      }
    } else {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key
      }));
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete media';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
