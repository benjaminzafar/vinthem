import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

async function testR2() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // 1. Fetch Integrations
  console.log('--- Fetching Integrations ---');
  const { data: integrations, error: intError } = await supabase
    .from('integrations')
    .select('key, value');
  
  if (intError) {
    console.error('Error fetching integrations:', intError);
    return;
  }

  const find = (key: string) => integrations?.find(i => i.key === key)?.value;
  
  console.log('R2_PUBLIC_URL:', find('R2_PUBLIC_URL'));
  console.log('R2_BUCKET_NAME:', find('R2_BUCKET_NAME'));
  console.log('R2_ACCOUNT_ID:', find('R2_ACCOUNT_ID'));

  // 2. Test URL construction logic (simulating the API)
  const publicUrl = find('R2_PUBLIC_URL') || '';
  const baseUrl = publicUrl.replace(/\/$/, '');
  
  // Let's test with the problematic filename from the screenshot
  const testKey = 'categories/1776162421107_Gifts & Home Decor (1).jpg';
  const encodedKey = testKey.split('/').map(segment => encodeURIComponent(segment)).join('/');
  const finalUrl = `${baseUrl}/${encodedKey}`;

  console.log('\n--- Test URL Generation ---');
  console.log('Input Key:', testKey);
  console.log('Encoded Key:', encodedKey);
  console.log('Generated URL:', finalUrl);

  console.log('\n--- Checking if URL is reachable ---');
  try {
    const res = await fetch(finalUrl, { method: 'HEAD' });
    console.log('Status:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));
    if (res.status !== 200) {
      console.warn('WARNING: URL is returned non-200 status. Check Cloudflare Public Access.');
    } else {
      console.log('SUCCESS: URL is reachable!');
    }
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

testR2();
