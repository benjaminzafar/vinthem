import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const context = await getCloudflareContext({ async: true });
    const bucket = context.env.MEDIA_BUCKET;

    if (!bucket) {
      return NextResponse.json({
        ok: false,
        step: 'binding',
        error: 'MEDIA_BUCKET binding is missing from runtime.',
      }, { status: 500 });
    }

    const probe = await bucket.list({ limit: 1 });

    return NextResponse.json({
      ok: true,
      step: 'binding-list',
      truncated: probe.truncated,
      objectCountProbe: probe.objects.length,
      hasCursor: Boolean(probe.cursor),
    });
  } catch (error: unknown) {
    return NextResponse.json({
      ok: false,
      step: 'exception',
      error: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'UnknownError',
    }, { status: 500 });
  }
}
