import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const ADMIN_EMAILS = new Set([
  'benjaminzafar10@gmail.com',
  'benjaminzafar7@gmail.com',
]);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file || !path) {
      return NextResponse.json({ error: 'Missing file or path' }, { status: 400 });
    }

    // Verify auth using the standard client
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.has(user.email ?? '');
    if (profileError || !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    } catch (uploadError: any) {
      console.error('R2 Upload Error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
