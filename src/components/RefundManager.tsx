"use client";
import { logger } from '@/lib/logger';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { RefreshCcw, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { updateRefundStatusAction } from '@/app/actions/support';
import { createClient } from '@/utils/supabase/client';
import { StableChartContainer } from './admin/charts/StableChartContainer';

const COLORS = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8'];

import { AdminHeader } from './admin/AdminHeader';

type RefundRequest = {
  id: string;
  created_at: string;
  createdAt: string;
  order_id: string;
  orderId: string;
  reason: string | null;
  comments?: string | null;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Refunded';
};

export function RefundManager() {
  const supabase = createClient();
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('refund_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error('Error fetching refund requests:', error);
      toast.error('Failed to load refund requests');
    } else {
      setRequests((data ?? []).map((r) => ({
        ...r,
        createdAt: r.created_at,
        orderId: r.order_id
      })) as RefundRequest[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
    const channel = supabase
      .channel('refund_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refund_requests' }, fetchRequests)
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, []);

  const reasonData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach(req => {
      const reason = req.reason || 'Other';
      counts[reason] = (counts[reason] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [requests]);

  const handleUpdateStatus = async (id: string, newStatus: RefundRequest['status']) => {
    const toastId = toast.loading('Updating status...');
    try {
      const result = await updateRefundStatusAction({ refundRequestId: id, status: newStatus });
      if (!result.success) {
        throw new Error(result.error || result.message);
      }

      toast.success(result.message, { id: toastId });
      fetchRequests();
    } catch (error) {
      logger.error('Error updating status:', error);
      const message = error instanceof Error ? error.message : 'Failed to update status';
      toast.error(message, { id: toastId });
    }
  };

  const filteredRequests = requests.filter(req => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (req.orderId && req.orderId.toLowerCase().includes(searchLower)) ||
      (req.id && req.id.toLowerCase().includes(searchLower)) ||
      (req.reason && req.reason.toLowerCase().includes(searchLower))
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Refunded':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {status}</span>;
      case 'Rejected':
        return <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"><XCircle className="w-3 h-3" /> {status}</span>;
      default:
        return <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> {status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader 
        title="Refund & Return Requests"
        description="Manage customer returns and process refunds"
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Search Order ID, Reason..."
        }}
        secondaryActions={[
          { label: 'Refresh Data', icon: RefreshCcw, onClick: fetchRequests }
        ]}
        statsLabel={`${filteredRequests.length} requests`}
      />

      {reasonData.length > 0 && (
        <div className="py-8 border-b border-gray-200/60 last:border-0">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-6">Refund Reasons Breakdown</h3>
          <StableChartContainer className="h-64 w-full" minHeight={256}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={100}>
              <PieChart>
                <Pie
                  data={reasonData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {reasonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </StableChartContainer>
        </div>
      )}

      <div className="py-8 border-b border-gray-200/60 last:border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="p-4 font-semibold">Request ID / Date</th>
                <th className="p-4 font-semibold">Order ID</th>
                <th className="p-4 font-semibold">Reason</th>
                <th className="p-4 font-semibold">Comments</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">Loading requests...</td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center">
                      <RefreshCcw className="w-8 h-8 text-zinc-300 mb-3" />
                      <p>No refund requests found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-mono text-xs text-zinc-900">{req.id.substring(0, 8)}...</div>
                      <div className="text-xs text-zinc-500 mt-1">{new Date(req.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-sm font-medium text-zinc-900">{req.orderId}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-zinc-900">{req.reason}</span>
                    </td>
                    <td className="p-4 max-w-xs truncate text-sm text-zinc-500" title={req.comments ?? undefined}>
                      {req.comments || '-'}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {req.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(req.id, 'Approved')}
                              className="w-full sm:w-auto flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-6 py-3 text-sm font-medium rounded-md transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(req.id, 'Rejected')}
                              className="w-full sm:w-auto flex items-center justify-center bg-white text-zinc-700 hover:bg-gray-50 border border-gray-200/60 px-6 py-3 text-sm font-medium rounded-md transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {req.status === 'Approved' && (
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'Refunded')}
                            className="w-full sm:w-auto flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-6 py-3 text-sm font-medium rounded-md transition-colors"
                          >
                            <DollarSign className="w-3 h-3" /> Process Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

