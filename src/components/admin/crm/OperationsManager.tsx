"use client";

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, XCircle, Mail, Send, 
  Package, Star, User 
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface OperationsManagerProps {
  type: 'refunds' | 'newsletter' | 'reviews';
  data: any;
  loading: boolean;
}

export function OperationsManager({ type, data, loading }: OperationsManagerProps) {
  const supabase = createClient();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // 1. Refunds Logic (Aligned with Overview 'Inventory Health' style)
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
          {data.length === 0 ? (
            <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[11px]">No active refund requests</td></tr>
          ) : data.map((refund: any) => (
            <tr key={refund.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-bold text-slate-900 text-sm">#{refund.orderId?.slice(0, 8)}</td>
              <td className="px-6 py-4 text-xs font-medium text-slate-500">{new Date(refund.createdAt).toLocaleDateString()}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                  refund.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}>
                  {refund.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button className="p-2 border border-slate-300 rounded hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-900"><CheckCircle2 className="w-4 h-4" /></button>
                  <button className="p-2 border border-slate-300 rounded hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-900"><XCircle className="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // 2. Newsletter Logic
  const renderNewsletter = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="space-y-6">
        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <User className="w-4 h-4" /> Active Subscribers
        </h4>
        <div className="max-h-[400px] overflow-y-auto border border-slate-300 rounded bg-slate-50/30 custom-scrollbar">
          <table className="w-full text-left">
            <tbody className="divide-y divide-slate-100">
              {data.subscribers?.map((sub: any) => (
                <tr key={sub.id} className="hover:bg-slate-100 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{sub.email}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(sub.subscribedAt).toLocaleDateString()}</span>
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
          <button className="w-full h-11 bg-slate-900 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" /> Launch New Campaign
          </button>
          <div className="space-y-3">
            {data.campaigns?.map((camp: any) => (
              <div key={camp.id} className="p-5 border border-slate-300 rounded bg-white hover:bg-slate-50 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-bold text-slate-900 text-sm truncate max-w-[70%]">{camp.subject}</h5>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(camp.sentAt).toLocaleDateString()}</span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{camp.recipientCount} Contacts reached</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // 3. Reviews Logic
  const renderReviews = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {data.map((review: any) => (
        <div key={review.id} className="bg-white border border-slate-300 p-6 sm:p-8 rounded hover:bg-slate-50 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-slate-900 text-slate-900' : 'text-slate-200'}`} />
              ))}
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</span>
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
    </div>
  );
}
