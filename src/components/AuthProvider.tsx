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
      try {
        // Load Settings - Updated to use 'primary' to match schema.sql
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('data')
          .eq('id', 'primary')
          .single();
        
        if (settingsError && settingsError.code !== 'PGRST116') {
          console.error("Error loading settings:", settingsError);
        }

        if (settingsData?.data) {
          setSettings(settingsData.data);
        }
        setSettingsLoaded(true);

        // Load Auth
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          try {
            const { data, error } = await supabase
              .from('users')
              .select('role')
              .eq('id', user.id)
              .single();

            if (error && error.code !== 'PGRST116') {
              console.error("Error loading user role:", error);
            }

            const isAdmin =
              data?.role === 'admin' ||
              user.email === 'benjaminzafar10@gmail.com' ||
              user.email === 'benjaminzafar7@gmail.com'; // Added other confirmed email
            setIsAdmin(isAdmin);
          } catch (error) {
            console.error("Failed to fetch user profile:", error);
            setIsAdmin(false);
          }
        } else {
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
      async (_event, session) => {
        const user = session?.user ?? null;
        setUser(user);

        if (user) {
          try {
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
          } catch (error) {
            console.error("Error updating user role on state change:", error);
            setIsAdmin(false);
          }
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
