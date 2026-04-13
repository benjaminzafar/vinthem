import React from 'react';
import { createClient } from '@/utils/supabase/server';
import AboutClient from './AboutClient';

export async function generateMetadata() {
  const supabase = await createClient();
  const { data: settingsData } = await supabase
    .from('settings')
    .select('data')
    .eq('id', 'primary')
    .single();

  const settings = settingsData?.data || {};
  const lang = 'en';

  return {
    title: settings.aboutHeroTitleText?.[lang] || 'About Us',
    description: settings.aboutPhilosophyDescription1Text?.[lang] || 'Learn about our journey and philosophy.',
  };
}

export default async function About() {
  const supabase = await createClient();

  // Fetch settings on the server
  const { data: settingsData } = await supabase
    .from('settings')
    .select('data')
    .eq('id', 'primary')
    .single();

  const settings = settingsData?.data || {};
  const lang = 'en'; // Default or handle via cookies/headers

  return (
    <AboutClient settings={settings} lang={lang} />
  );
}
