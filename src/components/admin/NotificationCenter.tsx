"use client";
import { logger } from '@/lib/logger';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Package, MessageSquare, RefreshCcw, X, Users, Star, CheckCheck, Trash2, ArrowRight, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

import { createClient } from '@/utils/supabase/client';

type NotificationType = 'order' | 'ticket' | 'refund' | 'customer' | 'review' | 'newsletter';

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
    window.localStorage.removeItem(STORAGE_KEY);
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
    case 'newsletter':
      return {
        icon: Megaphone,
        accent: 'text-sky-700',
        bg: 'bg-sky-50',
        border: 'border-sky-200',
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
  const [supabase] = useState(() => createClient());
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
      const [ordersRes, ticketsRes, refundsRes, customersRes, reviewsRes, newsletterRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, order_id, created_at')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('support_tickets')
          .select('id, subject, created_at, user_id, status')
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
        supabase
          .from('newsletter_subscribers')
          .select('id, email, subscribed_at, source')
          .order('subscribed_at', { ascending: false })
          .limit(6),
      ]);

      const responseErrors = [
        ordersRes.error,
        ticketsRes.error,
        refundsRes.error,
        customersRes.error,
        reviewsRes.error,
        newsletterRes.error,
      ].filter(Boolean);

      if (responseErrors.length > 0 && process.env.NODE_ENV === 'development') {
        logger.warn('Admin notifications refresh encountered partial Supabase errors.', responseErrors);
      }

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
          const customerLabel = linkedCustomer?.email || linkedCustomer?.name || 'a customer';

          const statusBadge = ticket.status === 'open' ? 'NEW' : ticket.status.toUpperCase();

          return {
            id: `ticket-${ticket.id}`,
            type: 'ticket' as const,
            title: `Support: ${statusBadge}`,
            message: `${ticket.subject || 'Inquiry'} from ${customerLabel}.`,
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
        ...(newsletterRes.data ?? []).map((sub) => ({
          id: `sub-${sub.id}`,
          type: 'newsletter' as const,
          title: 'New Subscriber',
          message: `${sub.email} joined from ${sub.source || 'home'}.`,
          timestamp: new Date(sub.subscribed_at),
          link: '/admin/customers',
        })),
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
    const newsletterChannel = supabase
      .channel('admin-notifications-newsletter')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'newsletter_subscribers' }, () => void fetchNotifications())
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(refundsChannel);
      supabase.removeChannel(customersChannel);
      supabase.removeChannel(reviewsChannel);
      supabase.removeChannel(newsletterChannel);
    };
  }, [supabase]);

  const visibleNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (!clearedBefore) {
        return true;
      }

      // Ensure we compare timestamps correctly (seconds or ms)
      const noteTime = notification.timestamp.getTime();
      const clearTime = clearedBefore.getTime();
      
      return noteTime > clearTime;
    });
  }, [notifications, clearedBefore]);

  const unreadCount = useMemo(() => 
    visibleNotifications.filter((notification) => !readIds.includes(notification.id)).length,
    [visibleNotifications, readIds]
  );

  useEffect(() => {
    const syncWithUser = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (user?.user_metadata?.cleared_notifications_at) {
        const dbCutoff = new Date(user.user_metadata.cleared_notifications_at);
        if (!clearedBefore || dbCutoff > clearedBefore) {
          setClearedBefore(dbCutoff);
          persistState({
            readIds,
            clearedBefore: dbCutoff.toISOString(),
          });
        }
      }
    };
    void syncWithUser();
  }, [supabase, clearedBefore, readIds]);

  const markAllAsRead = () => {
    const nextReadIds = Array.from(new Set([...readIds, ...visibleNotifications.map((notification) => notification.id)]));
    setReadIds(nextReadIds);
    persistState({
      readIds: nextReadIds,
      clearedBefore: clearedBefore ? clearedBefore.toISOString() : null,
    });
  };

  const clearOldData = async () => {
    const cutoff = new Date();
    setClearedBefore(cutoff);
    
    const nextReadIds = Array.from(new Set([...readIds, ...visibleNotifications.map((notification) => notification.id)]));
    setReadIds(nextReadIds);
    
    persistState({
      readIds: nextReadIds,
      clearedBefore: cutoff.toISOString(),
    });

    // Permanent Save to User Metadata
    await supabase.auth.updateUser({
      data: { cleared_notifications_at: cutoff.toISOString() }
    });
  };

  const handleOpen = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen && unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative flex h-[42px] w-[42px] items-center justify-center rounded-none border border-zinc-200 bg-white transition-colors hover:bg-zinc-50"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-zinc-600" />
        {unreadCount > 0 && (
          <>
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-none border-2 border-white bg-rose-500" />
            <span className="absolute -top-1 -right-1 min-w-[18px] rounded-none bg-slate-900 px-1.5 py-0.5 text-[11px] font-bold text-white">
              {Math.min(unreadCount, 9)}
            </span>
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute right-[-0.75rem] sm:right-0 mt-4 z-[100] w-[calc(100vw-2rem)] sm:w-[420px] overflow-hidden rounded-none border border-white/40 bg-white/90 backdrop-blur-xl shadow-none-[0_24px_48px_-12px_rgba(0,0,0,0.12)]"
          >
            <div className="border-b border-slate-100 bg-white/50 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Activity Hub</p>
                  <h3 className="mt-1 text-base font-bold text-slate-900">Notifications</h3>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="flex h-8 w-8 items-center justify-center rounded-none bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-2 rounded-none bg-slate-900 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:bg-slate-800 hover:shadow-none active:scale-95"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all as read
                </button>
                <button
                  type="button"
                  onClick={clearOldData}
                  className="inline-flex items-center gap-2 rounded-none border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clean logs
                </button>
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto custom-scrollbar bg-transparent">
              {visibleNotifications.length > 0 ? (
                <div className="divide-y divide-slate-100/50">
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
                        className={`flex w-full gap-5 px-6 py-5 text-left transition-all duration-300 ${!isRead ? 'bg-slate-900/[0.02] border-l-2 border-slate-900' : 'bg-transparent hover:bg-slate-50'}`}
                      >
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-none border ${style.border} ${style.bg} transition-transform group-hover:scale-110`}>
                          <NotificationIcon className={`h-5 w-5 ${style.accent}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className={`text-[11px] font-bold uppercase tracking-widest ${!isRead ? 'text-slate-900' : 'text-slate-500'}`}>{notification.title}</p>
                              <p className={`mt-2 text-[13px] leading-relaxed ${!isRead ? 'text-slate-800 font-medium' : 'text-slate-500 font-normal'}`}>{notification.message}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                              </p>
                              {!isRead && <div className="mt-3 ml-auto h-1.5 w-1.5 rounded-none bg-slate-900 animate-pulse" />}
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

            <div className="border-t border-slate-100 bg-white/50 px-6 py-5">
              <button
                type="button"
                onClick={() => {
                  router.push('/admin/customers');
                  setIsOpen(false);
                }}
                className="group flex w-full items-center justify-between rounded-none bg-slate-50 p-4 transition-all hover:bg-slate-900 hover:text-white"
              >
                <span className="text-[11px] font-bold uppercase tracking-widest">Explore CRM activity</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

