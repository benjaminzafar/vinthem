"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Mail, Calendar, Package, 
  ChevronDown, ChevronRight, ShoppingBag, MessageSquare, RotateCcw, Star
} from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import type { CRMCustomer, CRMOrder, RefundRecord, ReviewRecord, SupportTicket } from './types';

interface CRMDetailViewProps {
  customer: CRMCustomer;
  orders: CRMOrder[];
  tickets: SupportTicket[];
  refunds: RefundRecord[];
  reviews: ReviewRecord[];
  onBack: () => void;
}

export function CRMDetailView({ customer, orders, tickets, refunds, reviews, onBack }: CRMDetailViewProps) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const totalSpent = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;
  const primaryCurrency = orders[0]?.currency ?? undefined;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <button 
        onClick={onBack}
        className="flex items-center text-[11px] font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-all group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" /> Return to Intelligence Hub
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 sm:p-10 border border-slate-300 rounded shadow-none">
            <div className="flex items-center space-x-6 mb-10">
              <div className="w-16 h-16 bg-slate-900 text-white rounded flex items-center justify-center text-xl font-bold">
                {customer.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 truncate max-w-[180px]" title={customer.email ?? undefined}>
                  {customer.name || customer.email?.split('@')[0]}
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
                <Mail className="w-4 h-4 mr-4 text-slate-500" />
                <span className="truncate">{customer.email}</span>
              </div>
              <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <Calendar className="w-4 h-4 mr-4 text-slate-500" />
                <span>Enrolled {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border border-slate-300 bg-white p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tickets</p>
              <p className="mt-3 text-2xl font-bold text-slate-900">{tickets.length}</p>
            </div>
            <div className="border border-slate-300 bg-white p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Refunds</p>
              <p className="mt-3 text-2xl font-bold text-slate-900">{refunds.length}</p>
            </div>
            <div className="border border-slate-300 bg-white p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Reviews</p>
              <p className="mt-3 text-2xl font-bold text-slate-900">{reviews.length}</p>
            </div>
            <div className="border border-slate-300 bg-white p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Avg. Order</p>
              <p className="mt-3 text-xl font-bold text-slate-900">{formatPrice(avgOrderValue, 'en', undefined, primaryCurrency)}</p>
            </div>
          </div>

          <div className="bg-slate-900 p-8 sm:p-10 rounded text-white overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Aggregate Revenue</h3>
              <div className="text-3xl font-bold tracking-tight mb-2">{formatPrice(totalSpent, 'en', undefined, primaryCurrency)}</div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{orders.length} Processed Transactions</p>
            </div>
            <ShoppingBag className="w-32 h-32 absolute -bottom-8 -right-8 text-white/5" />
          </div>

          <div className="border border-slate-300 bg-white p-6 space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Activity Snapshot</h3>
            <div className="flex items-center justify-between text-sm font-bold text-slate-900">
              <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-slate-500" /> Latest Ticket</span>
              <span className="text-slate-500 text-xs">{tickets[0]?.createdAt ? new Date(tickets[0].createdAt).toLocaleDateString() : 'None'}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-slate-900">
              <span className="flex items-center gap-2"><RotateCcw className="w-4 h-4 text-slate-500" /> Refund Status</span>
              <span className="text-slate-500 text-xs">{refunds[0]?.status || 'No requests'}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-slate-900">
              <span className="flex items-center gap-2"><Star className="w-4 h-4 text-slate-500" /> Last Review</span>
              <span className="text-slate-500 text-xs">{reviews[0]?.createdAt ? new Date(reviews[0].createdAt).toLocaleDateString() : 'None'}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded border border-slate-300 overflow-hidden shadow-none">
            <div className="p-6 sm:p-8 border-b border-slate-300 bg-slate-50/30 flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-slate-500" />
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
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr 
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                      >
                        <td className="px-8 py-5 font-bold text-slate-900 text-sm flex items-center">
                          <div className="w-6 flex items-center shrink-0">
                            {expandedOrderId === order.id ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                          </div>
                          #{order.orderId?.slice(0, 12)}
                        </td>
                        <td className="px-8 py-5 text-xs font-medium text-slate-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-8 py-5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${
                            order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                            {order.status || 'Processing'}
                          </span>
                        </td>
                        <td className="px-8 py-5 font-bold text-right text-sm text-slate-900">{formatPrice(order.total || 0, 'en', undefined, order.currency ?? undefined)}</td>
                      </tr>
                      {expandedOrderId === order.id && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={4} className="px-12 py-8 border-b border-slate-300">
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Manifest Breakdown</h4>
                              <div className="space-y-3">
                                {order.items?.map((item, index) => (
                                  <div key={index} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded">
                                    <div className="flex items-center space-x-4">
                                      <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded flex items-center justify-center overflow-hidden shrink-0">
                                        {item.image ? (
                                          <div className="relative h-full w-full">
                                            <Image src={item.image} alt="" fill className="object-cover grayscale" sizes="40px" />
                                          </div>
                                        ) : <Package className="w-5 h-5 text-slate-300" />}
                                      </div>
                                      <div>
                                        <p className="font-bold text-slate-900 text-sm">{item.name || item.title || 'Untitled item'}</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Qty: {item.quantity || 1}</p>
                                      </div>
                                    </div>
                                    <p className="font-bold text-slate-900 text-sm">{formatPrice((Number(item.price) || 0) * (Number(item.quantity) || 1), 'en', undefined, order.currency ?? undefined)}</p>
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
                  <tr><td colSpan={4} className="p-20 text-center text-slate-500 font-bold uppercase tracking-widest text-[11px]">No transactions recorded.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="border border-slate-300 bg-white p-6 space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Support Timeline</h3>
              {tickets.length === 0 ? (
                <p className="text-sm text-slate-500">No support activity recorded yet.</p>
              ) : tickets.slice(0, 4).map((ticket) => (
                <div key={ticket.id} className="border border-slate-200 rounded p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-900">{ticket.subject}</p>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{ticket.status}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">{ticket.description || 'No description available.'}</p>
                </div>
              ))}
            </div>

            <div className="border border-slate-300 bg-white p-6 space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Feedback & Refunds</h3>
              {refunds.length === 0 && reviews.length === 0 ? (
                <p className="text-sm text-slate-500">No refunds or reviews recorded yet.</p>
              ) : (
                <>
                  {refunds.slice(0, 2).map((refund) => (
                    <div key={refund.id} className="border border-slate-200 rounded p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-slate-900">Refund #{refund.orderId?.slice(0, 8) || refund.id.slice(0, 8)}</p>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{refund.status}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{refund.reason || 'No reason supplied.'}</p>
                    </div>
                  ))}
                  {reviews.slice(0, 2).map((review) => (
                    <div key={review.id} className="border border-slate-200 rounded p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-slate-900">{review.userName || 'Anonymous'}</p>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{review.rating || 0}/5</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{review.comment || 'No review text.'}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
