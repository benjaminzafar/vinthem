'use server';

import { createAdminClient } from '@/utils/supabase/server';
import { requireAdminUser } from '@/lib/admin';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';

export async function purgeTestDataAction() {
  try {
    await requireAdminUser();
    const adminSupabase = createAdminClient();

    // 1. Purge test orders
    const { error: orderError, count: orderCount } = await adminSupabase
      .from('orders')
      .delete({ count: 'exact' })
      .eq('is_test_data', true);

    if (orderError) throw orderError;

    // 2. Purge test users? (Only if they are specifically marked)
    // For now, we only purge orders as they affect metrics the most.

    logger.info(`[Admin Cleanup] Purged ${orderCount} test orders.`);
    
    revalidatePath('/admin');
    return { success: true, message: `Successfully purged ${orderCount || 0} test records.` };
  } catch (error) {
    logger.error('[Action Error] purgeTestDataAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Cleanup failed.' };
  }
}

export async function purgeAllOrdersAction() {
  try {
    await requireAdminUser();
    const adminSupabase = createAdminClient();

    // 1. Delete all orders
    const { error, count } = await adminSupabase
      .from('orders')
      .delete({ count: 'exact' })
      .neq('status', 'DUMMY_STATUS_TO_DELETE_ALL'); // Effectively all if we use .gt('id', '000...') or just filter by something that matches all

    // Supabase .delete() requires a filter. To delete all, we can use a filter that matches everything.
    const { error: delError, count: delCount } = await adminSupabase
      .from('orders')
      .delete({ count: 'exact' })
      .filter('id', 'neq', '00000000-0000-0000-0000-000000000000');

    if (delError) throw delError;

    logger.info(`[Admin Cleanup] Purged ALL ${delCount} orders.`);
    
    revalidatePath('/admin');
    return { success: true, message: `Successfully cleared all ${delCount || 0} orders.` };
  } catch (error) {
    logger.error('[Action Error] purgeAllOrdersAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Cleanup failed.' };
  }
}

export async function purgeCRMDataAction() {
  try {
    await requireAdminUser();
    const adminSupabase = createAdminClient();

    // 1. Delete support tickets
    const { error: ticketError, count: ticketCount } = await adminSupabase
      .from('support_tickets')
      .delete({ count: 'exact' })
      .filter('id', 'neq', '00000000-0000-0000-0000-000000000000');

    if (ticketError) throw ticketError;

    // 2. Delete refund requests
    const { error: refundError, count: refundCount } = await adminSupabase
      .from('refund_requests')
      .delete({ count: 'exact' })
      .filter('id', 'neq', '00000000-0000-0000-0000-000000000000');

    if (refundError) throw refundError;

    logger.info(`[Admin Cleanup] Purged ${ticketCount} tickets and ${refundCount} refunds.`);
    
    revalidatePath('/admin');
    return { success: true, message: `Successfully cleared ${ticketCount || 0} tickets and ${refundCount || 0} refunds.` };
  } catch (error) {
    logger.error('[Action Error] purgeCRMDataAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Cleanup failed.' };
  }
}
