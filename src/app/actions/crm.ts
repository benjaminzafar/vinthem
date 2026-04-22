'use server';

import { createAdminClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';
import { requireAdminUser } from '@/lib/admin';
import { 
  CRMUser, 
  SupportTicket, 
  RefundRequest, 
  AdminOrder, 
  Review, 
  NewsletterSubscriber, 
  NewsletterCampaign,
  CRMData
} from '@/types';

export async function getCRMDataAction(): Promise<{ success: boolean; data?: CRMData; error?: string }> {
  try {
    // 1. Authorization check
    await requireAdminUser();

    // 2. Fetch data using privileged client to bypass RLS
    const adminSupabase = createAdminClient();
    
    const [usersRes, authUsersRes, ticketsRes, refundsRes, ordersRes, reviewsRes, subsRes, campsRes] = await Promise.all([
      adminSupabase.from('users').select('*').order('created_at', { ascending: false }),
      adminSupabase.auth.admin.listUsers({ perPage: 1000 }), // Deep discovery from Auth layer
      adminSupabase.from('support_tickets').select('*').order('created_at', { ascending: false }),
      adminSupabase.from('refund_requests').select('*').order('created_at', { ascending: false }),
      adminSupabase.from('orders').select('*').order('created_at', { ascending: false }),
      adminSupabase.from('reviews').select('*').order('created_at', { ascending: false }),
      adminSupabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false }),
      adminSupabase.from('newsletter_campaigns').select('*').order('sent_at', { ascending: false }),
    ]);

    // 3. Intelligent Identity Merging
    const publicUsers = usersRes.data || [];
    const authUsers = authUsersRes.data?.users || [];
    
    // Create a unified list starting with all Auth users (the source of truth for registration)
    const unifiedUsers = authUsers.map(authUser => {
      const profile = publicUsers.find(p => p.id === authUser.id);
      return {
        id: authUser.id,
        email: authUser.email,
        full_name: profile?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
        display_name: profile?.display_name || authUser.user_metadata?.display_name || null,
        role: profile?.role || authUser.user_metadata?.role || 'client',
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        is_authenticated: true, // Marker for registration
        preferred_lang: profile?.preferred_lang || 'en'
      };
    });

    // Check for critical errors (optional, but good for logging)
    if (usersRes.error) logger.error('[CRM Action] Error fetching public users:', usersRes.error);
    if (authUsersRes.error) logger.error('[CRM Action] Error fetching auth users:', authUsersRes.error);

    logger.info(`[CRM Action] Sync Success. Counts: AuthUsers: ${authUsers.length}, Orders: ${ordersRes.data?.length || 0}, Tickets: ${ticketsRes.data?.length || 0}`);

    const ticketsRaw = ticketsRes.data || [];
    const refundsRaw = refundsRes.data || [];
    
    // 4. Enrich CRM records with customer locales for Brevo synchronization
    const enrichedTickets = ticketsRaw.map(ticket => {
      const customer = unifiedUsers.find(u => u.id === ticket.user_id || u.email === ticket.customer_email);
      return { ...ticket, locale: customer?.preferred_lang || 'en' };
    });

    const enrichedRefunds = refundsRaw.map(refund => {
      const customer = unifiedUsers.find(u => u.id === refund.user_id);
      return { ...refund, locale: customer?.preferred_lang || 'en' };
    });

    return {
      success: true,
      data: {
        users: unifiedUsers,
        tickets: enrichedTickets,
        refunds: enrichedRefunds,
        orders: ordersRes.data || [],
        reviews: reviewsRes.data || [],
        subscribers: subsRes.data || [],
        campaigns: campsRes.data || [],
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch CRM data.';
    logger.error('[Action Error] getCRMDataAction:', error);
    return {
      success: false,
      error: message,
    };
  }
}
