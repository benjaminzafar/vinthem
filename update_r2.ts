import { createAdminClient } from './src/utils/supabase/server';

async function updateR2() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('integrations')
    .upsert(
      { key: 'R2_PUBLIC_URL', value: 'https://cdn.vinthem.com' },
      { onConflict: 'key' }
    );
  
  if (error) {
    console.error('Error updating R2_PUBLIC_URL:', error);
    process.exit(1);
  }
  
  console.log('Successfully updated R2_PUBLIC_URL to https://cdn.vinthem.com');
  process.exit(0);
}

updateR2();
