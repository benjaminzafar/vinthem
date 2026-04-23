"use client";
import React, { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import type { StorefrontSettings } from '@/store/useSettingsStore';
import Link from 'next/link';
import { checkEmailExistsAction, recordSignupConsentAction, syncCurrentUserProfileAction } from '@/app/actions/auth';
import { getClientLocale } from '@/lib/locale';
import { useStorefrontSettings } from '@/hooks/useStorefrontSettings';
import Image from 'next/image';
import { OTPVerification } from '@/components/auth/OTPVerification';

interface AuthClientProps {
  initialSettings: Partial<StorefrontSettings>;
}

export function AuthClient({ initialSettings }: AuthClientProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [otpType, setOtpType] = useState<'signup' | 'magiclink' | 'recovery'>('signup');
  
  const searchParams = useSearchParams();
  const { setUser, setIsAdmin } = useAuthStore();
  const settings = useStorefrontSettings(initialSettings);
  const pathname = usePathname();
  const lang = getClientLocale(pathname);
  const redirectTarget = searchParams.get('redirect') || searchParams.get('next') || '/';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const supabase = createClient();

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (!acceptedTerms || !acceptedPrivacy) {
          throw new Error('Please accept the Terms and Privacy Policy.');
        }

        const checkResult = await checkEmailExistsAction(email);
        if (checkResult.exists) {
          throw new Error(settings.userAlreadyExistsErrorText?.[lang] || 'Account already exists.');
        }

        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });
        if (error) throw error;

        if (!data.session) {
          setShowOTP(true);
          setOtpType('signup');
          setLoading(false);
          return;
        }

        if (data.user) {
          await syncCurrentUserProfileAction(name);
          await recordSignupConsentAction({ fullName: name, acceptedTerms, acceptedPrivacy, marketingOptIn });
        }
      }

      // Success Redirect
      toast.success(isLogin ? settings.loginSuccessText?.[lang] : settings.accountCreatedSuccessText?.[lang]);
      window.location.href = redirectTarget.startsWith('/') ? `/${lang}${redirectTarget === '/' ? '' : redirectTarget}` : redirectTarget;
      
    } catch (error: any) {
      if (error.message?.toLowerCase().includes('email not confirmed')) {
        setShowOTP(true);
        setOtpType('signup');
      } else {
        toast.error(error.message || 'Auth failed');
      }
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success(settings.resetPasswordSentSuccessText?.[lang] || 'Code sent!');
      setOtpType('recovery');
      setShowOTP(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (showOTP) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-sm">
          <OTPVerification 
            email={email}
            type={otpType}
            lang={lang}
            onSuccess={() => {
              window.location.href = otpType === 'recovery' ? `/${lang}/auth/reset-password` : `/${lang}${redirectTarget}`;
            }}
            labels={{
              title: settings.otpTitle?.[lang],
              subtitle: settings.otpSubtitle?.[lang],
              verifyButton: settings.otpVerifyButton?.[lang],
              errorInvalid: settings.invalidOtpErrorText?.[lang]
            }}
          />
          <button onClick={() => setShowOTP(false)} className="w-full mt-8 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 border-b border-zinc-100 pb-1 self-center">
            Back to Entry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-white overflow-hidden">
      {settings.authBackgroundImage && (
        <div className="absolute inset-0 z-0">
          <Image src={settings.authBackgroundImage} alt="BG" fill className="object-cover opacity-100" priority />
        </div>
      )}

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white p-10 border border-zinc-100 shadow-2xl rounded-none">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase">
              {isForgotPassword ? 'Reset' : (isLogin ? settings.signInTitle?.[lang] : settings.signUpTitle?.[lang])}
            </h2>
          </div>

          <form className="space-y-4" onSubmit={isForgotPassword ? handleForgotPassword : handleAuth}>
            {!isLogin && !isForgotPassword && (
              <input
                type="text"
                required
                className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900 rounded-none text-sm transition-all"
                placeholder={settings.fullNameLabelText?.[lang]}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            
            <input
              type="email"
              required
              className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900 rounded-none text-sm transition-all"
              placeholder={settings.emailLabel?.[lang]}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {!isForgotPassword && (
              <input
                type="password"
                required
                className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900 rounded-none text-sm transition-all"
                placeholder={settings.passwordLabel?.[lang]}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}

            {isLogin && !isForgotPassword && (
              <div className="text-right">
                <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 uppercase tracking-wider">
                  {settings.forgotPasswordText?.[lang]}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-zinc-900 text-white text-[11px] font-black uppercase tracking-[0.25em] transition-all hover:bg-black disabled:opacity-50 rounded-none"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                isForgotPassword ? settings.sendResetLinkButtonText?.[lang] : (isLogin ? settings.signInButtonText?.[lang] : settings.signUpButtonText?.[lang])
              )}
            </button>

            {!isLogin && !isForgotPassword && (
              <div className="mt-8 space-y-3 bg-zinc-50/50 p-4 border border-zinc-100">
                <label className="flex items-start gap-3 text-[10px] text-zinc-500 cursor-pointer uppercase font-bold tracking-tight">
                  <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5" required />
                  <span>Accept Terms</span>
                </label>
                <label className="flex items-start gap-3 text-[10px] text-zinc-500 cursor-pointer uppercase font-bold tracking-tight">
                  <input type="checkbox" checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)} className="mt-0.5" required />
                  <span>Accept Privacy</span>
                </label>
              </div>
            )}
          </form>

          <div className="mt-10 text-center border-t border-zinc-100 pt-8">
            <button
              type="button"
              onClick={() => {
                if (isForgotPassword) setIsForgotPassword(false);
                else setIsLogin(!isLogin);
              }}
              className="text-[10px] font-black uppercase tracking-widest text-zinc-950 underline underline-offset-8 decoration-zinc-200 hover:decoration-zinc-900 transition-all"
            >
              {isForgotPassword ? 'Back to Login' : (isLogin ? settings.dontHaveAccountText?.[lang] : settings.alreadyHaveAccountText?.[lang])}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
