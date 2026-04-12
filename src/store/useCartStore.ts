"use client";
import { create } from 'zustand';

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
  category: string;
  categoryId?: string;
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
  createdAt?: any;
  weight?: number;
  shippingClass?: string;
  prices?: Record<string, number>;
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
    return get().items.reduce((sum, item) => {
      let price = item.price || 0;
      if (lang === 'en' && item.prices?.USD) price = item.prices.USD;
      else if (lang === 'fi' && item.prices?.EUR) price = item.prices.EUR;
      else if (lang === 'da' && item.prices?.DKK) price = item.prices.DKK;
      return sum + price * item.quantity;
    }, 0);
  }
}));
