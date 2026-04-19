"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { 
  Database, 
  Download, 
  RefreshCw, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  TrendingDown, 
  RefreshCcw 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Product } from '@/store/useCartStore';
import { downloadXLSX } from '@/utils/export';
import { StableChartContainer } from '@/components/admin/charts/StableChartContainer';

import { StorefrontSettingsType } from '@/types';

interface OverviewOrder {
  id: string;
  total: number;
  status: string;
  created_at: string;
  createdAt: string;
  order_id: string;
  customerEmail?: string;
  items?: Record<string, unknown>[];
  shipping_details?: Record<string, unknown>;
}

interface RefundRequest {
  id: string;
  status: string;
  created_at: string;
  createdAt: string;
}

export function Overview({ initialStats, onProductClick, onSeedClick }: { initialStats?: Record<string, any>, onProductClick?: (product: Product) => void, onSeedClick?: () => void }) {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('6months');
  const [metric, setMetric] = useState('revenue');
  const [orders, setOrders] = useState<OverviewOrder[]>(initialStats?.orders?.map((o: Record<string, any>) => ({
    ...o,
    createdAt: o.created_at,
    orderId: o.order_id,
    customerEmail: (o.shipping_details as Record<string, any>)?.email
  })) || []);
  const [products, setProducts] = useState<Product[]>(initialStats?.products || []);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>(initialStats?.refunds?.map((r: Record<string, any>) => ({
    ...r,
    createdAt: r.created_at
  })) || []);
  const [loading, setLoading] = useState(!initialStats);
  const [visibleInventoryCount, setVisibleInventoryCount] = useState(10);
  const [visibleTopPerformersCount, setVisibleTopPerformersCount] = useState(10);
  const supabase = createClient();

  const fetchAdminData = useCallback(async () => {
    // Only fetch if not provided via props (for secondary refreshes)
    if (initialStats && loading === false) return; 
    
    try {
      setLoading(true);
      const [ordersRes, productsRes, refundsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('refund_requests').select('*').order('created_at', { ascending: false }),
      ]);
      
      if (ordersRes.data) {
        setOrders((ordersRes.data as Record<string, any>[]).map(o => ({
          ...o,
          id: o.id,
          total: o.total,
          status: o.status,
          created_at: o.created_at,
          order_id: o.order_id,
          createdAt: o.created_at,
          orderId: o.order_id,
          customerEmail: (o.shipping_details as Record<string, any>)?.email
        } as OverviewOrder)));
      }
      if (productsRes.data) setProducts(productsRes.data as unknown as Product[]);
      if (refundsRes.data) {
        setRefundRequests((refundsRes.data as Record<string, any>[]).map(r => ({
          ...r,
          id: r.id,
          status: r.status,
          created_at: r.created_at,
          createdAt: r.created_at
        } as RefundRequest)));
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, initialStats, loading]);

  useEffect(() => {
    fetchAdminData();

    // Enable Realtime for all core entities to keep dashboard fresh
    const channel = supabase
      .channel('overview-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchAdminData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchAdminData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refund_requests' }, () => fetchAdminData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAdminData, supabase]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startDate = new Date();
    
    if (timeRange === '1week') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === '1month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (timeRange === '3months') {
      startDate.setMonth(now.getMonth() - 3);
    } else if (timeRange === '6months') {
      startDate.setMonth(now.getMonth() - 6);
    } else if (timeRange === '12months') {
      startDate.setMonth(now.getMonth() - 12);
    }
    
    return orders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate;
    });
  }, [orders, timeRange]);

  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, order) => {
      if (order.status !== 'Cancelled') {
        return sum + (Number(order.total) || 0);
      }
      return sum;
    }, 0);
  }, [filteredOrders]);

  const activeOrders = useMemo(() => {
    return filteredOrders.filter(order => order.status === 'Processing' || order.status === 'Pending' || !order.status).length;
  }, [filteredOrders]);

  const avgOrderValue = useMemo(() => {
    const validOrders = filteredOrders.filter(order => order.status !== 'Cancelled');
    if (validOrders.length === 0) return 0;
    return totalRevenue / validOrders.length;
  }, [filteredOrders, totalRevenue]);

  const trendData = useMemo(() => {
    const now = new Date();
    const data: { name: string, revenue: number, orders: number, date: Date }[] = [];

    if (timeRange === '1week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        data.push({ name: d.toLocaleDateString('en-US', { weekday: 'short' }), revenue: 0, orders: 0, date: d });
      }
    } else if (timeRange === '1month') {
      for (let i = 3; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - (i * 7));
        data.push({ name: `Week ${i + 1}`, revenue: 0, orders: 0, date: d });
      }
    } else {
      const monthsToShow = timeRange === '12months' ? 12 : (timeRange === '3months' ? 3 : 6);
      for (let i = monthsToShow - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        data.push({ name: d.toLocaleDateString('en-US', { month: 'short' }), revenue: 0, orders: 0, date: d });
      }
    }

    filteredOrders.forEach(order => {
      if (order.createdAt && order.status !== 'Cancelled') {
        const orderDate = new Date(order.createdAt);
        
        const match = data.find(point => {
            if (timeRange === '1week') {
                return orderDate.toDateString() === point.date.toDateString();
            } else if (timeRange === '1month') {
                const diffTime = Math.abs(orderDate.getTime() - point.date.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
            } else {
                return orderDate.getMonth() === point.date.getMonth() && orderDate.getFullYear() === point.date.getFullYear();
            }
        });

        if (match) {
          match.revenue += (Number(order.total) || 0);
          match.orders += 1;
        }
      }
    });

    return data.map(({ name, revenue, orders }) => ({ name, revenue, orders }));
  }, [filteredOrders, timeRange]);

  const topProductsList = useMemo(() => {
    const productSales: Record<string, { sales: number, revenue: number }> = {};
    
    orders.forEach(order => {
      if (order.status !== 'Cancelled' && order.items) {
        order.items.forEach((item: Record<string, any>) => {
          if (!productSales[item.id]) {
            productSales[item.id] = { sales: 0, revenue: 0 };
          }
          productSales[item.id].sales += (item.quantity || 1);
          productSales[item.id].revenue += ((item.price || 0) * (item.quantity || 1));
        });
      }
    });

    const sortedProducts = Object.entries(productSales)
      .map(([id, data]) => {
        const product = products.find(p => p.id === id);
        return {
          name: product ? product.title : `Product ${id.slice(0, 8)}`,
          sales: data.sales,
          revenue: `${data.revenue.toLocaleString()} SEK`,
          rawRevenue: data.revenue
        };
      })
      .sort((a, b) => b.rawRevenue - a.rawRevenue);

    return {
      items: sortedProducts.slice(0, visibleTopPerformersCount),
      hasMore: sortedProducts.length > visibleTopPerformersCount
    };
  }, [orders, products, visibleTopPerformersCount]);

  const inventoryAnalyst = useMemo(() => {
    const lowStockThreshold = 5;
    
    const getProductStock = (p: Product) => {
      if (p.variants && p.variants.length > 0) {
        return p.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
      }
      return Number(p.stock) || 0;
    };

    const lowStock = products.filter(p => getProductStock(p) <= lowStockThreshold);
    const outOfStock = products.filter(p => getProductStock(p) === 0);
    const totalStock = products.reduce((sum, p) => sum + getProductStock(p), 0);
    
    return {
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      totalStock,
      lowStockProducts: lowStock.slice(0, visibleInventoryCount),
      hasMoreLowStock: lowStock.length > visibleInventoryCount
    };
  }, [products, visibleInventoryCount]);

  const stats = [
    { name: 'Total Revenue', value: `${totalRevenue.toLocaleString()} SEK`, icon: DollarSign, change: '+0%', changeType: 'positive' },
    { name: 'Active Orders', value: activeOrders.toString(), icon: ShoppingCart, change: '+0%', changeType: 'positive' },
    { name: 'Avg. Order Value', value: `${Math.round(avgOrderValue).toLocaleString()} SEK`, icon: DollarSign, change: '+0%', changeType: 'positive' },
    { name: 'All products', value: inventoryAnalyst.totalStock.toString(), icon: Package, change: '+0%', changeType: 'positive' },
    { name: 'Low Stock Items', value: inventoryAnalyst.lowStockCount.toString(), icon: TrendingDown, change: `${inventoryAnalyst.lowStockCount} items`, changeType: 'negative' },
    { name: 'Refund Requests', value: refundRequests.length.toString(), icon: RefreshCcw, change: `${refundRequests.filter(r => r.status === 'Pending').length} pending`, changeType: 'negative' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-zinc-900 animate-spin" />
      </div>
    );
  }

  const secondaryActions = [
    ...(onSeedClick ? [{ label: 'Seed Test Data', icon: Database, onClick: onSeedClick }] : []),
    { label: 'Export Report', icon: Download, onClick: () => downloadXLSX(filteredOrders, 'store_report') }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Store Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time performance metrics and inventory insights</p>
        </div>
        <div className="flex items-center gap-3">
          {secondaryActions.map((action, i) => (
            <button 
              key={i} onClick={action.onClick}
              className="h-10 px-4 border border-slate-300 rounded text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Analytics */}
      <div className="bg-white border border-slate-300 rounded p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Revenue & Growth</h3>
            <p className="text-slate-500 text-xs mt-1">Visualizing your store's financial trajectory</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)} 
              className="text-xs font-bold uppercase tracking-widest border border-slate-300 rounded px-3 py-2 bg-slate-50 focus:outline-none focus:border-slate-900"
            >
              <option value="1week">Last 7 Days</option>
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last Year</option>
            </select>
            <select 
              value={metric} 
              onChange={(e) => setMetric(e.target.value)} 
              className="text-xs font-bold uppercase tracking-widest border border-slate-300 rounded px-3 py-2 bg-slate-50 focus:outline-none focus:border-slate-900"
            >
              <option value="revenue">Revenue (SEK)</option>
              <option value="orders">Order Volume</option>
            </select>
          </div>
        </div>
        
        <StableChartContainer className="h-[350px] w-full min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={100}>
            <AreaChart data={trendData} margin={{ top: 10, right: 0, bottom: 0, left: -15 }}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f172a" stopOpacity={0.05}/>
                  <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} 
                dy={15} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} 
                width={45}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-4 rounded border border-slate-300 shadow-xl min-w-[160px]">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{metric}</span>
                          <span className="text-sm font-bold text-slate-900">
                             {(payload[0]?.value ?? 0).toLocaleString()} {metric === 'revenue' ? 'SEK' : ''}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey={metric} 
                stroke="#0f172a" 
                fill="url(#colorMetric)" 
                strokeWidth={2} 
                dot={{ fill: '#0f172a', strokeWidth: 1, r: 3, stroke: '#fff' }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </StableChartContainer>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white border border-slate-300 p-6 rounded transition-all hover:bg-slate-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-white border border-slate-300 rounded flex items-center justify-center text-slate-900">
                <stat.icon className="w-4 h-4" />
              </div>
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{stat.name}</h3>
            </div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
            <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
              stat.changeType === 'positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
            }`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inventory analyst */}
        <div className="bg-white border border-slate-300 rounded p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Inventory Health</h3>
              <p className="text-slate-500 text-xs mt-1">Stock levels and replenishment alerts</p>
            </div>
            <div className="flex gap-2">
              <div className="px-2 py-1 bg-rose-50 text-rose-700 rounded border border-rose-100 text-[10px] font-bold uppercase tracking-widest">
                {inventoryAnalyst.outOfStockCount} Out
              </div>
              <div className="px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-100 text-[10px] font-bold uppercase tracking-widest">
                {inventoryAnalyst.lowStockCount} Low
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {inventoryAnalyst.lowStockProducts.length > 0 ? (
              inventoryAnalyst.lowStockProducts.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => {
                    if (onProductClick) onProductClick(p);
                    else router.push(`/admin/products?id=${p.id}`);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded hover:border-slate-300 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-white border border-slate-300 rounded flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 truncate">{p.title}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-100 shrink-0 ml-2">
                    {p.stock} Units
                  </span>
                </button>
              ))
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded border border-slate-300">
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Inventory Fully Stocked</p>
              </div>
            )}

            {inventoryAnalyst.hasMoreLowStock && (
              <button 
                onClick={() => setVisibleInventoryCount(prev => prev + 10)}
                className="w-full py-4 border border-slate-300 rounded text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:border-slate-900 hover:text-slate-900 transition-all"
              >
                Load More
              </button>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white border border-slate-300 rounded p-6 sm:p-8">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Top Performers</h3>
            <p className="text-slate-500 text-xs mt-1">Best selling products by revenue</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-300 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
                  <th className="px-4 py-4">Product</th>
                  <th className="px-4 py-4 text-center">Sales</th>
                  <th className="px-4 py-4 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProductsList.items.length > 0 ? topProductsList.items.map((product, index) => (
                  <tr key={index} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-bold text-slate-900 text-sm truncate max-w-[200px]">{product.name}</td>
                    <td className="px-4 py-4 text-slate-500 text-sm font-medium text-center">{product.sales}</td>
                    <td className="px-4 py-4 text-slate-900 font-bold text-sm text-right">{product.revenue}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {topProductsList.hasMore && (
            <div className="mt-6">
              <button 
                onClick={() => setVisibleTopPerformersCount(prev => prev + 10)}
                className="w-full py-4 border border-slate-300 rounded text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:border-slate-900 hover:text-slate-900 transition-all"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
