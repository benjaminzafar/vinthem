"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronRight, MessageSquare, Clock, AlertCircle } from 'lucide-react';
import { replySupportTicketAction } from '@/app/actions/support';
import { toast } from 'sonner';
import type { SupportTicket } from './types';

interface SupportManagerProps {
  tickets: SupportTicket[];
  loading: boolean;
}

export function SupportManager({ tickets, loading }: SupportManagerProps) {
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [draftReplies, setDraftReplies] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'open': return 'bg-slate-900 text-white border-slate-900';
      case 'resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
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
        status: 'in-progress',
        existingMessages: ticket?.messages ?? [],
      });

      if (!result.success) {
        throw new Error(result.error || result.message);
      }

      toast.success(result.message, { id: toastId });
      setDraftReplies((current) => ({ ...current, [ticketId]: '' }));
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

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-300 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
              <th className="px-6 py-4">Requester</th>
              <th className="px-6 py-4">Topic</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[11px]">Loading help center...</td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[11px]">No active tickets</td></tr>
            ) : (
              tickets.map((ticket) => (
                <React.Fragment key={ticket.id}>
                  <tr 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)}
                  >
                    <td className="px-6 py-4 font-bold text-slate-900 text-sm flex items-center">
                      <div className="w-6 flex items-center shrink-0">
                        {expandedTicketId === ticket.id ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                      </div>
                      {ticket.customerName || ticket.customerEmail || 'Unknown requester'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{ticket.subject}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${getStatusStyle(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-300">{ticket.priority || 'NORMAL'}</td>
                  </tr>
                  
                  {expandedTicketId === ticket.id && (
                    <tr className="bg-slate-50/30">
                      <td colSpan={4} className="px-10 py-8 border-b border-slate-300">
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                          <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-6 border border-slate-300 rounded">
                              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" /> Initial Inquiry
                              </h4>
                              <p className="text-sm text-slate-900 font-medium leading-relaxed">
                                {ticket.description || 'No system description provided.'}
                              </p>
                            </div>

                            <div className="space-y-4">
                              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare className="w-3.5 h-3.5" /> Conversation Log
                              </h4>
                              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                                {ticket.messages?.map((msg, idx) => (
                                  <div key={idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded text-sm ${
                                      msg.sender === 'admin' 
                                        ? 'bg-slate-900 text-white rounded-tr-none' 
                                        : 'bg-white border border-slate-300 text-slate-900 rounded-tl-none'
                                    }`}>
                                      <p className={msg.sender === 'admin' ? '' : 'font-medium'}>{msg.text}</p>
                                      <span className={`text-[9px] font-bold uppercase tracking-widest block mt-2 ${msg.sender === 'admin' ? 'text-slate-400' : 'text-slate-400'}`}>
                                        {new Date(msg.createdAt).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                                {(!ticket.messages || ticket.messages.length === 0) && (
                                  <div className="flex items-center gap-3 text-slate-400 bg-white p-4 rounded border border-slate-300 border-dashed">
                                    <AlertCircle className="w-4 h-4" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting interaction</p>
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
                                <div className="absolute bottom-4 right-4">
                                  <button 
                                    onClick={() => handleReplyTicket(ticket.id)}
                                    disabled={isUpdating || !(draftReplies[ticket.id] ?? '').trim()}
                                    className="bg-slate-900 text-white px-5 py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all"
                                  >
                                    {isUpdating ? 'Syncing...' : 'Send Response'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-6 border border-slate-300 rounded space-y-6">
                            <div>
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Support Controls</h4>
                              <div className="flex flex-col gap-2">
                                {['open', 'resolved'].map((s) => (
                                  <button 
                                    key={s}
                                    onClick={() => handleStatusChange(ticket.id, s as SupportTicket['status'])}
                                    disabled={isUpdating}
                                    className={`py-2 px-3 rounded text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                      ticket.status === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-300'
                                    } disabled:opacity-50`}
                                  >
                                    Mark as {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {ticket.imageUrl && (
                              <div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Attachment</h4>
                                <a href={ticket.imageUrl} target="_blank" rel="noopener noreferrer" className="block rounded border border-slate-300 overflow-hidden">
                                  <img src={ticket.imageUrl} alt="" className="w-full grayscale hover:grayscale-0 transition-all" />
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
