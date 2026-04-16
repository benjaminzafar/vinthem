"use client";
import { useEffect, useRef } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import posthog from 'posthog-js';
import { useAuthStore } from '@/store/useAuthStore';

const supabase = createClient();

declare global {
  interface Window {
    clarity?: (...args: any[]) => void;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setIsAdmin, setIsAuthLoading } = useAuthStore();
  const initialized = useRef(false);

  const identifyUser = (user: any) => {
    if (user && typeof window !== 'undefined') {
      // 1. Identify in PostHog
      posthog.identify(user.id, {
        email: user.email,
        name: user.user_metadata?.full_name
      });

      // 2. Identify in Clarity
      if (window.clarity) {
        window.clarity("set", "user_id", user.id);
        window.clarity("set", "email", user.email);
      }
    } else if (typeof window !== 'undefined') {
      posthog.reset();
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initAuth = async () => {
      try {
        // Only load auth state, settings are handled by StoreHydrator
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.warn("Auth check returned error (normal if guest):", error.message);
        }

        const user = data?.user;
        
        if (user) {
          setUser(user);
          identifyUser(user);
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

          const isAdmin =
            profile?.role === 'admin';
          setIsAdmin(isAdmin);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
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
            .single();

          const isAdmin =
            data?.role === 'admin';
          setIsAdmin(isAdmin);
        } else {
          setIsAdmin(false);
        }
        setIsAuthLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setIsAdmin, setIsAuthLoading, supabase]);

  return <>{children}</>;
}
