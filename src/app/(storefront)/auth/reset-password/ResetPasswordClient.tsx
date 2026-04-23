"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
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
  const navigate = useRouter();
  const pathname = usePathname();
  const settings = useStorefrontSettings(initialSettings);
  const lang = getClientLocale(pathname);

  // Security: If accessed directly without a recovery session, redirect to login
  React.useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired or invalid link. Please request a new reset link.');
        navigate.push(`/${lang}/auth`);
      }
    };
    checkSession();
  }, [lang, navigate]);

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
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast.success(settings.passwordResetSuccessText?.[lang] || 'Password updated successfully');
      
      // Redirect directly to home or profile since password update already authenticates the session
      navigate.push(`/${lang}/profile`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
      setLoading(false);
    } 
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-white">
      {/* Dynamic Background Image */}
      {settings.authBackgroundImage && (
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <Image 
            src={settings.authBackgroundImage} 
            alt="Background" 
            fill 
            priority
            className="object-cover object-center scale-100" 
            sizes="100vw"
          />
        </div>
      )}

      <div className="relative z-10 max-w-md w-full">
        <div className="bg-white/90 backdrop-blur-md p-10 rounded-2xl border border-zinc-100 shadow-2xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-sans font-bold tracking-tight text-zinc-900">
              {settings.resetPasswordTitle?.[lang]}
            </h2>
            <p className="mt-3 text-sm text-zinc-600 font-medium leading-relaxed">
              Set a secure new password for your account.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleResetPassword}>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 transition-colors group-focus-within:text-zinc-900" />
              <input
                type="password"
                required
                className="appearance-none rounded-xl relative block w-full pl-11 pr-4 py-4 bg-zinc-50/80 border border-zinc-200 placeholder-zinc-500 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all sm:text-sm font-medium"
                placeholder={settings.newPasswordLabel?.[lang]}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 transition-colors group-focus-within:text-zinc-900" />
              <input
                type="password"
                required
                className="appearance-none rounded-xl relative block w-full pl-11 pr-4 py-4 bg-zinc-50/80 border border-zinc-200 placeholder-zinc-500 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all sm:text-sm font-medium"
                placeholder={settings.confirmNewPasswordLabel?.[lang]}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex items-center justify-center py-4 px-6 bg-zinc-900 text-white text-[13px] font-bold rounded-2xl transition-all hover:bg-black hover:shadow-xl hover:shadow-zinc-200/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {settings.processingText?.[lang] || 'Processing...'}
                  </div>
                ) : (
                  settings.resetPasswordButtonText?.[lang]
                )}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
