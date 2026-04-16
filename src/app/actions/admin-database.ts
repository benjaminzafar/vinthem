'use server';

import { revalidatePath } from 'next/cache';

import { requireAdminUser } from '@/lib/admin';

type DatabaseActionResult = {
  success: boolean;
  message: string;
  error?: string;
};

export async function seedAdminTestDataAction(): Promise<DatabaseActionResult> {
  try {
    const { supabase } = await requireAdminUser();
    const now = Date.now();
    const ticketStatuses = ['open', 'in-progress', 'resolved', 'closed'];
    const tickets = ticketStatuses.map((status, index) => ({
      subject: `Test Ticket ${index + 1}`,
      message: `This is a test support ticket with status ${status}.`,
      status,
      user_id: null,
      is_test_data: true,
      created_at: new Date(now - index * 60000).toISOString(),
    }));

    const { error: ticketError } = await supabase.from('support_tickets').insert(tickets);
    if (ticketError) {
      throw ticketError;
    }

    const orderStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    const orders = orderStatuses.map((status, index) => ({
      items: [
        { id: 'test-item-1', name: 'Test Product A', price: 299, quantity: 1 },
        { id: 'test-item-2', name: 'Test Product B', price: 499, quantity: 2 },
      ],
      shipping_details: {
        name: 'Test Customer',
        email: 'test-customer@example.com',
        address: '123 Test St',
        city: 'Test City',
        postalCode: '12345',
        country: 'SE',
      },
      shipping_cost: 0,
      subtotal: 1297,
      total: 1297,
      currency: 'sek',
      status,
      user_id: null,
      created_at: new Date(now - index * 86400000).toISOString(),
      is_test_data: true,
    }));

    const { error: orderError } = await supabase.from('orders').insert(orders);
    if (orderError) {
      throw orderError;
    }

    revalidatePath('/admin/database');
    revalidatePath('/admin/orders');
    revalidatePath('/admin/customers');

    return {
      success: true,
      message: 'Test data seeded successfully.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to seed test data.';
    console.error('[Action Error] seedAdminTestDataAction:', error);
    return {
      success: false,
      message,
      error: message,
    };
  }
}

export async function clearAdminTestDataAction(): Promise<DatabaseActionResult> {
  try {
    const { supabase } = await requireAdminUser();
    const tables = ['support_tickets', 'orders'] as const;
    let totalDeleted = 0;

    for (const tableName of tables) {
      const { error, count } = await supabase
        .from(tableName)
        .delete({ count: 'exact' })
        .eq('is_test_data', true);

      if (error) {
        throw error;
      }

      totalDeleted += count || 0;
    }

    revalidatePath('/admin/database');
    revalidatePath('/admin/orders');
    revalidatePath('/admin/customers');

    return {
      success: true,
      message: `Cleared ${totalDeleted} test records.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to clear test data.';
    console.error('[Action Error] clearAdminTestDataAction:', error);
    return {
      success: false,
      message,
      error: message,
    };
  }
}
