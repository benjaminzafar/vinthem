"use client";
import { logger } from '@/lib/logger';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { hasAnalyticsConsent } from '@/lib/consent';

declare global {
  interface Window {
    clarity?: (...args: Array<string>) => void;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setIsAdmin, setIsAuthLoading } = useAuthStore();
  const initialized = useRef(false);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  const identifyUser = (user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null) => {
    if (user && typeof window !== 'undefined' && hasAnalyticsConsent()) {
      if (window.clarity) {
        window.clarity("set", "user_id", user.id);
        window.clarity("set", "email", user.email || "");
      }
    }
  };

  useEffect(() => {
    // Initialize supabase only on client side
    const client = createClient();
    setSupabase(client);
  }, []);

  useEffect(() => {
    if (!supabase || initialized.current) return;
    initialized.current = true;

    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          logger.warn("Auth check returned error (normal if guest):", error.message);
        }

        const user = data?.user;
        
        if (user) {
          setUser(user);
          identifyUser(user);
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

          const isAdmin = profile?.role === 'admin';
          setIsAdmin(isAdmin);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        logger.error("Auth initialization failed:", error);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        const user = session?.user ?? null;
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          identifyUser(null);
          setIsAdmin(false);
          setIsAuthLoading(false);
          return;
        }

        setUser(user);
        identifyUser(user);

        if (user) {
          const { data } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

          const isAdmin = data?.role === 'admin';
          setIsAdmin(isAdmin);
        } else {
          setIsAdmin(false);
        }
        setIsAuthLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, setUser, setIsAdmin, setIsAuthLoading]);

  return <>{children}</>;
}
