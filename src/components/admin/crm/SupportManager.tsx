"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronRight, MessageSquare, Clock, AlertCircle, Trash2, Truck, Globe, ImageIcon } from 'lucide-react';
import { replySupportTicketAction, deleteSupportTicketAction } from '@/app/actions/support';
import { toMediaProxyUrl } from '@/lib/media';
import { isValidUrl } from '@/lib/utils';
import { toast } from 'sonner';
import type { SupportTicket } from './types';
import { useCustomConfirm } from '@/components/ConfirmationContext';

interface SupportManagerProps {
  tickets: SupportTicket[];
  loading: boolean;
}

export function SupportManager({ tickets, loading }: SupportManagerProps) {
  const customConfirm = useCustomConfirm();
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [draftReplies, setDraftReplies] = useState<Record<string, string>>({});
  const [replyImages, setReplyImages] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  const parseApiPayload = async (response: Response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json() as Record<string, unknown>;
    }

    const rawText = await response.text();
    return {
      error: rawText || `Request failed with status ${response.status}`,
    };
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'open': return 'bg-slate-900 text-white border-slate-900';
      case 'resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Approved': case 'WaitingItem': case 'Received': case 'Exchanged': case 'Refunded': 
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const handleReplyTicket = async (ticketId: string) => {
    const replyText = draftReplies[ticketId]?.trim() ?? '';
    if (!replyText) return;
    setIsUpdating(true);
    const toastId = toast.loading('Syncing response...');

    try {
      const ticket = tickets.find(t => t.id === ticketId);
      const result = await replySupportTicketAction({
        ticketId,
        replyText,
        imageUrl: replyImages[ticketId],
        status: 'in-progress',
        existingMessages: ticket?.messages ?? [],
      });

      if (!result.success) {
        throw new Error(result.error || result.message);
      }

      toast.success(result.message, { id: toastId });
      setDraftReplies((current) => ({ ...current, [ticketId]: '' }));
      setReplyImages((current) => ({ ...current, [ticketId]: '' }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update support ticket.';
      toast.error(message, { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: SupportTicket['status']) => {
    setIsUpdating(true);
    const toastId = toast.loading('Updating ticket...');

    try {
      const ticket = tickets.find((item) => item.id === ticketId);
      const result = await replySupportTicketAction({
        ticketId,
        status,
        existingMessages: ticket?.messages ?? [],
      });

      if (!result.success) {
        throw new Error(result.error || result.message);
      }

      toast.success(result.message, { id: toastId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update support ticket.';
      toast.error(message, { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    const confirmed = await customConfirm(
      'Delete Ticket',
      'Permanently delete this ticket and all associated messages? This action cannot be undone.',
      { confirmLabel: 'Delete Ticket', confirmVariant: 'danger' }
    );

    if (!confirmed) {
      return;
    }

    setIsUpdating(true);
    const toastId = toast.loading('Deleting ticket...');

    try {
      const result = await deleteSupportTicketAction(ticketId);
      if (!result.success) throw new Error(result.error || result.message);
      toast.success(result.message, { id: toastId });
      setExpandedTicketId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete support ticket.';
      toast.error(message, { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-300 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
              <th className="px-6 py-4">Requester</th>
              <th className="px-6 py-4">Topic</th>
              <th className="px-6 py-4 text-center"><Globe className="w-3.5 h-3.5 inline-block" /></th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-[11px]">Loading help center...</td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan={4} className="py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-[11px]">No active tickets</td></tr>
            ) : (
              tickets.map((ticket) => (
                <React.Fragment key={ticket.id}>
                  <tr 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)}
                  >
                    <td className="px-6 py-4 font-bold text-slate-900 text-sm flex items-center">
                      <div className="w-6 flex items-center shrink-0">
                        {expandedTicketId === ticket.id ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                      {ticket.customerName || ticket.customerEmail || 'Unknown requester'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{ticket.subject}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-tight bg-slate-100 text-slate-500 border border-slate-200">
                        {ticket.locale || 'EN'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-widest border ${getStatusStyle(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-300">{ticket.priority || 'NORMAL'}</td>
                  </tr>
                  
                  {expandedTicketId === ticket.id && (
                    <tr className="bg-slate-50/30">
                      <td colSpan={4} className="px-10 py-8 border-b border-slate-300">
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                          <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-6 border border-slate-300 rounded">
                              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" /> Initial Inquiry
                              </h4>
                              <p className="text-sm text-slate-900 font-medium leading-relaxed">
                                {ticket.description || 'No system description provided.'}
                              </p>
                            </div>

                            <div className="space-y-4">
                              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare className="w-3.5 h-3.5" /> Conversation Log
                              </h4>
                              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                                {ticket.messages?.map((msg, idx) => (
                                  <div key={idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded text-sm ${
                                      msg.sender === 'admin' 
                                        ? msg.text.startsWith('[SYSTEM]') 
                                          ? 'bg-slate-50 border border-slate-200 text-slate-500 rounded-tr-none'
                                          : 'bg-slate-900 text-white rounded-tr-none' 
                                        : 'bg-white border border-slate-300 text-slate-900 rounded-tl-none'
                                    }`}>
                                      <p className={`${msg.sender === 'admin' ? '' : 'font-medium'} ${msg.text.startsWith('[SYSTEM]') ? 'italic text-[11px]' : ''}`}>
                                        {msg.text.startsWith('[SYSTEM]') ? msg.text.replace('[SYSTEM]', '🤖') : msg.text}
                                      </p>
                                      {msg.imageUrl && isValidUrl(msg.imageUrl) && (
                                        <div className="mt-3 relative aspect-video w-full rounded overflow-hidden border border-slate-200">
                                          <Image src={toMediaProxyUrl(msg.imageUrl)} alt="Attachment" fill className="object-cover" />
                                        </div>
                                      )}
                                      <span className="text-[9px] font-bold uppercase tracking-widest block mt-2 text-slate-500">
                                        {msg.createdAt && !isNaN(new Date(msg.createdAt).getTime()) ? new Date(msg.createdAt).toLocaleString() : 'Recent'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                                {(!ticket.messages || ticket.messages.length === 0) && (
                                  <div className="flex items-center gap-3 text-slate-500 bg-white p-4 rounded border border-slate-300 border-dashed">
                                    <AlertCircle className="w-4 h-4" />
                                    <p className="text-[11px] font-bold uppercase tracking-widest">Awaiting interaction</p>
                                  </div>
                                )}
                              </div>

                              <div className="pt-4 relative">
                                <textarea
                                  value={draftReplies[ticket.id] ?? ''}
                                  onChange={(e) => setDraftReplies((current) => ({ ...current, [ticket.id]: e.target.value }))}
                                  placeholder="Type your official response..."
                                  className="w-full bg-white border border-slate-300 rounded p-4 text-sm font-medium min-h-[100px] focus:outline-none focus:border-slate-900 transition-all"
                                />
                                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                  {replyImages[ticket.id] ? (
                                    <div className="relative w-10 h-10 border border-slate-300 bg-white">
                                      <Image src={toMediaProxyUrl(replyImages[ticket.id])} alt="Reply preview" fill className="object-cover" />
                                      <button onClick={() => setReplyImages(prev => ({ ...prev, [ticket.id]: '' }))} className="absolute -top-1.5 -right-1.5 bg-white border border-slate-300 rounded-full p-0.5 text-slate-500">
                                        <ChevronDown className="w-2.5 h-2.5 rotate-45" />
                                      </button>
                                    </div>
                                  ) : (
                                    <label className="p-2 text-slate-500 hover:text-slate-900 cursor-pointer transition-colors bg-white border border-slate-200 rounded">
                                      <ImageIcon className="w-4 h-4" />
                                      <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          setIsUpdating(true);
                                          const tId = toast.loading('Uploading clinical evidence...');
                                          try {
                                            const fd = new FormData();
                                            fd.append('file', file);
                                            fd.append('path', `support/admin/replies/${Date.now()}_${file.name}`);
                                            const res = await fetch('/api/upload', {
                                              method: 'POST',
                                              body: fd,
                                              credentials: 'include',
                                            });
                                            const payload = await parseApiPayload(res);
                                            if (!res.ok || typeof payload.error === 'string' || typeof payload.url !== 'string') {
                                              throw new Error(typeof payload.error === 'string' ? payload.error : 'Upload failed');
                                            }
                                            setReplyImages(prev => ({ ...prev, [ticket.id]: payload.url as string }));
                                            toast.success('Asset synced', { id: tId });
                                          } catch (error: unknown) {
                                            const message = error instanceof Error ? error.message : 'Upload failed';
                                            toast.error(message, { id: tId });
                                          } finally {
                                            setIsUpdating(false);
                                          }
                                        }} 
                                      />
                                    </label>
                                  )}
                                  <button 
                                    onClick={() => handleReplyTicket(ticket.id)}
                                    disabled={isUpdating || !(draftReplies[ticket.id] ?? '').trim()}
                                    className="bg-slate-900 text-white px-5 py-2 rounded text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all"
                                  >
                                    {isUpdating ? 'Syncing...' : 'Send Response'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-6 border border-slate-300 rounded space-y-6">
                            <div>
                              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Support Controls</h4>
                              <div className="flex flex-col gap-2">
                                {['open', 'resolved'].map((s) => (
                                  <button 
                                    key={s}
                                    onClick={() => handleStatusChange(ticket.id, s as SupportTicket['status'])}
                                    disabled={isUpdating}
                                    className={`py-2 px-3 rounded text-[11px] font-bold uppercase tracking-widest border transition-all ${
                                      ticket.status === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-zinc-50 text-slate-500 border-slate-200'
                                    } disabled:opacity-50`}
                                  >
                                    Mark as {s}
                                  </button>
                                ))}
                              </div>

                              {/* Return Workflow Section */}
                              <div className="mt-6 pt-6 border-t border-slate-100">
                                <h4 className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2 text-wrap">
                                  <Truck className="w-3.5 h-3.5" /> Return Workflow
                                </h4>
                                <div className="grid grid-cols-1 gap-2">
                                  {[
                                    { id: 'Approved', label: 'Approve & Send Policy' },
                                    { id: 'WaitingItem', label: 'Set Awaiting Item' },
                                    { id: 'Received', label: 'Confirm Item Received' },
                                    { id: 'Exchanged', label: 'Mark as Exchanged' },
                                    { id: 'Refunded', label: 'Issue Final Refund' }
                                  ].map((action) => {
                                    const langSuffix = (ticket.locale || 'en').toUpperCase();
                                    return (
                                        <button 
                                        key={action.id}
                                        onClick={async () => {
                                          const isRefund = action.id === 'Refunded';
                                          const confirm = isRefund
                                            ? await customConfirm(
                                                'Issue Refund',
                                                'This will trigger a real Stripe refund for the customer. Continue?',
                                                { confirmLabel: 'Issue Refund', confirmVariant: 'danger' }
                                              )
                                            : true;
                                          
                                          if (!confirm) return;
 
                                          setIsUpdating(true);
                                          const toastId = toast.loading(`Processing ${action.id}...`);
                                          try {
                                            const { updateReturnWorkflowAction } = await import('@/app/actions/support');
                                            const res = await updateReturnWorkflowAction({
                                              requestId: ticket.id,
                                              status: action.id as 'Approved' | 'WaitingItem' | 'Received' | 'Exchanged' | 'Refunded',
                                              orderId: ticket.orderId ?? undefined
                                            });
                                            if (res.success) toast.success(res.message, { id: toastId });
                                            else throw new Error(res.error || res.message);
                                          } catch (err) {
                                            const errorMessage = err instanceof Error ? err.message : 'Unknown error during refund';
                                            toast.error(errorMessage, { id: toastId });
                                          } finally {
                                            setIsUpdating(false);
                                          }
                                        }}
                                        disabled={isUpdating}
                                        className={`py-2.5 px-3 rounded text-[11px] font-bold uppercase tracking-widest border transition-all ${
                                          ticket.status === action.id 
                                            ? 'bg-indigo-600 text-white border-indigo-600' 
                                            : 'bg-white text-indigo-600 border-indigo-100 hover:border-indigo-300'
                                        } disabled:opacity-50 text-left flex justify-between items-center group`}
                                      >
                                        <span>{action.label}</span>
                                        <span className="text-[11px] opacity-40 group-hover:opacity-100 transition-opacity bg-indigo-50 text-indigo-500 px-1 rounded ml-1">sync:{langSuffix}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="pt-6 border-t border-slate-100 mt-6">
                                <h4 className="text-[11px] font-bold text-rose-400 uppercase tracking-widest mb-4">Critical Actions</h4>
                                <button
                                  onClick={() => handleDeleteTicket(ticket.id)}
                                  disabled={isUpdating}
                                  className="w-full py-2 px-3 rounded text-[11px] font-bold uppercase tracking-widest border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                >
                                  <Trash2 className="w-3 h-3 transition-transform group-hover:scale-110" />
                                  Archive & Delete
                                </button>
                              </div>
                            </div>
                            {ticket.imageUrl && (
                              <div>
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Attachment</h4>
                                <a href={ticket.imageUrl} target="_blank" rel="noopener noreferrer" className="block rounded border border-slate-300 overflow-hidden">
                                  <div className="relative aspect-[4/3] w-full">
                                    <Image src={toMediaProxyUrl(ticket.imageUrl)} alt="" fill className="object-cover grayscale hover:grayscale-0 transition-all" sizes="(max-width: 1024px) 100vw, 320px" />
                                  </div>
                                </a>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
