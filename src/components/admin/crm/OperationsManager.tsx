"use client";

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, XCircle, Mail, Send, 
  Package, Star, User, Globe 
} from 'lucide-react';
import { updateRefundStatusAction } from '@/app/actions/support';
import { dispatchCampaignAction } from '@/app/actions/newsletter';
import { toast } from 'sonner';
import { AnimatePresence } from 'motion/react';
import type { RefundRecord, ReviewRecord } from './types';

interface OperationsManagerProps {
  type: 'refunds' | 'newsletter' | 'reviews';
  data: unknown;
  loading: boolean;
}

export function OperationsManager({ type, data, loading }: OperationsManagerProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const refunds = Array.isArray(data) ? data as RefundRecord[] : [];
  const reviews = Array.isArray(data) ? data as ReviewRecord[] : [];
  const newsletterData = (!Array.isArray(data) && typeof data === 'object' && data !== null
    ? data as {
        subscribers?: Array<Record<string, unknown> & {
          email?: string;
          source?: string;
          status?: string;
          customerName?: string | null;
          subscribedAt?: string | null;
          unsubscribedAt?: string | null;
          consentedAt?: string | null;
        }>;
      }
    : { subscribers: [] });

  const handleRefundStatus = async (refundId: string, status: RefundRecord['status']) => {
    setIsUpdating(refundId);
    const toastId = toast.loading('Updating refund request...');

    try {
      const result = await updateRefundStatusAction({ refundRequestId: refundId, status });
      if (!result.success) {
        throw new Error(result.error || result.message);
      }

      toast.success(result.message, { id: toastId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update refund status.';
      toast.error(message, { id: toastId });
    } finally {
      setIsUpdating(null);
    }
  };

  const renderRefunds = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-300 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
            <th className="px-6 py-4">Order ID</th>
            <th className="px-6 py-4 text-center"><Globe className="w-3.5 h-3.5 inline-block" /></th>
            <th className="px-6 py-4">Requested</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {refunds.length === 0 ? (
            <tr><td colSpan={5} className="py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-[11px]">No active refund requests</td></tr>
          ) : refunds.map((refund) => (
            <tr key={refund.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-bold text-slate-900 text-sm">#{refund.orderId?.slice(0, 8) || refund.id.slice(0, 8)}</td>
              <td className="px-6 py-4 text-center">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-tight bg-slate-100 text-slate-500 border border-slate-200">
                  {refund.locale || 'EN'}
                </span>
              </td>
              <td className="px-6 py-4 text-xs font-medium text-slate-500">{refund.createdAt ? new Date(refund.createdAt).toLocaleDateString() : 'N/A'}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-widest border ${
                  refund.status === 'Approved' || refund.status === 'Refunded'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : refund.status === 'Rejected'
                      ? 'bg-rose-50 text-rose-700 border-rose-100'
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}>
                  {refund.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleRefundStatus(refund.id, refund.status === 'Approved' ? 'Refunded' : 'Approved')}
                    disabled={isUpdating === refund.id}
                    className="p-2 border border-slate-300 rounded-none hover:bg-slate-50 transition-all text-slate-500 hover:text-slate-900 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRefundStatus(refund.id, 'Rejected')}
                    disabled={isUpdating === refund.id}
                    className="p-2 border border-slate-300 rounded-none hover:bg-slate-50 transition-all text-slate-500 hover:text-slate-900 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderNewsletter = () => (
    <div className="space-y-6">
      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
        <User className="w-4 h-4" /> Active Subscribers & Contacts
      </h4>
      <div className="border border-slate-300 rounded-none bg-slate-50/30 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white border-b border-slate-200">
            <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <th className="px-6 py-3">Contact Identity</th>
              <th className="px-6 py-3">Source</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {newsletterData.subscribers?.map((sub) => (
              <tr key={sub.email} className="hover:bg-white transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-slate-900">{typeof sub.email === 'string' ? sub.email : ''}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {typeof sub.customerName === 'string' && sub.customerName ? sub.customerName : 'Client'}
                  </p>
                </td>
                <td className="px-6 py-4">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {typeof sub.source === 'string' ? sub.source.replace(/_/g, ' ') : 'System'}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-none px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${
                    sub.status === 'unsubscribed'
                      ? 'bg-rose-50 text-rose-700'
                      : sub.status === 'registered'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {sub.status || 'subscribed'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                    {sub.status === 'unsubscribed'
                      ? (sub.unsubscribedAt ? new Date(sub.unsubscribedAt).toLocaleDateString() : 'N/A')
                      : (sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleDateString() : 'N/A')}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {reviews.map((review) => (
        <div key={review.id} className="bg-white border border-slate-300 p-6 sm:p-8 rounded-none hover:bg-slate-50 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < (review.rating ?? 0) ? 'fill-slate-900 text-slate-900' : 'text-slate-200'}`} />
              ))}
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>
          
          <p className="text-sm font-medium text-slate-900 leading-relaxed mb-6">{review.comment}</p>
          
          <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
            <div className="w-8 h-8 rounded-none bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
              {review.userName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{review.userName}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Verified Collector</p>
            </div>
          </div>

          {review.adminReply && (
            <div className="mt-6 bg-slate-50 p-4 rounded-none border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                <Package className="w-3.5 h-3.5" /> Official Response
              </p>
              <p className="text-xs font-medium text-slate-600 italic">"{review.adminReply}"</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  if (loading) {
    return <div className="py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-[11px]">Syncing operations...</div>;
  }

  return (
    <div className="animate-in fade-in duration-300">
      {type === 'refunds' && renderRefunds()}
      {type === 'newsletter' && renderNewsletter()}
      {type === 'reviews' && renderReviews()}
    </div>
  );
}
