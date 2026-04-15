"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Mail, Calendar, Package, 
  ChevronDown, ChevronRight, ShoppingBag 
} from 'lucide-react';

interface CRMDetailViewProps {
  customer: any;
  onBack: () => void;
}

export function CRMDetailView({ customer, onBack }: CRMDetailViewProps) {
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', customer.email)
        .order('created_at', { ascending: false });
      
      if (!error) {
        setOrders(data.map(o => ({
          ...o,
          orderId: o.order_id,
          createdAt: o.created_at,
          items: o.items
        })));
      }
      setLoading(false);
    };

    fetchOrders();
  }, [customer.email]);

  const totalSpent = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* 1. Navigation */}
      <button 
        onClick={onBack}
        className="flex items-center text-[11px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-all group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" /> Return to Intelligence Hub
      </button>

      {/* 2. Customer Deep-Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 sm:p-10 border border-slate-300 rounded shadow-none">
            <div className="flex items-center space-x-6 mb-10">
              <div className="w-16 h-16 bg-slate-900 text-white rounded flex items-center justify-center text-xl font-bold">
                {customer.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 truncate max-w-[180px]" title={customer.email}>
                  {customer.email?.split('@')[0]}
                </h2>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest mt-2 border ${
                  customer.role === 'admin' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  {customer.role || 'client'}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center text-sm text-slate-900 font-bold">
                <Mail className="w-4 h-4 mr-4 text-slate-400" />
                <span className="truncate">{customer.email}</span>
              </div>
              <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <Calendar className="w-4 h-4 mr-4 text-slate-400" />
                <span>Enrolled {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 sm:p-10 rounded text-white overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Aggregate Revenue</h3>
              <div className="text-3xl font-bold tracking-tight mb-2">{totalSpent.toLocaleString()} SEK</div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{orders.length} Processed Transactions</p>
            </div>
            <ShoppingBag className="w-32 h-32 absolute -bottom-8 -right-8 text-white/5" />
          </div>
        </div>

        {/* 3. Transaction Hub */}
        <div className="lg:col-span-2 bg-white rounded border border-slate-300 overflow-hidden shadow-none">
          <div className="p-6 sm:p-8 border-b border-slate-300 bg-slate-50/30 flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Transaction Hub</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-300 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
                  <th className="px-8 py-5">Order ID</th>
                  <th className="px-8 py-5">Timestamp</th>
                  <th className="px-8 py-5">Fulfillment</th>
                  <th className="px-8 py-5 text-right">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[11px]">Syncing history...</td></tr>
                ) : orders.length > 0 ? (
                  orders.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr 
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                      >
                        <td className="px-8 py-5 font-bold text-slate-900 text-sm flex items-center">
                          <div className="w-6 flex items-center shrink-0">
                            {expandedOrderId === order.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                          </div>
                          #{order.orderId?.slice(0, 12)}
                        </td>
                        <td className="px-8 py-5 text-xs font-medium text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-8 py-5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${
                            order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                            {order.status || 'Processing'}
                          </span>
                        </td>
                        <td className="px-8 py-5 font-bold text-right text-sm text-slate-900">{order.total} SEK</td>
                      </tr>
                      {expandedOrderId === order.id && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={4} className="px-12 py-8 border-b border-slate-300">
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Manifest Breakdown</h4>
                              <div className="space-y-3">
                                {order.items?.map((item: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded">
                                    <div className="flex items-center space-x-4">
                                      <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded flex items-center justify-center overflow-hidden shrink-0">
                                        {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover grayscale" /> : <Package className="w-5 h-5 text-slate-300" />}
                                      </div>
                                      <div>
                                        <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Qty: {item.quantity}</p>
                                      </div>
                                    </div>
                                    <p className="font-bold text-slate-900 text-sm">{item.price * item.quantity} SEK</p>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[11px]">No transactions recorded.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
