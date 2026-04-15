import { NextRequest, NextResponse } from 'next/server';
import { encrypt } from '@/lib/encryption';
import { requireAdminBearerUser } from '@/lib/admin';

export async function POST(req: NextRequest) {
  try {
    const { supabase } = await requireAdminBearerUser(req.headers.get('Authorization'));

    const updates = await req.json();
    if (typeof updates !== 'object' || updates === null) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Encrypt and upsert each key — encrypted value never returned to frontend
    const now = new Date().toISOString();
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'string' && value.trim() !== '') {
        const sanitizedValue = value.replace(/[<>]/g, '');
        const encryptedValue = encrypt(sanitizedValue);

        const { error: upsertError } = await supabase
          .from('integrations')
          .upsert({ key, value: encryptedValue, updated_at: now }, { onConflict: 'key' });

        if (upsertError) throw upsertError;
      }
    }

    return NextResponse.json({ success: true, message: 'Settings encrypted and saved securely.' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Integrations encrypt error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
