"use client";

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, XCircle, Mail, Send, 
  Package, Star, User 
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
  
  // Campaign Composer State
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignContent, setCampaignContent] = useState('');

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignSubject || !campaignContent) {
      toast.error('Please provide both a subject and content for the campaign.');
      return;
    }

    setIsDispatching(true);
    const toastId = toast.loading('Dispatching campaign to all contacts...');

    try {
      const result = await dispatchCampaignAction({
        subject: campaignSubject,
        content: campaignContent
      });

      if (!result.success) throw new Error(result.error || result.message);

      toast.success(result.message, { id: toastId });
      setShowCampaignModal(false);
      setCampaignSubject('');
      setCampaignContent('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Campaign failed to launch.';
      toast.error(message, { id: toastId });
    } finally {
      setIsDispatching(false);
    }
  };

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
        campaigns?: Array<Record<string, unknown> & { sentAt?: string | null; recipientCount?: number }>;
      }
    : { subscribers: [], campaigns: [] });

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
            <th className="px-6 py-4">Requested</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {refunds.length === 0 ? (
            <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[11px]">No active refund requests</td></tr>
          ) : refunds.map((refund) => (
            <tr key={refund.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-bold text-slate-900 text-sm">#{refund.orderId?.slice(0, 8) || refund.id.slice(0, 8)}</td>
              <td className="px-6 py-4 text-xs font-medium text-slate-500">{refund.createdAt ? new Date(refund.createdAt).toLocaleDateString() : 'N/A'}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
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
                    className="p-2 border border-slate-300 rounded hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-900 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRefundStatus(refund.id, 'Rejected')}
                    disabled={isUpdating === refund.id}
                    className="p-2 border border-slate-300 rounded hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-900 disabled:opacity-50"
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="space-y-6">
        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <User className="w-4 h-4" /> Active Subscribers
        </h4>
        <div className="max-h-[400px] overflow-y-auto border border-slate-300 rounded bg-slate-50/30 custom-scrollbar">
          <table className="w-full text-left">
            <tbody className="divide-y divide-slate-100">
              {newsletterData.subscribers?.map((sub) => (
                <tr key={sub.email} className="hover:bg-slate-100 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">{typeof sub.email === 'string' ? sub.email : ''}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {typeof sub.customerName === 'string' && sub.customerName ? sub.customerName : (typeof sub.source === 'string' ? sub.source.replace(/_/g, ' ') : 'unknown source')}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${
                      sub.status === 'unsubscribed'
                        ? 'bg-rose-50 text-rose-700'
                        : sub.status === 'registered'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {sub.status || 'subscribed'}
                    </span>
                    <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">
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

      <div className="space-y-6">
        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Send className="w-4 h-4" /> Dispatched Campaigns
        </h4>
        <div className="space-y-4">
          <button 
            onClick={() => setShowCampaignModal(true)}
            className="w-full h-11 bg-slate-900 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" /> Launch New Campaign
          </button>
          <div className="space-y-3">
            {newsletterData.campaigns?.map((camp) => (
              <div key={String(camp.id)} className="p-5 border border-slate-300 rounded bg-white hover:bg-slate-50 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-bold text-slate-900 text-sm truncate max-w-[70%]">{typeof camp.subject === 'string' ? camp.subject : 'Untitled campaign'}</h5>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{camp.sentAt ? new Date(camp.sentAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{camp.recipientCount} Contacts reached</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {reviews.map((review) => (
        <div key={review.id} className="bg-white border border-slate-300 p-6 sm:p-8 rounded hover:bg-slate-50 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < (review.rating ?? 0) ? 'fill-slate-900 text-slate-900' : 'text-slate-200'}`} />
              ))}
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>
          
          <p className="text-sm font-medium text-slate-900 leading-relaxed mb-6">{review.comment}</p>
          
          <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
            <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
              {review.userName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{review.userName}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Verified Collector</p>
            </div>
          </div>

          {review.adminReply && (
            <div className="mt-6 bg-slate-50 p-4 rounded border border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
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
    return <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[11px]">Syncing operations...</div>;
  }

  return (
    <div className="animate-in fade-in duration-300">
      {type === 'refunds' && renderRefunds()}
      {type === 'newsletter' && renderNewsletter()}
      {type === 'reviews' && renderReviews()}

      {/* Campaign Composer Modal */}
      <AnimatePresence>
        {showCampaignModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-white rounded shadow-2xl border border-slate-300 overflow-hidden"
            >
              <form onSubmit={handleLaunchCampaign}>
                <div className="px-8 py-6 border-b border-slate-300 flex items-center justify-between bg-slate-50">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Campaign Composer</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Targeting: Registered Leads & Subscribers</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowCampaignModal(false)}
                    className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-all text-slate-500"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Campaign Subject</label>
                    <input 
                      type="text"
                      required
                      value={campaignSubject}
                      onChange={(e) => setCampaignSubject(e.target.value)}
                      placeholder="e.g. Exclusive Weekend Sale - Up to 40% Off"
                      className="h-12 w-full rounded border border-slate-300 px-4 text-sm font-medium transition-all focus:border-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Email Content</label>
                    <textarea 
                      required
                      rows={8}
                      value={campaignContent}
                      onChange={(e) => setCampaignContent(e.target.value)}
                      placeholder="Compose your promotional message here..."
                      className="w-full rounded border border-slate-300 p-4 text-sm font-medium transition-all focus:border-slate-900 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-100 p-4 rounded text-blue-700 space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" /> Broadcast Intelligence
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      Your message will be recorded in the system and tracked against current customer activity models.
                    </p>
                  </div>
                </div>

                <div className="px-8 py-6 bg-slate-50 border-t border-slate-300 flex items-center justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCampaignModal(false)}
                    className="h-11 px-6 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDispatching}
                    className="h-11 px-8 bg-slate-900 text-white rounded text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                  >
                    {isDispatching ? 'Dispatching...' : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Launch Campaign
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
