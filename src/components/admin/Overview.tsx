"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { logger } from '@/lib/logger';
import {
  Database,
  DollarSign,
  Download,
  Package,
  RefreshCcw,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const AreaChart = dynamic(() => import('recharts').then((mod) => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then((mod) => mod.Area), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((mod) => mod.CartesianGrid), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false });
import { Product } from '@/store/useCartStore';
import { downloadXLSX } from '@/utils/export';
import { StableChartContainer } from '@/components/admin/charts/StableChartContainer';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';
import { purgeTestDataAction } from '@/app/actions/admin-cleanup';
import type { RawOverviewStats } from '@/lib/admin-overview';

interface OverviewOrder {
  id: string;
  total: number;
  status: string;
  created_at: string;
  createdAt: string;
  order_id: string;
  customerEmail?: string;
  items?: Record<string, unknown>[];
}

interface RefundRequest {
  id: string;
  status: string;
  created_at: string;
  createdAt: string;
}

interface OverviewProduct extends Omit<Product, 'stock' | 'variants' | 'title'> {
  title: string;
  stock?: number | null;
  variants?: Array<{ stock?: number | null }>;
}

interface OverviewStats {
  orders: OverviewOrder[];
  products: OverviewProduct[];
  refunds: RefundRequest[];
}

interface OverviewProps {
  initialStats?: RawOverviewStats;
  onProductClick?: (product: Product) => void;
  onSeedClick?: () => void;
}

function normalizeOrder(order: Record<string, unknown>): OverviewOrder {
  return {
    id: String(order.id ?? ''),
    total: Number(order.total ?? 0),
    status: String(order.status ?? ''),
    created_at: String(order.created_at ?? ''),
    createdAt: String(order.created_at ?? ''),
    order_id: String(order.order_id ?? ''),
    customerEmail: typeof order.customer_email === 'string' ? order.customer_email : undefined,
    items: Array.isArray(order.items) ? (order.items as Record<string, unknown>[]) : [],
  };
}

function normalizeRefund(refund: Record<string, unknown>): RefundRequest {
  const createdAt = String(refund.created_at ?? '');

  return {
    id: String(refund.id ?? ''),
    status: String(refund.status ?? ''),
    created_at: createdAt,
    createdAt,
  };
}

function normalizeProduct(product: Record<string, unknown>): OverviewProduct {
  return product as unknown as OverviewProduct;
}

function toProduct(product: OverviewProduct): Product {
  return {
    ...product,
    stock: Number(product.stock ?? 0),
  } as Product;
}

export function Overview({ initialStats, onProductClick, onSeedClick }: OverviewProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const refreshTimerRef = useRef<number | null>(null);
  const [timeRange, setTimeRange] = useState('6months');
  const [metric, setMetric] = useState('revenue');
  const normalizedInitialStats = useMemo<OverviewStats>(
    () => ({
      orders: (initialStats?.orders ?? []).map((order) =>
        normalizeOrder(order as unknown as Record<string, unknown>),
      ),
      products: (initialStats?.products ?? []).map((product) =>
        normalizeProduct(product as unknown as Record<string, unknown>),
      ),
      refunds: (initialStats?.refunds ?? []).map((refund) =>
        normalizeRefund(refund as unknown as Record<string, unknown>),
      ),
    }),
    [initialStats],
  );
  const [orders, setOrders] = useState<OverviewOrder[]>(normalizedInitialStats.orders);
  const [products, setProducts] = useState<OverviewProduct[]>(normalizedInitialStats.products);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>(normalizedInitialStats.refunds);
  const [loading, setLoading] = useState(!initialStats);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleInventoryCount, setVisibleInventoryCount] = useState(10);
  const [visibleTopPerformersCount, setVisibleTopPerformersCount] = useState(10);

  const fetchAdminData = useCallback(
    async (showLoader = false) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const response = await fetch('/api/admin/overview', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
          headers: {
            accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Overview refresh failed with status ${response.status}`);
        }

        const payload = (await response.json()) as RawOverviewStats;
        setOrders((payload.orders ?? []).map((order) => normalizeOrder(order as Record<string, unknown>)));
        setProducts((payload.products ?? []).map((product) => normalizeProduct(product as Record<string, unknown>)));
        setRefundRequests((payload.refunds ?? []).map((refund) => normalizeRefund(refund as Record<string, unknown>)));
      } catch (error) {
        logger.error('Error fetching admin overview data', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current !== null) {
      window.clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = window.setTimeout(() => {
      void fetchAdminData(false);
    }, 180);
  }, [fetchAdminData]);

  useEffect(() => {
    if (!initialStats) {
      void fetchAdminData(true);
    }

    const channel = supabase
      .channel('overview-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        scheduleRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        scheduleRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refund_requests' }, () => {
        scheduleRefresh();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void fetchAdminData(false);
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          logger.warn(`[Overview] Realtime channel status: ${status}`);
          scheduleRefresh();
        }

        if (status === 'CLOSED') {
          scheduleRefresh();
        }
      });

    const handleVisibilitySync = () => {
      if (document.visibilityState === 'visible') {
        void fetchAdminData(false);
      }
    };

    const handleWindowFocus = () => {
      void fetchAdminData(false);
    };

    const pollInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchAdminData(false);
      }
    }, 60000);

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilitySync);

    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }
      window.clearInterval(pollInterval);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilitySync);
      void supabase.removeChannel(channel);
    };
  }, [fetchAdminData, initialStats, scheduleRefresh, supabase]);

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

    return orders.filter((order) => {
      if (!order.createdAt) {
        return false;
      }

      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate;
    });
  }, [orders, timeRange]);

  const totalRevenue = useMemo(
    () =>
      filteredOrders.reduce((sum, order) => {
        if (order.status !== 'Cancelled') {
          return sum + (Number(order.total) || 0);
        }

        return sum;
      }, 0),
    [filteredOrders],
  );

  const activeOrders = useMemo(
    () =>
      filteredOrders.filter(
        (order) => order.status === 'Processing' || order.status === 'Pending' || !order.status,
      ).length,
    [filteredOrders],
  );

  const avgOrderValue = useMemo(() => {
    const validOrders = filteredOrders.filter((order) => order.status !== 'Cancelled');
    if (validOrders.length === 0) {
      return 0;
    }

    return totalRevenue / validOrders.length;
  }, [filteredOrders, totalRevenue]);

  const trendData = useMemo(() => {
    const now = new Date();
    const data: Array<{ name: string; revenue: number; orders: number; date: Date }> = [];

    if (timeRange === '1week') {
      for (let i = 6; i >= 0; i -= 1) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        data.push({
          name: date.toLocaleDateString('en-US', { weekday: 'short' }),
          revenue: 0,
          orders: 0,
          date,
        });
      }
    } else if (timeRange === '1month') {
      for (let i = 3; i >= 0; i -= 1) {
        const date = new Date(now);
        date.setDate(date.getDate() - i * 7);
        data.push({
          name: `Week ${i + 1}`,
          revenue: 0,
          orders: 0,
          date,
        });
      }
    } else {
      const monthsToShow = timeRange === '12months' ? 12 : timeRange === '3months' ? 3 : 6;
      for (let i = monthsToShow - 1; i >= 0; i -= 1) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        data.push({
          name: date.toLocaleDateString('en-US', { month: 'short' }),
          revenue: 0,
          orders: 0,
          date,
        });
      }
    }

    filteredOrders.forEach((order) => {
      if (!order.createdAt || order.status === 'Cancelled') {
        return;
      }

      const orderDate = new Date(order.createdAt);
      const match = data.find((point) => {
        if (timeRange === '1week') {
          return orderDate.toDateString() === point.date.toDateString();
        }

        if (timeRange === '1month') {
          const diffTime = Math.abs(orderDate.getTime() - point.date.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 7;
        }

        return (
          orderDate.getMonth() === point.date.getMonth() &&
          orderDate.getFullYear() === point.date.getFullYear()
        );
      });

      if (match) {
        match.revenue += Number(order.total) || 0;
        match.orders += 1;
      }
    });

    return data.map(({ name, revenue, orders: totalOrders }) => ({
      name,
      revenue,
      orders: totalOrders,
    }));
  }, [filteredOrders, timeRange]);

  const topProductsList = useMemo(() => {
    const productSales: Record<string, { sales: number; revenue: number }> = {};

    orders.forEach((order) => {
      if (order.status === 'Cancelled' || !order.items) {
        return;
      }

      order.items.forEach((item) => {
        const itemId = String(item.id ?? '');
        const quantity = Number(item.quantity ?? 1);
        const price = Number(item.price ?? 0);

        if (!itemId) {
          return;
        }

        if (!productSales[itemId]) {
          productSales[itemId] = { sales: 0, revenue: 0 };
        }

        productSales[itemId].sales += quantity;
        productSales[itemId].revenue += price * quantity;
      });
    });

    const sortedProducts = Object.entries(productSales)
      .map(([id, data]) => {
        const product = products.find((productItem) => productItem.id === id);
        return {
          name: product ? product.title : `Product ${id.slice(0, 8)}`,
          sales: data.sales,
          revenue: `${data.revenue.toLocaleString()} SEK`,
          rawRevenue: data.revenue,
        };
      })
      .sort((a, b) => b.rawRevenue - a.rawRevenue);

    return {
      items: sortedProducts.slice(0, visibleTopPerformersCount),
      hasMore: sortedProducts.length > visibleTopPerformersCount,
    };
  }, [orders, products, visibleTopPerformersCount]);

  const inventoryAnalyst = useMemo(() => {
    const lowStockThreshold = 5;

    const getProductStock = (product: OverviewProduct) => {
      if (Array.isArray(product.variants) && product.variants.length > 0) {
        return product.variants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0);
      }

      return Number(product.stock) || 0;
    };

    const lowStock = products.filter((product) => getProductStock(product) <= lowStockThreshold);
    const outOfStock = products.filter((product) => getProductStock(product) === 0);
    const totalStock = products.reduce((sum, product) => sum + getProductStock(product), 0);

    return {
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      totalStock,
      lowStockProducts: lowStock.slice(0, visibleInventoryCount),
      hasMoreLowStock: lowStock.length > visibleInventoryCount,
    };
  }, [products, visibleInventoryCount]);

  const stats = [
    { name: 'Total Revenue', value: `${totalRevenue.toLocaleString()} SEK`, icon: DollarSign, change: '+0%', changeType: 'positive' as const },
    { name: 'Active Orders', value: activeOrders.toString(), icon: ShoppingCart, change: '+0%', changeType: 'positive' as const },
    { name: 'Avg. Order Value', value: `${Math.round(avgOrderValue).toLocaleString()} SEK`, icon: DollarSign, change: '+0%', changeType: 'positive' as const },
    { name: 'All products', value: inventoryAnalyst.totalStock.toString(), icon: Package, change: '+0%', changeType: 'positive' as const },
    { name: 'Low Stock Items', value: inventoryAnalyst.lowStockCount.toString(), icon: TrendingDown, change: `${inventoryAnalyst.lowStockCount} items`, changeType: 'negative' as const },
    { name: 'Refund Requests', value: refundRequests.length.toString(), icon: RefreshCcw, change: `${refundRequests.filter((refund) => refund.status === 'Pending').length} pending`, changeType: 'negative' as const },
  ];

  if (loading) {
    return (
      <AdminLoadingState
        eyebrow="Overview"
        title="Composing store intelligence"
        detail="Pulling revenue, inventory, and order activity into a live operational snapshot."
      />
    );
  }

  const secondaryActions = [
    ...(onSeedClick ? [{ label: 'Seed Test Data', icon: Database, onClick: onSeedClick }] : []),
    { 
      label: 'Purge Test Data', 
      icon: Trash2, 
      onClick: async () => {
        if (!confirm('Are you sure you want to purge all test records?')) return;
        const res = await purgeTestDataAction();
        if (res.success) toast.success(res.message);
        else toast.error(res.error || 'Cleanup failed');
        void fetchAdminData(false);
      } 
    },
    { label: 'Export Report', icon: Download, onClick: () => void downloadXLSX(filteredOrders, 'store_report') },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight text-slate-900">Store Overview</h1>
          <p className="mt-0.5 text-[12px] text-slate-500">Real-time performance metrics and inventory insights</p>
        </div>
        <div className="flex items-center gap-3">
          {refreshing && (
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Syncing
            </div>
          )}
          {secondaryActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="flex h-10 items-center gap-2 rounded-none border border-slate-300 px-4 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-none border border-slate-300 bg-white p-6 sm:p-8">
        <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-[14px] font-bold tracking-tight text-slate-900">Revenue & Growth</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">Visualizing your store&apos;s financial trajectory</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={timeRange}
              onChange={(event) => setTimeRange(event.target.value)}
              className="rounded-none border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-widest focus:border-slate-900 focus:outline-none"
            >
              <option value="1week">Last 7 Days</option>
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last Year</option>
            </select>
            <select
              value={metric}
              onChange={(event) => setMetric(event.target.value)}
              className="rounded-none border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-widest focus:border-slate-900 focus:outline-none"
            >
              <option value="revenue">Revenue (SEK)</option>
              <option value="orders">Order Volume</option>
            </select>
          </div>
        </div>

        <StableChartContainer className="w-full" size="feature">
          {({ width, height }) => (
            <AreaChart width={width} height={height} data={trendData} margin={{ top: 10, right: 0, bottom: 0, left: -15 }}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f172a" stopOpacity={0.05} />
                  <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
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
                  if (!active || !payload || payload.length === 0) {
                    return null;
                  }

                  return (
                    <div className="min-w-[160px] rounded-none border border-slate-300 bg-white p-4 shadow-none">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{metric}</span>
                        <span className="text-sm font-bold text-slate-900">
                          {(payload[0]?.value ?? 0).toLocaleString()} {metric === 'revenue' ? 'SEK' : ''}
                        </span>
                      </div>
                    </div>
                  );
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
          )}
        </StableChartContainer>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat, index) => (
          <div key={index} className="rounded-none border border-slate-300 bg-white p-6 transition-all hover:bg-slate-50">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-none border border-slate-300 bg-white text-slate-900">
                <stat.icon className="h-4 w-4" />
              </div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{stat.name}</h3>
            </div>
            <p className="text-[20px] font-bold tracking-tight text-slate-900">{stat.value}</p>
            <div
              className={`mt-2 inline-flex items-center rounded-none border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                stat.changeType === 'positive'
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                  : 'border-rose-100 bg-rose-50 text-rose-700'
              }`}
            >
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-none border border-slate-300 bg-white p-6 sm:p-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900">Inventory Health</h3>
              <p className="mt-1 text-xs text-slate-500">Stock levels and replenishment alerts</p>
            </div>
            <div className="flex gap-2">
              <div className="rounded-none border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-rose-700">
                {inventoryAnalyst.outOfStockCount} Out
              </div>
              <div className="rounded-none border border-amber-100 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                {inventoryAnalyst.lowStockCount} Low
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {inventoryAnalyst.lowStockProducts.length > 0 ? (
              inventoryAnalyst.lowStockProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    if (onProductClick) {
                      onProductClick(toProduct(product));
                      return;
                    }

                    router.push(`/admin/products?id=${product.id}`);
                  }}
                  className="group flex w-full items-center justify-between rounded-none border border-slate-200 bg-slate-50 p-4 transition-all hover:border-slate-300"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-slate-300 bg-white text-slate-500 transition-colors group-hover:text-slate-900">
                      <Package className="h-5 w-5" />
                    </div>
                    <span className="truncate text-sm font-bold text-slate-900">{product.title}</span>
                  </div>
                  <span className="ml-2 shrink-0 rounded-none border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-rose-700">
                    {(Number(product.stock) || 0).toString()} Units
                  </span>
                </button>
              ))
            ) : (
              <div className="rounded-none border border-slate-300 bg-slate-50 py-12 text-center">
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Inventory Fully Stocked</p>
              </div>
            )}

            {inventoryAnalyst.hasMoreLowStock && (
              <button
                onClick={() => setVisibleInventoryCount((previous) => previous + 10)}
                className="w-full rounded-none border border-slate-300 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 transition-all hover:border-slate-900 hover:text-slate-900"
              >
                Load More
              </button>
            )}
          </div>
        </div>

        <div className="rounded-none border border-slate-300 bg-white p-6 sm:p-8">
          <div className="mb-8">
            <h3 className="text-lg font-bold tracking-tight text-slate-900">Top Performers</h3>
            <p className="mt-1 text-xs text-slate-500">Best selling products by revenue</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-300 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  <th className="px-4 py-4">Product</th>
                  <th className="px-4 py-4 text-center">Sales</th>
                  <th className="px-4 py-4 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProductsList.items.length > 0 ? (
                  topProductsList.items.map((product, index) => (
                    <tr key={index} className="group transition-colors hover:bg-slate-50">
                      <td className="max-w-[200px] truncate px-4 py-4 text-sm font-bold text-slate-900">{product.name}</td>
                      <td className="px-4 py-4 text-center text-sm font-medium text-slate-500">{product.sales}</td>
                      <td className="px-4 py-4 text-right text-sm font-bold text-slate-900">{product.revenue}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-xs font-bold uppercase tracking-widest text-slate-500">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {topProductsList.hasMore && (
            <div className="mt-6">
              <button
                onClick={() => setVisibleTopPerformersCount((previous) => previous + 10)}
                className="w-full rounded-none border border-slate-300 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 transition-all hover:border-slate-900 hover:text-slate-900"
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
