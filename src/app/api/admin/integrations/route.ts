import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const adminClient = createAdminClient();

    // Verify the JWT and get user
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // Check admin role in users table
    const { data: userDoc, error: userError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin =
      (!userError && userDoc?.role === 'admin') ||
      user.email === 'benjaminzafar10@gmail.com' ||
      user.email === 'benjaminzafar7@gmail.com';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all integration keys
    const { data, error } = await adminClient
      .from('integrations')
      .select('key');

    if (error) throw error;

    // Return a map of keys that are "Connected"
    const config: Record<string, string> = {};
    data?.forEach((row: { key: string }) => {
      config[row.key] = '********'; // Masked value or just a truthy placeholder
      config[`${row.key}_CONNECTED`] = 'true';
    });

    return NextResponse.json(config);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Integrations GET error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
