"use client";
import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setIsAdmin, setIsAuthLoading } = useAuthStore();
  const { setSettings, setSettingsLoaded } = useSettingsStore();

  useEffect(() => {
    const supabase = createClient();

    const initAuth = async () => {
      // Load Settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('data')
        .eq('id', 'storefront')
        .single();
      
      if (settingsData?.data) {
        setSettings(settingsData.data);
      }
      setSettingsLoaded(true);

      // Load Auth
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        const isAdmin =
          data?.role === 'admin' ||
          user.email === 'benjaminzafar10@gmail.com';
        setIsAdmin(isAdmin);
      } else {
        setIsAdmin(false);
      }
      setIsAuthLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user ?? null;
        setUser(user);

        if (user) {
          const { data } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

          const isAdmin =
            data?.role === 'admin' ||
            user.email === 'benjaminzafar10@gmail.com';
          setIsAdmin(isAdmin);
        } else {
          setIsAdmin(false);
        }
        setIsAuthLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setIsAdmin, setIsAuthLoading]);

  return <>{children}</>;
}
