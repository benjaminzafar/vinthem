import { LocalizedString, StorefrontSettings } from '@/store/useSettingsStore';

export type StorefrontSettingsType = StorefrontSettings;
export { type LocalizedString };

export interface Category {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  translations?: {
    [lang: string]: {
      name: string;
      description?: string;
    };
  };
  isFeatured: boolean;
  showInHero?: boolean;
  parentId?: string;
  imageUrl?: string;
  iconUrl?: string;
}

export interface BlogPost {
  id?: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  content: LocalizedString;
  imageUrl: string;
  author: string;
  createdAt: string;
}

export interface StaticPage {
  id?: string;
  title: LocalizedString;
  slug: string;
  content: LocalizedString;
  updatedAt: string;
}

export interface Review {
  id?: string;
  productId?: string;
  product_id?: string;
  userId?: string;
  user_id?: string;
  userName?: string;
  user_name?: string;
  rating: number;
  comment: string;
  createdAt?: string;
  created_at: string;
  adminReply?: string;
  admin_reply?: string;
  adminReplyAt?: string;
  admin_reply_at?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  sale_price?: number;
  is_sale: boolean;
  image_url?: string;
  images?: string[];
  category_id?: string;
  inventory?: number;
  sku?: string;
  created_at: string;
}

export interface OrderItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
}

export interface ShippingDetails {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  country?: string;
  zip?: string;
  phone?: string;
}

export interface AdminOrder {
  id: string;
  orderId?: string; // friendly id
  order_id?: string; // mapped from db
  user_id: string | null;
  items: OrderItem[];
  total: number;
  subtotal?: number;
  currency?: string;
  customer_email?: string | null;
  shipping_cost?: number;
  tax_amount?: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shipping_details?: ShippingDetails;
  created_at: string;
  createdAt?: string; // mapped for UI
  customerEmail?: string | null; // mapped for UI
  trackingCarrier?: string | null;
  trackingNumber?: string | null;
}

export interface User {
  id: string;
  email: string | null;
  name?: string;
  role: 'admin' | 'client' | null;
  created_at?: string;
}

export interface SupportTicket {
  id: string;
  customer_email: string;
  subject: string;
  description?: string;
  message?: string;
  status: 'open' | 'closed' | 'archived' | 'resolved' | 'in-progress';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  image_url?: string;
  messages?: Array<{
    role: 'user' | 'admin';
    content: string;
    timestamp: string;
  }>;
  locale?: string;
  created_at: string;
  updated_at?: string;
}

export interface RefundRequest {
  id: string;
  user_id: string;
  order_id: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Refunded';
  reason: string;
  locale?: string;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status?: 'subscribed' | 'unsubscribed' | 'registered';
  source?: string;
  subscribed_at: string;
  created_at?: string;
}

export interface NewsletterCampaign {
  id: string;
  subject: string;
  content: string;
  sent_at: string;
  recipient_count: number;
}

export interface CRMUser extends User {
  full_name?: string | null;
  display_name?: string | null;
  last_sign_in_at?: string | null;
  is_authenticated?: boolean;
  preferred_lang?: string;
}

export interface CRMData {
  users: CRMUser[];
  tickets: SupportTicket[];
  refunds: RefundRequest[];
  orders: AdminOrder[];
  reviews: Review[];
  subscribers: NewsletterSubscriber[];
  campaigns: NewsletterCampaign[];
}
