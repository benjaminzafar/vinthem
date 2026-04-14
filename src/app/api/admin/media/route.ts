import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { s3Client } from '@/lib/s3';
import { ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';

const ADMIN_EMAILS = new Set([
  'benjaminzafar10@gmail.com',
  'benjaminzafar7@gmail.com',
]);

// Helper to verify admin status
async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Unauthorized', status: 401 };

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.has(user.email ?? '');
  if (!isAdmin) return { error: 'Forbidden', status: 403 };

  return { user };
}

export async function GET() {
  const adminCheck = await verifyAdmin();
  if (adminCheck.error) return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });

  const bucketName = process.env.R2_BUCKET_NAME;
  if (!bucketName) return NextResponse.json({ error: 'R2_BUCKET_NAME not configured' }, { status: 500 });

  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
    });

    const data = await s3Client.send(command);
    const objects = data.Contents || [];
    
    // Sort by LastModified descending
    objects.sort((a: any, b: any) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0));

    const totalSize = objects.reduce((acc, obj) => acc + (obj.Size || 0), 0);
    const fileCount = objects.length;

    return NextResponse.json({
      objects: objects.map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        url: `${process.env.R2_PUBLIC_URL}/${obj.Key}`
      })),
      stats: {
        totalSize,
        fileCount
      }
    });
  } catch (error: any) {
    console.error('[Media API GET Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const adminCheck = await verifyAdmin();
  if (adminCheck.error) return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });

  try {
    const { key } = await req.json();
    if (!key) return NextResponse.json({ error: 'Missing object key' }, { status: 400 });

    const bucketName = process.env.R2_BUCKET_NAME;
    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    }));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Media API DELETE Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
