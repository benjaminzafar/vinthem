import { NextRequest, NextResponse } from 'next/server';
import { s3Client } from '@/lib/s3';
import { ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { requireAdminUser } from '@/lib/admin';

// Helper to verify admin status
async function verifyAdmin() {
  try {
    const { user } = await requireAdminUser();
    return { user };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return {
      error: message === 'Admin access required.' ? 'Forbidden' : 'Unauthorized',
      status: message === 'Admin access required.' ? 403 : 401,
    };
  }
}

export async function GET(req: NextRequest) {
  const adminCheck = await verifyAdmin();
  if (adminCheck.error) return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });

  const { searchParams } = new URL(req.url);
  const prefix = searchParams.get('prefix') || '';
  const continuationToken = searchParams.get('token') || undefined;

  const bucketName = process.env.R2_BUCKET_NAME;
  if (!bucketName) return NextResponse.json({ error: 'R2_BUCKET_NAME not configured' }, { status: 500 });

  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      Delimiter: '/',
      ContinuationToken: continuationToken,
      MaxKeys: 1000 // Reasonable batch
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
        url: `${process.env.R2_PUBLIC_URL}/${obj.Key}`
      }));

    // For overall stats, we still might want totals, 
    // but usually, a specific folder fetch doesn't need global stats.
    // However, to keep compatibility with existing UI for now:
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
    console.error('[Media API GET Error]:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const adminCheck = await verifyAdmin();
  if (adminCheck.error) return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });

  try {
    const body = await req.json();
    // Use decodeURIComponent to handle special characters in keys (spaces, ampersands, etc.)
    const key = body.key ? decodeURIComponent(body.key) : null;
    
    if (!key) return NextResponse.json({ error: 'Missing object key' }, { status: 400 });

    const bucketName = process.env.R2_BUCKET_NAME;

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
    console.error('[Media API DELETE Error]:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
