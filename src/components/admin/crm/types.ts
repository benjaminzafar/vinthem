"use client";

export type CRMOrderItem = {
  id?: string;
  image?: string | null;
  name?: string | null;
  title?: string | null;
  price?: number | null;
  quantity?: number | null;
};

export type CRMOrder = {
  id: string;
  orderId?: string | null;
  customerEmail?: string | null;
  createdAt?: string | null;
  status?: string | null;
  total?: number | null;
  currency?: string | null;
  userId?: string | null;
  items?: CRMOrderItem[];
};

export type CRMCustomer = {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  createdAt?: string | null;
  orderCount: number;
  ticketCount: number;
  refundCount: number;
  reviewCount: number;
  totalSpent: number;
  lastActiveAt?: string | null;
  preferred_lang?: string;
};

export type SupportMessage = {
  sender: 'admin' | 'customer';
  text: string;
  imageUrl?: string;
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  userId?: string | null;
  orderId?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  subject?: string | null;
  description?: string | null;
  status: 'open' | 'in-progress' | 'resolved' | 'Approved' | 'WaitingItem' | 'Received' | 'Exchanged' | 'Refunded';
  priority?: string | null;
  messages?: SupportMessage[];
  imageUrl?: string | null;
  locale?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type RefundRecord = {
  id: string;
  userId?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  orderId?: string | null;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Refunded';
  reason?: string | null;
  locale?: string;
  createdAt?: string | null;
};

export type ReviewRecord = {
  id: string;
  productId?: string | null;
  userId?: string | null;
  userName?: string | null;
  customerEmail?: string | null;
  rating?: number | null;
  comment?: string | null;
  createdAt?: string | null;
  adminReply?: string | null;
  adminReplyAt?: string | null;
};
