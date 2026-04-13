"use client";
import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  PlusCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { useCustomConfirm } from '@/components/ConfirmationContext';

export function DatabaseManager() {
  const [loading, setLoading] = useState(false);
  const customConfirm = useCustomConfirm();
  const supabase = createClient();

  const handleSeedData = async () => {
    const confirmed = await customConfirm(
      'Seed Test Data',
      'This will create test support tickets and orders. Are you sure?',
      { confirmLabel: 'Seed Data', confirmVariant: 'primary' }
    );
    if (!confirmed) return;

    setLoading(true);
    const toastId = toast.loading('Seeding test data...');
    try {
      const ticketStatuses = ['open', 'in-progress', 'resolved', 'closed'];
      const tickets = ticketStatuses.map((status, i) => ({
        subject: `Test Ticket ${i + 1}`,
        message: `This is a test support ticket with status ${status}.`,
        status: status,
        user_id: null,
        is_test_data: true,
        created_at: new Date().toISOString()
      }));

      const { error: ticketError } = await supabase.from('support_tickets').insert(tickets);
      if (ticketError) throw ticketError;

      const orderStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
      const orders = orderStatuses.map((status, i) => ({
        items: [
          { id: 'test-item-1', name: 'Test Product A', price: 299, quantity: 1 },
          { id: 'test-item-2', name: 'Test Product B', price: 499, quantity: 2 }
        ],
        shipping_details: {
          name: 'Test Customer',
          email: 'test-customer@example.com',
          address: '123 Test St',
          city: 'Test City',
          postalCode: '12345',
          country: 'SE'
        },
        shipping_cost: 0,
        subtotal: 1297,
        total: 1297,
        currency: 'sek',
        status: status,
        user_id: null,
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
        is_test_data: true
      }));

      const { error: orderError } = await supabase.from('orders').insert(orders);
      if (orderError) throw orderError;

      toast.success('Test data seeded successfully', { id: toastId });
    } catch (error: any) {
      console.error('Seed error:', error);
      toast.error(error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    const confirmed = await customConfirm(
      'Clear Test Data',
      'This will remove all documents marked as test data. This action cannot be undone. Are you sure?',
      { confirmLabel: 'Clear Data', confirmVariant: 'danger' }
    );
    if (!confirmed) return;

    setLoading(true);
    const toastId = toast.loading('Clearing test data...');
    try {
      const tables = ['support_tickets', 'orders'];
      let totalDeleted = 0;

      for (const tableName of tables) {
        const { error, count } = await supabase
          .from(tableName)
          .delete({ count: 'exact' })
          .eq('is_test_data', true);
        
        if (error) throw error;
        totalDeleted += (count || 0);
      }

      toast.success(`Cleared ${totalDeleted} test records.`, { id: toastId });
    } catch (error: any) {
      console.error('Clear error:', error);
      toast.error(error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader 
        title="Database Management"
        description="Seed or clear test data for development and support"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-zinc-100 rounded-3xl p-8 space-y-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-zinc-900 tracking-tight">Seed Test Data</h3>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Generate sample support tickets and orders with various statuses to test your dashboard and workflows.
          </p>
          <button
            onClick={handleSeedData}
            disabled={loading}
            className="w-full flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 px-6 h-12 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
            Seed Test Data
          </button>
        </div>

        <div className="bg-white border border-zinc-100 rounded-3xl p-8 space-y-4">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-4">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-zinc-900 tracking-tight">Clear Test Data</h3>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Remove all records marked as test data from the database. This will not affect real customer data.
          </p>
          <button
            onClick={handleClearData}
            disabled={loading}
            className="w-full flex items-center justify-center bg-white text-rose-600 hover:bg-rose-50 border border-rose-100 px-6 h-12 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Clear Test Data
          </button>
        </div>
      </div>
    </div>
  );
}
