"use client";
import { useEffect, useRef } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';

const supabase = createClient();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setIsAdmin, setIsAuthLoading } = useAuthStore();
  const initialized = useRef(false);

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
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

          const isAdmin =
            profile?.role === 'admin' ||
            user.email === 'benjaminzafar10@gmail.com' ||
            user.email === 'benjaminzafar7@gmail.com';
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
          setIsAdmin(false);
          setIsAuthLoading(false);
          return;
        }

        setUser(user);

        if (user) {
          const { data } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

          const isAdmin =
            data?.role === 'admin' ||
            user.email === 'benjaminzafar10@gmail.com' ||
            user.email === 'benjaminzafar7@gmail.com';
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
