import { NextRequest, NextResponse } from 'next/server';
import { requireAdminBearerUser, requireAdminUser } from '@/lib/admin';
import { logger } from '@/lib/logger';
import { extractMediaKey } from '@/lib/media';
import { getS3Client, hasMediaBucketBinding, toMediaProxyKeyUrl } from '@/lib/s3';

async function requireAdminMediaAccess(req: NextRequest) {
  const authorizationHeader = req.headers.get('authorization');
  if (authorizationHeader) {
    return requireAdminBearerUser(authorizationHeader);
  }

  return requireAdminUser();
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminMediaAccess(req);
    
    const { searchParams } = new URL(req.url);
    const prefix = searchParams.get('prefix') || '';
    const continuationToken = searchParams.get('token') || undefined;

    logger.info('[Media API] Listing prefix:', prefix || 'root');
    
    const usesBinding = await hasMediaBucketBinding();
    if (!usesBinding) {
      logger.error('[Media API] MEDIA_BUCKET binding missing');
      return NextResponse.json({ error: 'MEDIA_BUCKET binding is not configured for this deployment.' }, { status: 500 });
    }
  
    logger.info('[Media API] Initializing S3 Client...');
    const s3Client = await getS3Client();
    
    logger.info('[Media API] Sending list command...');
    const data = await s3Client.list(prefix, {
      continuationToken,
      delimiter: '/',
      maxKeys: 200,
    });
    
    // Folders come from CommonPrefixes
    const folders = data.CommonPrefixes?.map(cp => {
      const folder = cp.Prefix?.slice(prefix.length).replace(/\/$/, '') || '';
      return folder;
    }).filter(Boolean) || [];
    
    // Files come from Contents
    const files = (data.Contents || [])
      .filter(obj => obj.Key && obj.Key !== prefix)
      .map(obj => {
        const key = obj.Key as string;
        return {
          key: key,
          size: obj.Size,
          lastModified: obj.LastModified,
          url: toMediaProxyKeyUrl(key)
        };
      })
      .filter(f => f.url);

    logger.info(`[Media API] Success: ${folders.length} folders, ${files.length} files`);

    return NextResponse.json({
      folders: folders.sort(),
      objects: files,
      stats: {
        totalSize: files.reduce((acc, f) => acc + (f.size || 0), 0),
        fileCount: files.length,
        publicUrlMissing: false,
      },
      nextContinuationToken: data.NextContinuationToken ?? null,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    
    logger.error('[Media API Error]:', { message: errorMessage, stack: errorStack });
    
    return NextResponse.json({ 
      error: errorMessage,
      suggestion: 'Check server logs for the full stack trace. Ensure R2 credentials are valid.',
      details: process.env.NODE_ENV === 'development' ? errorStack : undefined
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdminMediaAccess(req);
    const { searchParams } = new URL(req.url);
    let rawKey = searchParams.get('key');
    let rawUrl = searchParams.get('url');

    if (!rawKey && !rawUrl) {
      try {
        const body = await req.json();
        rawKey = typeof body.key === 'string' ? body.key : null;
        rawUrl = typeof body.url === 'string' ? body.url : null;
      } catch {
        rawKey = null;
        rawUrl = null;
      }
    }

    const key = rawKey
      ? decodeURIComponent(rawKey)
      : rawUrl
        ? extractMediaKey(rawUrl)
        : null;

    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });

    const s3Client = await getS3Client();
    if (key.endsWith('/')) {
      let continuationToken: string | undefined;
      do {
        const data = await s3Client.list(key, {
          continuationToken,
          delimiter: undefined,
          maxKeys: 200,
        });
        const objectKeys = (data.Contents || [])
          .map((object) => object.Key)
          .filter((objectKey): objectKey is string => Boolean(objectKey));

        for (const objectKey of objectKeys) {
          await s3Client.delete(objectKey);
        }

        continuationToken = data.NextContinuationToken;
      } while (continuationToken);
    } else {
      await s3Client.delete(key);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete media asset';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

