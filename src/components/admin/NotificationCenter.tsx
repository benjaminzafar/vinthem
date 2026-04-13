"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Package, MessageSquare, RefreshCcw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@/utils/supabase/client';

interface Notification {
  id: string;
  type: 'order' | 'ticket' | 'refund';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link: string;
}

export function NotificationCenter({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, order_id, customer_email, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (data) {
        const newOrders = data.map(o => ({
          id: `order-${o.id}`,
          type: 'order' as const,
          title: 'New Order',
          message: `Order #${o.order_id} received from ${o.customer_email}`,
          timestamp: new Date(o.created_at),
          read: false,
          link: 'orders'
        }));
        updateNotifications(newOrders);
      }
    };

    const fetchTickets = async () => {
      const { data } = await supabase
        .from('support_tickets')
        .select('id, subject, customer_email, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (data) {
        const newTickets = data.map(t => ({
          id: `ticket-${t.id}`,
          type: 'ticket' as const,
          title: 'New Support Ticket',
          message: `${t.subject} from ${t.customer_email}`,
          timestamp: new Date(t.created_at),
          read: false,
          link: 'customers'
        }));
        updateNotifications(newTickets);
      }
    };

    const fetchRefunds = async () => {
      const { data } = await supabase
        .from('refund_requests')
        .select('id, reason, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (data) {
        const newRefunds = data.map(r => ({
          id: `refund-${r.id}`,
          type: 'refund' as const,
          title: 'New Refund Request',
          message: `Reason: ${r.reason}`,
          timestamp: new Date(r.created_at),
          read: false,
          link: 'customers'
        }));
        updateNotifications(newRefunds);
      }
    };

    fetchOrders();
    fetchTickets();
    fetchRefunds();

    const ordersChannel = supabase.channel('notif-orders').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, fetchOrders).subscribe();
    const ticketsChannel = supabase.channel('notif-tickets').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_tickets' }, fetchTickets).subscribe();
    const refundsChannel = supabase.channel('notif-refunds').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'refund_requests' }, fetchRefunds).subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(refundsChannel);
    };
  }, []);

  const updateNotifications = (newItems: Notification[]) => {
    setNotifications(prev => {
      const combined = [...prev, ...newItems];
      const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      return unique.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 15);
    });
  };

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <Package className="w-4 h-4 text-blue-500" />;
      case 'ticket': return <MessageSquare className="w-4 h-4 text-amber-500" />;
      case 'refund': return <RefreshCcw className="w-4 h-4 text-rose-500" />;
      default: return <Bell className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAllAsRead();
        }}
        className="relative p-2.5 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors h-[42px] w-[42px] flex items-center justify-center"
      >
        <Bell className="w-5 h-5 text-zinc-600" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-zinc-200 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Notifications</h3>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length > 0 ? (
                <div className="divide-y divide-zinc-50">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => {
                        if (onNavigate && notification.link) {
                          onNavigate(notification.link);
                          setIsOpen(false);
                        }
                      }}
                      className={`p-4 hover:bg-zinc-50 transition-colors cursor-pointer flex gap-4 ${!notification.read ? 'bg-zinc-50/30' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        notification.type === 'order' ? 'bg-blue-50' : 
                        notification.type === 'ticket' ? 'bg-amber-50' : 'bg-rose-50'
                      }`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-black text-zinc-900 uppercase tracking-wider">{notification.title}</p>
                          <span className="text-[10px] font-bold text-zinc-400">
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">{notification.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-zinc-200" />
                  </div>
                  <p className="text-zinc-400 font-bold">No new notifications</p>
                  <p className="text-zinc-300 text-xs mt-1">We'll notify you when something happens.</p>
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-zinc-100 bg-zinc-50/30 text-center">
                <button className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-900 transition-colors">
                  View All Activity
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
