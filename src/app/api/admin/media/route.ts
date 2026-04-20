import { NextRequest, NextResponse } from 'next/server';
import { getS3Client } from '@/lib/s3';
import { ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { requireAdminUser } from '@/lib/admin';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    await requireAdminUser();
    
    const { searchParams } = new URL(req.url);
    const prefix = searchParams.get('prefix') || '';
    const continuationToken = searchParams.get('token') || undefined;
    const isDebug = searchParams.get('debug') === 'true';

    const { getR2Credentials, getS3Client } = await import("@/lib/s3");
    const { bucketName, publicUrl, accountId } = await getR2Credentials();

    if (!bucketName) return NextResponse.json({ error: 'R2_BUCKET_NAME not configured' }, { status: 500 });
  
    const s3Client = await getS3Client();
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      Delimiter: '/',
      ContinuationToken: continuationToken,
      MaxKeys: 50
    });

    const data = await s3Client.send(command).catch(err => {
      logger.error('R2 List Error:', err);
      throw err;
    });
    
    // Folders come from CommonPrefixes
    const folders = data.CommonPrefixes?.map(cp => cp.Prefix?.slice(prefix.length).replace(/\/$/, '')).filter(Boolean) || [];
    
    // Files come from Contents
    const files = (data.Contents || [])
      .filter(obj => obj.Key && obj.Key !== prefix)
      .map(obj => {
        const key = obj.Key as string;
        let url = '';
        
        if (publicUrl) {
           const baseUrl = publicUrl.replace(/\/$/, '');
           url = `${baseUrl}/${key}`;
        } else {
           // Fallback to env or construct
           const envUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');
           url = envUrl ? `${envUrl}/${key}` : '';
        }

        return {
          key: key,
          size: obj.Size,
          lastModified: obj.LastModified,
          url: url
        };
      })
      .filter(f => f.url);

    const statsResult = {
      totalSize: files.reduce((acc, f) => acc + (f.size || 0), 0),
      fileCount: files.length,
      nextContinuationToken: data.NextContinuationToken
    };

    return NextResponse.json({
      folders: folders.sort(),
      objects: files,
      stats: statsResult,
      ...(isDebug ? { 
        debug: {
            bucketName,
            prefix,
            accountId: accountId?.slice(0, 4) + '...',
            publicUrl: publicUrl?.slice(0, 10) + '...',
            rawResponse: {
                isTruncated: data.IsTruncated,
                keyCount: data.KeyCount,
                maxKeys: data.MaxKeys,
                commonPrefixesCount: data.CommonPrefixes?.length || 0,
                contentsCount: data.Contents?.length || 0
            }
        }
      } : {})
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load media';
    logger.error('[Media API Error]:', message);
    
    // Return structured error
    return NextResponse.json({ 
        error: message,
        code: (error as any)?.name || 'UNKNOWN_ERROR',
        suggestion: message.includes('AccessKeyId') ? 'Verify your Access Key ID and Secret in Integrations.' : 
                   message.includes('Bucket') ? 'Verify that the bucket name "onlineshop" exists in your Cloudflare dashboard.' : 
                   undefined
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdminUser();
    
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

