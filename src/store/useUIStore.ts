"use client";

import { create } from 'zustand';

interface UIStore {
  isMobileMenuOpen: boolean;
  isFilterDrawerOpen: boolean;
  isSearchFocused: boolean;
  isCartOpen: boolean;
  searchQuery: string;
  setMobileMenuOpen: (open: boolean) => void;
  setIsFilterDrawerOpen: (open: boolean) => void;
  setSearchFocused: (focused: boolean) => void;
  setCartOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  closeAll: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isMobileMenuOpen: false,
  isFilterDrawerOpen: false,
  isSearchFocused: false,
  isCartOpen: false,
  searchQuery: '',
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  setIsFilterDrawerOpen: (open) => set({ isFilterDrawerOpen: open }),
  setSearchFocused: (focused) => set({ isSearchFocused: focused }),
  setCartOpen: (open) => set({ isCartOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  closeAll: () => set({ isMobileMenuOpen: false, isFilterDrawerOpen: false, isSearchFocused: false, isCartOpen: false }),
}));
