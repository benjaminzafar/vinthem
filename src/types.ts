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
  pinnedInSearch?: boolean;
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
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  adminReply?: string;
  adminReplyAt?: string;
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
  user_id: string | null;
  items: OrderItem[];
  total: number;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shipping_details: ShippingDetails;
  created_at: string;
  createdAt?: string; // mapped for UI
  customerEmail?: string; // mapped for UI
  trackingCarrier?: string;
  trackingNumber?: string;
}

export interface User {
  id: string;
  email: string | null;
  name?: string;
  role: 'admin' | 'client' | null;
  created_at?: string;
}
