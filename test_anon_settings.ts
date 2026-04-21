import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkAnonSettings() {
  // Use public key for anon access Simulation
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('settings')
    .select('data')
    .eq('id', 'primary')
    .single();

  if (error) {
    console.log('FAIL: Error fetching settings as ANON:', error);
  } else {
    console.log('SUCCESS: Settings fetched as ANON:', !!data);
  }
}

checkAnonSettings();
