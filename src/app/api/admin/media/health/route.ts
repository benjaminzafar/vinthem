import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getS3Client, hasMediaBucketBinding } from '@/lib/s3';

export const runtime = 'edge';

export async function GET() {
  try {
    const bindingAvailable = await hasMediaBucketBinding();

    if (!bindingAvailable) {
      return NextResponse.json({
        ok: false,
        step: 'binding',
        error: 'MEDIA_BUCKET binding is not available in the Cloudflare runtime.',
      }, { status: 500 });
    }

    const context = await getCloudflareContext({ async: true });
    const bucketName = context.env.MEDIA_BUCKET ? 'MEDIA_BUCKET_ATTACHED' : 'MISSING';

    const s3Client = await getS3Client();
    const probe = await s3Client.list('', { maxKeys: 1 });

    return NextResponse.json({
      ok: true,
      step: 'list',
      binding: bucketName,
      objectCountProbe: probe.Contents?.length ?? 0,
      nextToken: probe.NextContinuationToken ?? null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      ok: false,
      step: 'exception',
      error: message,
      name: error instanceof Error ? error.name : 'UnknownError',
    }, { status: 500 });
  }
}
