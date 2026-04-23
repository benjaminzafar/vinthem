"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { Lock, Loader2 } from 'lucide-react';
import type { StorefrontSettings } from '@/store/useSettingsStore';
import { useStorefrontSettings } from '@/hooks/useStorefrontSettings';
import { getClientLocale } from '@/lib/locale';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

interface ResetPasswordClientProps {
  initialSettings: Partial<StorefrontSettings>;
}

export function ResetPasswordClient({ initialSettings }: ResetPasswordClientProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const settings = useStorefrontSettings(initialSettings);
  const lang = getClientLocale(pathname);

  // Security check on mount
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Redirecting to login...');
        window.location.href = `/${lang}/auth`;
      }
    };
    checkSession();
  }, [lang]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      // 1. Update the password
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success(settings.passwordResetSuccessText?.[lang] || 'Password updated! Redirecting...');

      // 2. FORCE a hard redirect to clear all states and ensure session is picked up
      setTimeout(() => {
        window.location.href = `/${lang}/profile`;
      }, 500);

    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
      setLoading(false);
    } 
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 sm:p-12 bg-white overflow-hidden">
      {settings.authBackgroundImage && (
        <div className="absolute inset-0 z-0">
          <Image src={settings.authBackgroundImage} alt="BG" fill className="object-cover opacity-100" priority />
        </div>
      )}

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white p-10 border border-zinc-100 shadow-2xl rounded">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 uppercase">
              {settings.resetPasswordTitle?.[lang] || 'New Password'}
            </h2>
          </div>

          <form className="space-y-6" onSubmit={handleResetPassword}>
            <input
              type="password"
              required
              className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900 rounded text-sm transition-all"
              placeholder={settings.newPasswordLabel?.[lang]}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <input
              type="password"
              required
              className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900 rounded-none text-sm transition-all"
              placeholder={settings.confirmNewPasswordLabel?.[lang]}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-zinc-900 text-white text-xs font-black uppercase tracking-[0.2em] transition-all hover:bg-black disabled:opacity-50 rounded"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{settings.processingText?.[lang] || 'Processing...'}</span>
                </div>
              ) : (
                settings.resetPasswordButtonText?.[lang] || 'Update Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
