"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProductOption {
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  options?: Record<string, string>;
  price?: number;
  stock: number;
  sku?: string;
  imageUrl?: string;
  image_url?: string;
  image?: string;
  url?: string;
  color?: string;
  size?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId?: string;
  categoryName?: string;
  parentCategoryId?: string;
  stock: number;
  sku?: string;
  specifications?: { name: string; value: string }[];
  features?: string[];
  tags?: string[];
  additionalImages?: string[];
  additional_images?: string[];
  galleryImages?: string[];
  gallery_images?: string[];
  images?: string[];
  sizes?: string[];
  colors?: string[];
  options?: ProductOption[];
  variants?: ProductVariant[];
  rating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  isSale?: boolean;
  discountPrice?: number;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isComingSoon?: boolean;
  starred?: boolean;
  status?: 'draft' | 'published';
  createdAt?: string;
  weight?: number;
  shippingClass?: string;
  prices?: Record<string, number>;
  stripeTaxCode?: string;
  translations?: {
    [lang: string]: {
      title: string;
      description: string;
      features?: string[];
      specifications?: { name: string; value: string }[];
      options?: ProductOption[];
    };
  };
}

interface CartItem extends Product {
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: (lang?: string) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
  items: [],
  addItem: (product) => set((state) => {
    const requestedQuantity = (product as any).quantity || 1;
    const existing = state.items.find(i => i.id === product.id);
    if (existing) {
      const newQuantity = Math.min(existing.quantity + requestedQuantity, product.stock);
      if (existing.quantity >= product.stock) return state;
      return { items: state.items.map(i => i.id === product.id ? { ...i, quantity: newQuantity } : i) };
    }
    if (product.stock <= 0) return state;
    return { items: [...state.items, { ...product, quantity: Math.min(requestedQuantity, product.stock) }] };
  }),
  removeItem: (productId) => set((state) => ({
    items: state.items.filter(i => i.id !== productId)
  })),
  updateQuantity: (productId, quantity) => set((state) => ({
    items: state.items.map(i => {
      if (i.id === productId) {
        const newQuantity = Math.min(Math.max(1, quantity), i.stock);
        return { ...i, quantity: newQuantity };
      }
      return i;
    })
  })),
  clearCart: () => set({ items: [] }),
  total: () => get().items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
    }),
    {
      name: 'mavren-shop-cart',
    }
  )
);
