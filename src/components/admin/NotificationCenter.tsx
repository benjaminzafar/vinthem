"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Package, MessageSquare, RefreshCcw, X, Users, Star, CheckCheck, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

import { createClient } from '@/utils/supabase/client';

type NotificationType = 'order' | 'ticket' | 'refund' | 'customer' | 'review';

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  link: string;
};

type PersistedNotificationState = {
  readIds: string[];
  clearedBefore?: string | null;
};

const STORAGE_KEY = 'mavren-admin-notifications';
const MAX_ITEMS = 24;

function readPersistedState(): PersistedNotificationState {
  if (typeof window === 'undefined') {
    return { readIds: [], clearedBefore: null };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { readIds: [], clearedBefore: null };
    }

    const parsed = JSON.parse(raw) as PersistedNotificationState;
    return {
      readIds: Array.isArray(parsed.readIds) ? parsed.readIds : [],
      clearedBefore: typeof parsed.clearedBefore === 'string' ? parsed.clearedBefore : null,
    };
  } catch {
    return { readIds: [], clearedBefore: null };
  }
}

function persistState(nextState: PersistedNotificationState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function getNotificationStyle(type: NotificationType) {
  switch (type) {
    case 'order':
      return {
        icon: Package,
        accent: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
      };
    case 'ticket':
      return {
        icon: MessageSquare,
        accent: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
      };
    case 'refund':
      return {
        icon: RefreshCcw,
        accent: 'text-rose-700',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
      };
    case 'customer':
      return {
        icon: Users,
        accent: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
      };
    case 'review':
      return {
        icon: Star,
        accent: 'text-violet-700',
        bg: 'bg-violet-50',
        border: 'border-violet-200',
      };
    default:
      return {
        icon: Bell,
        accent: 'text-zinc-700',
        bg: 'bg-zinc-50',
        border: 'border-zinc-200',
      };
  }
}

export function NotificationCenter() {
  const supabase = createClient();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const persistedState = readPersistedState();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>(persistedState.readIds);
  const [clearedBefore, setClearedBefore] = useState<Date | null>(
    persistedState.clearedBefore ? new Date(persistedState.clearedBefore) : null
  );

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
    let active = true;

    const fetchNotifications = async () => {
      const [ordersRes, ticketsRes, refundsRes, customersRes, reviewsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, order_id, created_at')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('support_tickets')
          .select('id, subject, created_at, user_id, customer_email, status')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('refund_requests')
          .select('id, reason, created_at, user_id, order_id, status')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('users')
          .select('id, email, full_name, created_at, role')
          .eq('role', 'client')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('reviews')
          .select('id, rating, comment, created_at, user_id, user_name')
          .order('created_at', { ascending: false })
          .limit(6),
      ]);

      const customerMap = new Map<string, { email: string; name: string }>(
        (customersRes.data ?? []).map((customer) => [
          String(customer.id),
          {
            email: typeof customer.email === 'string' ? customer.email : '',
            name: typeof customer.full_name === 'string' ? customer.full_name : '',
          },
        ])
      );

      const nextItems: NotificationItem[] = [
        ...(ordersRes.data ?? []).map((order) => {
          return {
            id: `order-${order.id}`,
            type: 'order' as const,
            title: 'New order received',
            message: `Order #${order.order_id || String(order.id).slice(0, 8)} was placed and is ready for review.`,
            timestamp: new Date(order.created_at),
            link: '/admin/orders',
          };
        }),
        ...(ticketsRes.data ?? []).map((ticket) => {
          const linkedCustomer = typeof ticket.user_id === 'string' ? customerMap.get(ticket.user_id) : null;
          const customerLabel = typeof ticket.customer_email === 'string'
            ? ticket.customer_email
            : linkedCustomer?.email || linkedCustomer?.name || 'a customer';

          return {
            id: `ticket-${ticket.id}`,
            type: 'ticket' as const,
            title: 'New support activity',
            message: `${ticket.subject || 'Support request'} from ${customerLabel}.`,
            timestamp: new Date(ticket.created_at),
            link: '/admin/customers',
          };
        }),
        ...(refundsRes.data ?? []).map((refund) => ({
          id: `refund-${refund.id}`,
          type: 'refund' as const,
          title: 'Refund request opened',
          message: `Refund for order #${refund.order_id || 'unknown'}: ${refund.reason || refund.status || 'Needs review'}.`,
          timestamp: new Date(refund.created_at),
          link: '/admin/customers',
        })),
        ...(customersRes.data ?? []).map((customer) => ({
          id: `customer-${customer.id}`,
          type: 'customer' as const,
          title: 'New customer signup',
          message: `${customer.full_name || customer.email || 'New customer'} created an account.`,
          timestamp: new Date(customer.created_at),
          link: '/admin/customers',
        })),
        ...(reviewsRes.data ?? []).map((review) => {
          const linkedCustomer = typeof review.user_id === 'string' ? customerMap.get(review.user_id) : null;
          const reviewer = review.user_name || linkedCustomer?.name || linkedCustomer?.email || 'A customer';

          return {
            id: `review-${review.id}`,
            type: 'review' as const,
            title: 'New review submitted',
            message: `${reviewer} left a ${review.rating || 0}-star review${review.comment ? `: ${review.comment}` : '.'}`,
            timestamp: new Date(review.created_at),
            link: '/admin/customers',
          };
        }),
      ]
        .filter((item) => !Number.isNaN(item.timestamp.getTime()))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, MAX_ITEMS);

      if (active) {
        setNotifications(nextItems);
      }
    };

    void fetchNotifications();

    const ordersChannel = supabase
      .channel('admin-notifications-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => void fetchNotifications())
      .subscribe();
    const ticketsChannel = supabase
      .channel('admin-notifications-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => void fetchNotifications())
      .subscribe();
    const refundsChannel = supabase
      .channel('admin-notifications-refunds')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refund_requests' }, () => void fetchNotifications())
      .subscribe();
    const customersChannel = supabase
      .channel('admin-notifications-customers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => void fetchNotifications())
      .subscribe();
    const reviewsChannel = supabase
      .channel('admin-notifications-reviews')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => void fetchNotifications())
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(refundsChannel);
      supabase.removeChannel(customersChannel);
      supabase.removeChannel(reviewsChannel);
    };
  }, [supabase]);

  const visibleNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (!clearedBefore) {
        return true;
      }

      return notification.timestamp.getTime() > clearedBefore.getTime();
    });
  }, [notifications, clearedBefore]);

  const unreadCount = visibleNotifications.filter((notification) => !readIds.includes(notification.id)).length;

  const markAllAsRead = () => {
    const nextReadIds = Array.from(new Set([...readIds, ...visibleNotifications.map((notification) => notification.id)]));
    setReadIds(nextReadIds);
    persistState({
      readIds: nextReadIds,
      clearedBefore: clearedBefore ? clearedBefore.toISOString() : null,
    });
  };

  const clearOldData = () => {
    const cutoff = new Date();
    setClearedBefore(cutoff);
    const nextReadIds = Array.from(new Set([...readIds, ...visibleNotifications.map((notification) => notification.id)]));
    setReadIds(nextReadIds);
    persistState({
      readIds: nextReadIds,
      clearedBefore: cutoff.toISOString(),
    });
  };

  const handleOpen = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      markAllAsRead();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative flex h-[42px] w-[42px] items-center justify-center rounded-md border border-zinc-200 bg-white transition-colors hover:bg-zinc-50"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-zinc-600" />
        {unreadCount > 0 && (
          <>
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" />
            <span className="absolute -top-1 -right-1 min-w-[18px] rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {Math.min(unreadCount, 9)}
            </span>
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            className="absolute right-0 mt-2 z-50 w-[380px] overflow-hidden border border-slate-300 bg-white shadow-2xl"
          >
            <div className="border-b border-slate-300 bg-slate-50 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Admin Activity</p>
                  <h3 className="mt-2 text-sm font-bold uppercase tracking-widest text-slate-900">Notifications</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 transition-colors hover:text-slate-900">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-900 transition-colors hover:bg-slate-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark read
                </button>
                <button
                  type="button"
                  onClick={clearOldData}
                  className="inline-flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-900 transition-colors hover:bg-slate-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear old data
                </button>
              </div>
            </div>

            <div className="max-h-[440px] overflow-y-auto">
              {visibleNotifications.length > 0 ? (
                <div className="divide-y divide-slate-200">
                  {visibleNotifications.map((notification) => {
                    const style = getNotificationStyle(notification.type);
                    const NotificationIcon = style.icon;
                    const isRead = readIds.includes(notification.id);

                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => {
                          router.push(notification.link);
                          setIsOpen(false);
                        }}
                        className={`flex w-full gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 ${!isRead ? 'bg-slate-50/60' : 'bg-white'}`}
                      >
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center border ${style.border} ${style.bg}`}>
                          <NotificationIcon className={`h-4 w-4 ${style.accent}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-900">{notification.title}</p>
                              <p className="mt-2 text-sm leading-6 text-slate-600">{notification.message}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                              </p>
                              {!isRead && <div className="mt-3 ml-auto h-2 w-2 bg-slate-900" />}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center border border-slate-300 bg-slate-50">
                    <Bell className="h-7 w-7 text-slate-300" />
                  </div>
                  <p className="mt-5 text-sm font-bold uppercase tracking-widest text-slate-900">No active notifications</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    New order and CRM activity will appear here automatically.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-300 bg-white px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  router.push('/admin/customers');
                  setIsOpen(false);
                }}
                className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-900"
              >
                Open CRM activity
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
