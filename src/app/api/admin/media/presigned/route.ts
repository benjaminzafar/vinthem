import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";

export async function POST(req: NextRequest) {
  try {
    const { path, contentType } = await req.json();

    if (!path) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    // 1. Verify Admin Session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const allowedEmails = ['benjaminzafar10@gmail.com', 'benjaminzafar7@gmail.com'];
    const isAdmin = profile?.role === 'admin' || allowedEmails.includes(user.email ?? '');

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

  } catch (error: any) {
    console.error('Presigned URL Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
