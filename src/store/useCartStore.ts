"use client";
import { create } from 'zustand';
import { resolveMarket } from '@/lib/markets';

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

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (product) => set((state) => {
    const existing = state.items.find(i => i.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) return state; // Don't add more than stock
      return { items: state.items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) };
    }
    if (product.stock <= 0) return state; // Don't add if out of stock
    return { items: [...state.items, { ...product, quantity: 1 }] };
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
  total: (lang = 'sv') => {
    const market = resolveMarket(lang);
    return get().items.reduce((sum, item) => {
      let price = item.price || 0;
      const localizedPrice = item.prices?.[market.currency];
      if (typeof localizedPrice === 'number') {
        price = localizedPrice;
      }
      return sum + price * item.quantity;
    }, 0);
  }
}));
