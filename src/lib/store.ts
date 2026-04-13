"use client";
import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

interface AppState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  // User session
  user: User | null; 
  setUser: (user: User | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  user: null,
  setUser: (user) => set({ user }),
}));
