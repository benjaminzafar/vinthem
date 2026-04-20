"use client";
import { logger } from '@/lib/logger';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { 
  Database, 
  Download, 
  RefreshCcw, 
  ChevronRight, 
  ChevronDown, 
  Package
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { downloadXLSX } from '@/utils/export';
import { InfiniteScrollSentinel } from '@/components/admin/InfiniteScrollSentinel';
import { updateOrderAction } from '@/app/actions/admin-orders';
import { AdminOrder, OrderItem } from '@/types';
import Image from 'next/image';

export function OrderManager({ 
  onSeedClick,
  initialOrders = [],
}: { 
  onSeedClick?: () => void;
  initialOrders?: AdminOrder[];
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [loading, setLoading] = useState(initialOrders.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const ITEMS_PER_PAGE = 50;
  
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());

  const fetchOrders = useCallback(async ({ reset = false, showLoader = false }: { reset?: boolean; showLoader?: boolean } = {}) => {
    if (reset) {
      pageRef.current = 0;
    }

    if (showLoader) {
      setLoading(true);
    } else if (reset) {
      setRefreshing(true);
    } else {
      setLoadingMore(true);
    }

    const from = pageRef.current * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' });

      if (debouncedSearchQuery) {
        query = query.or(`order_id.ilike.%${debouncedSearchQuery}%,id.ilike.%${debouncedSearchQuery}%`);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const mappedOrders: AdminOrder[] = (data || []).map((o) => ({
        ...o,
        createdAt: o.created_at,
        orderId: o.order_id,
        customerEmail: o.shipping_details?.email
      }));

      if (reset) {
        setOrders(mappedOrders);
      } else {
        setOrders(prev => {
          const combined = [...prev, ...mappedOrders];
          const unique = Array.from(new Map(combined.map(o => [o.id, o])).values());
          return unique;
        });
      }

      const hasNoResults = mappedOrders.length === 0;
      const fetchedSoFar = from + mappedOrders.length;
      const reachedCount = count ? fetchedSoFar >= count : false;
      const partialPage = mappedOrders.length < ITEMS_PER_PAGE;
      
      setHasMore(!hasNoResults && !reachedCount && !partialPage);
      
      if (mappedOrders.length > 0) {
        pageRef.current += 1;
      }

    } catch (error: unknown) {
      const err = error as Error;
      logger.error('[OrderManager] Fetch error:', err);
      toast.error('Failed to load orders: ' + err.message);
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [supabase, debouncedSearchQuery]);

  useEffect(() => {
    void fetchOrders({
      reset: true,
      showLoader: initialOrders.length === 0,
    });
  }, [debouncedSearchQuery, fetchOrders, initialOrders.length]);

  const handleUpdateOrder = async (orderId: string, updates: Record<string, unknown>) => {
    setUpdatingOrderId(orderId);
    const toastId = toast.loading('Updating order...');
    try {
      const result = await updateOrderAction({
        orderId,
        status: typeof updates.status === 'string' ? updates.status : undefined,
        trackingCarrier: typeof updates.trackingCarrier === 'string' ? updates.trackingCarrier : undefined,
        trackingNumber: typeof updates.trackingNumber === 'string' ? updates.trackingNumber : undefined,
      });
      if (!result.success) {
        throw new Error(result.message);
      }
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
      toast.success('Order updated successfully', { id: toastId });
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Failed to update order', { id: toastId });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel('orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void fetchOrders({ reset: true, showLoader: false });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchOrders]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminHeader 
        title="Orders"
        description="Manage and track customer orders"
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Search orders..."
        }}
        secondaryActions={[
          ...(onSeedClick ? [{ label: 'Seed Test Data', icon: Database, onClick: onSeedClick }] : []),
          { label: 'Export XLSX', icon: Download, onClick: () => downloadXLSX(orders, 'orders') }
        ]}
        statsLabel={`${orders.length} orders${refreshing ? ' • syncing' : ''}`}
      />

      <div className="bg-slate-50 border border-slate-300 rounded p-4 text-sm text-slate-700 flex items-center gap-3">
        <RefreshCcw className="w-5 h-5 text-slate-400 shrink-0" />
        <p>Automated label printing requires configuration. Please go to Shipping Settings to enable your preferred service.</p>
      </div>

      <div className="bg-white border border-slate-300 rounded overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-300 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && orders.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Retrieving Order Ledger...</td></tr>
              ) : orders.length === 0 ? (
                <tr>
                   <td colSpan={5} className="py-20 text-center">
                     <Package className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                     <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">No orders found</p>
                   </td>
                </tr>
              ) : orders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr 
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                  >
                    <td className="px-6 py-4 font-bold text-slate-900 text-sm flex items-center">
                      <div className="w-6 flex items-center shrink-0">
                        {expandedOrderId === order.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      </div>
                      <span className="truncate">#{order.orderId || order.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium truncate max-w-[200px]">{order.customerEmail || 'Guest'}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">{order.total?.toLocaleString()} SEK</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${
                        order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                        order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {order.status || 'Processing'}
                      </span>
                    </td>
                  </tr>
                  {expandedOrderId === order.id && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={5} className="px-12 py-8 border-b border-slate-200">
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-200 pb-2">Order Line Items</h4>
                          <div className="space-y-4">
                            {order.items?.map((item, index: number) => (
                              <div key={index} className="flex items-center justify-between py-2">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden shrink-0 relative">
                                    {item.image ? <Image src={item.image} alt="" fill sizes="48px" className="object-cover" /> : <Package className="w-5 h-5 text-slate-300" />}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Quantity: {item.quantity} × {item.price} SEK</p>
                                  </div>
                                </div>
                                <div className="text-sm font-bold text-slate-900">
                                  {(item.quantity * item.price).toLocaleString()} SEK
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-slate-200">
                            <div>
                              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Operations</h4>
                              <div className="flex items-center gap-3">
                                <select
                                  value={order.status || 'Pending'}
                                  onChange={(e) => handleUpdateOrder(order.id, { status: e.target.value })}
                                  disabled={updatingOrderId === order.id}
                                  className="flex-1 bg-white border border-slate-300 text-slate-900 text-sm rounded h-10 px-3 focus:outline-none focus:border-slate-900"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Processing">Processing</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                                {updatingOrderId === order.id && <RefreshCcw className="w-5 h-5 animate-spin text-slate-400" />}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Logistics</h4>
                              <div className="flex flex-col gap-3">
                                <input
                                  type="text" placeholder="Carrier" defaultValue={order.trackingCarrier || ''}
                                  onBlur={(e) => e.target.value !== order.trackingCarrier && handleUpdateOrder(order.id, { trackingCarrier: e.target.value })}
                                  className="bg-white border border-slate-300 text-slate-900 text-sm rounded h-10 px-3 focus:outline-none focus:border-slate-900"
                                />
                                <input
                                  type="text" placeholder="Tracking #" defaultValue={order.trackingNumber || ''}
                                  onBlur={(e) => e.target.value !== order.trackingNumber && handleUpdateOrder(order.id, { trackingNumber: e.target.value })}
                                  className="bg-white border border-slate-300 text-slate-900 text-sm rounded h-10 px-3 focus:outline-none focus:border-slate-900"
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <InfiniteScrollSentinel 
          onIntersect={() => void fetchOrders({ reset: false, showLoader: false })}
          isLoading={loadingMore}
          hasMore={hasMore}
          loadingMessage="Streaming order ledger..."
        />
      </div>
    </div>
  );
}

