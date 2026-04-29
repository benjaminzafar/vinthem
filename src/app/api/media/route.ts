import { NextRequest, NextResponse } from 'next/server';
import { getS3Client } from '@/lib/s3';

export const runtime = 'edge';

function normalizeMediaKey(key: string) {
  const trimmed = key.trim().replace(/^\/+/, '').replace(/\\/g, '/');
  if (!trimmed || trimmed.includes('..')) {
    throw new Error('Invalid media key');
  }

  return trimmed;
}

function toReadableStream(body: unknown): ReadableStream<Uint8Array> {
  if (body instanceof ReadableStream) {
    return body;
  }

  if (body && typeof body === 'object') {
    const bodyWithTransform = body as { transformToWebStream?: () => ReadableStream<Uint8Array> };
    if (typeof bodyWithTransform.transformToWebStream === 'function') {
      return bodyWithTransform.transformToWebStream();
    }
  }

  throw new Error('Unsupported media response body');
}

export async function GET(req: NextRequest) {
  try {
    const rawKey = req.nextUrl.searchParams.get('key');
    if (!rawKey) {
      return NextResponse.json({ error: 'Missing media key' }, { status: 400 });
    }

    const key = normalizeMediaKey(rawKey);
    const s3Client = await getS3Client();
    const mediaObject = await s3Client.getObject(key);

    if (!mediaObject.Body) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    return new NextResponse(toReadableStream(mediaObject.Body), {
      headers: {
        'Content-Type': mediaObject.ContentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        ...(mediaObject.ETag ? { ETag: mediaObject.ETag } : {}),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load media';
    const status = message === 'NoSuchKey' || message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
