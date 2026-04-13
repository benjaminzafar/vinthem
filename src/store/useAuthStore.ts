"use client";
import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

interface AuthStore {
  user: User | null;
  isAdmin: boolean;
  isAuthLoading: boolean;
  setUser: (user: User | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setIsAuthLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAdmin: false,
  isAuthLoading: true,
  setUser: (user) => set({ user }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  setIsAuthLoading: (isAuthLoading) => set({ isAuthLoading }),
}));
