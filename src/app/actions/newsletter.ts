'use server';

import { createAdminClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export type NewsletterResponse = {
  success: boolean;
  message: string;
  error?: string;
};

/**
 * Newsletter Subscription Server Action
 * Securely handles email signups without exposing API keys to the client.
 */
export async function subscribeAction(formData: FormData): Promise<NewsletterResponse> {
  const email = formData.get('email') as string;

  if (!email || !email.includes('@')) {
    return { success: false, message: 'Invalid email address provided.' };
  }

  try {
    const supabase = createAdminClient();
    
    // Check if already exists
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return { success: true, message: 'You are already subscribed!' };
    }

    // Insert new subscriber
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ 
        email, 
        source: 'storefront_footer',
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    // Optional: Trigger a revalidate if the storefront displays subscriber counts
    revalidatePath('/');
    
    return { success: true, message: 'Subscribed successfully!' };
  } catch (error: any) {
    console.error('[Action Error] subscribeAction:', error);
    return { success: false, message: 'Failed to subscribe. Please try again later.', error: error.message };
  }
}
