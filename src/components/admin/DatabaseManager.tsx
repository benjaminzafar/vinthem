"use client";
import React, { useState } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  PlusCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { useCustomConfirm } from '@/components/ConfirmationContext';
import { clearAdminTestDataAction, seedAdminTestDataAction } from '@/app/actions/admin-database';

export function DatabaseManager() {
  const [loading, setLoading] = useState(false);
  const customConfirm = useCustomConfirm();

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
      const result = await seedAdminTestDataAction();
      if (!result.success) throw new Error(result.message);
      toast.success(result.message, { id: toastId });
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
      const result = await clearAdminTestDataAction();
      if (!result.success) throw new Error(result.message);
      toast.success(result.message, { id: toastId });
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
