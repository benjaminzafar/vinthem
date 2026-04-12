import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { encrypt } from '@/lib/encryption';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Check if user is admin
    const userDocRef = adminDb.collection('users').doc(decodedToken.uid);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const updates = await req.json();
    if (typeof updates !== 'object' || updates === null) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Encrypt the sensitive keys using AES-256
    const encryptedUpdates: Record<string, string> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'string' && value.trim() !== '') {
        // Sanitize string value before encrypting
        const sanitizedValue = value.replace(/[<>]/g, '');
        encryptedUpdates[key] = encrypt(sanitizedValue);
      }
    }

    // Since the frontend performs the actual writeBatch using these encrypted values, 
    // we return them. Wait: "When admin saves an API key, backend encrypts and saves directly to Firestore."
    // The instruction says backend MUST save directly to Firestore, so we shouldn't return it!
    const batch = adminDb.batch();
    for (const [key, value] of Object.entries(encryptedUpdates)) {
      const docRef = adminDb.collection('integrations').doc(key);
      batch.set(docRef, { value, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    }
    
    await batch.commit();

    return NextResponse.json({ success: true, message: 'Settings encrypted and saved securely.' });
  } catch (error: any) {
    console.error('Integrations encrypt error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
