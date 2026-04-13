"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { 
  Database, 
  Download, 
  RefreshCcw, 
  ChevronRight, 
  ChevronDown, 
  Package, 
  RefreshCw 
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { downloadXLSX } from '@/utils/export';

export function OrderManager({ onSeedClick }: { onSeedClick?: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const supabase = createClient();

  const handleUpdateOrder = async (orderId: string, updates: Record<string, unknown>) => {
    setUpdatingOrderId(orderId);
    const toastId = toast.loading('Updating order...');
    try {
      const { error } = await supabase.from('orders').update(updates).eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
      toast.success('Order updated successfully', { id: toastId });
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast.error(error.message || 'Failed to update order', { id: toastId });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
      } else {
        setOrders((data || []).map(o => ({
          ...o,
          createdAt: o.created_at,
          orderId: o.order_id,
          customerEmail: o.shipping_details?.email
        })));
      }
      setLoading(false);
    };

    fetchOrders();

    const channel = supabase
      .channel('orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const filteredOrders = orders.filter(order => {
    const searchLower = debouncedSearchQuery.toLowerCase();
    return (
      (order.orderId && order.orderId.toLowerCase().includes(searchLower)) ||
      (order.id && order.id.toLowerCase().includes(searchLower)) ||
      (order.customerEmail && order.customerEmail.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6">
      <AdminHeader 
        title="Orders"
        description="Manage and track customer orders"
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Search orders..."
        }}
        secondaryActions={[
          { label: 'Seed Test Data', icon: Database, onClick: onSeedClick },
          { label: 'Export XLSX', icon: Download, onClick: () => downloadXLSX(filteredOrders, 'orders') }
        ].filter(a => a.onClick !== undefined) as any}
        statsLabel={`${filteredOrders.length} orders`}
      />

      {/* Info Message */}
      <div className="bg-amber-50 border border-amber-200 rounded p-4 text-sm text-amber-800 flex items-center gap-3">
        <RefreshCcw className="w-5 h-5 text-amber-600 shrink-0" />
        <p>Automated label printing requires configuration. Please go to Shipping Settings to enable your preferred service and configure your API settings.</p>
      </div>

      <div className="py-8 border-b border-gray-200/60 last:border-0">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-4 sm:px-6 py-4 font-semibold">Order ID</th>
                <th className="px-4 sm:px-6 py-4 font-semibold">Date</th>
                <th className="px-4 sm:px-6 py-4 font-semibold">Customer</th>
                <th className="px-4 sm:px-6 py-4 font-semibold">Total</th>
                <th className="px-4 sm:px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr 
                    className="hover:bg-zinc-50 transition-colors cursor-pointer group"
                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                  >
                    <td className="px-4 sm:px-6 py-4 font-medium font-mono text-sm flex items-center text-zinc-900 group-hover:text-zinc-900">
                      {expandedOrderId === order.id ? <ChevronDown className="w-4 h-4 mr-2 text-zinc-400 shrink-0" /> : <ChevronRight className="w-4 h-4 mr-2 text-zinc-400 shrink-0" />}
                      <span className="truncate">#{order.orderId || order.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 font-medium truncate max-w-[200px]">{order.customerEmail || 'Guest'}</td>
                    <td className="px-4 sm:px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{order.total?.toLocaleString()} SEK</td>
                    <td className="px-4 sm:px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                        order.status === 'Delivered' ? 'bg-green-50 text-green-700 border border-green-200/50' : 
                        order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border border-blue-200/50' :
                        'bg-amber-50 text-amber-700 border border-amber-200/50'
                      }`}>
                        {order.status || 'Processing'}
                      </span>
                    </td>
                  </tr>
                  {expandedOrderId === order.id && (
                    <tr>
                      <td colSpan={5} className="p-0 bg-gray-50/50 border-b border-gray-100">
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: 'auto' }} 
                          className="px-12 py-6"
                        >
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Order Items</h4>
                          <div className="space-y-3">
                            {order.items?.map((item: any, index: number) => (
                              <div key={index} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden border border-gray-200/50">
                                    {item.image && item.image.trim() !== "" ? (
                                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <Package className="w-5 h-5 text-gray-400" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity} × {item.price} SEK</p>
                                  </div>
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {(item.quantity * item.price).toLocaleString()} SEK
                                </div>
                              </div>
                            ))}
                            {(!order.items || order.items.length === 0) && (
                              <p className="text-sm text-gray-500">No items found for this order.</p>
                            )}
                          </div>

                          <div className="mt-8 pt-6 border-t border-gray-200/60 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Update Status</h4>
                              <div className="flex items-center space-x-3">
                                <select
                                  value={order.status || 'Pending'}
                                  onChange={(e) => handleUpdateOrder(order.id, { status: e.target.value })}
                                  disabled={updatingOrderId === order.id}
                                  className="flex-1 bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-zinc-900 focus:border-zinc-900 block w-full p-2.5"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Processing">Processing (Picking)</option>
                                  <option value="Shipped">Shipped (Sending)</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                  <option value="Refunded">Refunded</option>
                                  <option value="Replaced">Replaced</option>
                                </select>
                                {updatingOrderId === order.id && <RefreshCw className="w-5 h-5 animate-spin text-zinc-400" />}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Tracking Information</h4>
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  placeholder="Carrier (e.g., PostNord, DHL)"
                                  defaultValue={order.trackingCarrier || ''}
                                  onBlur={(e) => {
                                    if (e.target.value !== order.trackingCarrier) {
                                      handleUpdateOrder(order.id, { trackingCarrier: e.target.value });
                                    }
                                  }}
                                  className="bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-zinc-900 focus:border-zinc-900 block w-full p-2.5"
                                />
                                <input
                                  type="text"
                                  placeholder="Tracking Number"
                                  defaultValue={order.trackingNumber || ''}
                                  onBlur={(e) => {
                                    if (e.target.value !== order.trackingNumber) {
                                      handleUpdateOrder(order.id, { trackingNumber: e.target.value });
                                    }
                                  }}
                                  className="bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-zinc-900 focus:border-zinc-900 block w-full p-2.5"
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
              {orders.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-lg font-medium text-gray-900">No orders yet</p>
                    <p className="text-sm mt-1">When customers place orders, they will appear here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
