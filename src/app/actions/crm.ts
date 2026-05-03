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
      adminSupabase.from('users').select('id, email, full_name, role, created_at, accepted_terms_at').order('created_at', { ascending: false }),
      adminSupabase.auth.admin.listUsers({ perPage: 1000 }), // Deep discovery from Auth layer
      adminSupabase.from('support_tickets').select('id, subject, message, status, created_at, user_id, customer_email, priority').order('created_at', { ascending: false }),
      adminSupabase.from('refund_requests').select('id, order_id, reason, status, created_at, user_id').order('created_at', { ascending: false }),
      adminSupabase.from('orders').select('id, order_id, total, status, created_at, customer_email, user_id, items').order('created_at', { ascending: false }),
      adminSupabase.from('reviews').select('id, product_id, user_id, rating, comment, created_at').order('created_at', { ascending: false }),
      adminSupabase.from('newsletter_subscribers').select('id, email, subscribed_at, source').order('subscribed_at', { ascending: false }),
      adminSupabase.from('newsletter_campaigns').select('id, subject, sent_at, status, content, recipient_count').order('sent_at', { ascending: false }),
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
        display_name: authUser.user_metadata?.display_name || null,
        role: profile?.role || authUser.user_metadata?.role || 'client',
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        is_authenticated: true, // Marker for registration
        preferred_lang:
          authUser.user_metadata?.preferred_lang ||
          authUser.user_metadata?.locale ||
          authUser.user_metadata?.lang ||
          'en',
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

import { syncContactToBrevo } from '@/lib/brevo';

export async function syncAllToBrevoAction(): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdminUser();
    const adminSupabase = createAdminClient();

    // 1. Fetch everything needed for a full sync
    const [usersRes, ordersRes, subsRes] = await Promise.all([
      adminSupabase.auth.admin.listUsers({ perPage: 1000 }),
      adminSupabase.from('orders').select('customer_email, total, user_id'),
      adminSupabase.from('newsletter_subscribers').select('email, status'),
    ]);

    const authUsers = usersRes.data?.users || [];
    const orders = ordersRes.data || [];
    const subscribers = subsRes.data || [];

    // 2. Build map of data per email
    const syncMap = new Map<string, {
      fullName: string;
      orderCount: number;
      totalSpent: number;
      isSubscriber: boolean;
    }>();

    authUsers.forEach(u => {
      if (!u.email) return;
      syncMap.set(u.email.toLowerCase(), {
        fullName: u.user_metadata?.full_name || u.user_metadata?.name || '',
        orderCount: 0,
        totalSpent: 0,
        isSubscriber: false
      });
    });

    orders.forEach(o => {
      const email = o.customer_email?.toLowerCase();
      if (!email) return;
      
      const existing = syncMap.get(email) || { fullName: '', orderCount: 0, totalSpent: 0, isSubscriber: false };
      existing.orderCount += 1;
      existing.totalSpent += Number(o.total || 0);
      syncMap.set(email, existing);
    });

    subscribers.forEach(s => {
      const email = s.email?.toLowerCase();
      if (!email) return;
      const existing = syncMap.get(email);
      if (existing) {
        existing.isSubscriber = s.status === 'subscribed';
        syncMap.set(email, existing);
      }
    });

    // 3. Perform the sync (in chunks to avoid hitting rate limits too hard if many)
    const emails = Array.from(syncMap.keys());
    let successCount = 0;

    for (const email of emails) {
      const data = syncMap.get(email)!;
      try {
        await syncContactToBrevo(email, {
          FULL_NAME: data.fullName,
          ORDER_COUNT: data.orderCount,
          TOTAL_SPENT: data.totalSpent,
          IS_SUBSCRIBER: data.isSubscriber,
          SYNCED_AT: new Date().toISOString()
        });
        successCount++;
      } catch (err) {
        logger.error(`Failed to sync ${email} to Brevo:`, err);
      }
    }

    return {
      success: true,
      message: `Successfully synchronized ${successCount} contacts to Brevo.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed.';
    logger.error('[Action Error] syncAllToBrevoAction:', error);
    return { success: false, message };
  }
}
