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
        let errorMessage = error.message || 'Auth failed';
        if (errorMessage.toLowerCase().includes('invalid login credentials')) {
          errorMessage = settings.invalidLoginErrorText?.[lang] || 'Invalid email or password.';
        }
        toast.error(errorMessage);
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

  const handleGoogleLogin = async () => {
    if (!settings.googleAuthEnabled) {
      toast.error(settings.googleLoginUnavailableText?.[lang] || 'Google login disabled.');
      return;
    }
    
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: `${window.location.origin}/auth/callback` 
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Google login failed');
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
      {settings.authBackgroundImage && settings.authBackgroundImage.length > 5 && settings.authBackgroundImage.startsWith('h') && (
        <div className="absolute inset-0 z-0">
          <Image 
            src={settings.authBackgroundImage} 
            alt="Premium Scandinavian Interior Design Background" 
            fill 
            className="object-cover opacity-100" 
            priority 
          />
        </div>
      )}

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white p-10 border border-slate-200 rounded !shadow-none">
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
                className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900 rounded text-sm transition-all"
                placeholder={settings.fullNameLabelText?.[lang]}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            
            <input
              type="email"
              required
              className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900 rounded text-sm transition-all"
              placeholder={settings.emailLabel?.[lang]}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {!isForgotPassword && (
              <input
                type="password"
                required
                className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900 rounded text-sm transition-all"
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
              className="w-full h-11 bg-zinc-900 text-white text-[14px] font-semibold uppercase tracking-wider transition-all hover:bg-black disabled:opacity-50 rounded-none flex items-center justify-center border-none shadow-none"
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
              <div className="mt-8 space-y-3 bg-zinc-50/50 p-4 border border-slate-200 rounded">
                <label className="flex items-start gap-4 text-[11px] text-zinc-900 cursor-pointer uppercase font-black tracking-tight leading-tight group">
                  <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 rounded-sm h-4 w-4 border-slate-300 text-zinc-900 focus:ring-zinc-900" required />
                  <span>
                    Accept <Link href={`/${lang}/terms-of-service`} target="_blank" className="underline hover:text-zinc-600 transition-colors">Terms of Service</Link>
                  </span>
                </label>
                <label className="flex items-start gap-4 text-[11px] text-zinc-900 cursor-pointer uppercase font-black tracking-tight leading-tight group">
                  <input type="checkbox" checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)} className="mt-1 rounded-sm h-4 w-4 border-slate-300 text-zinc-900 focus:ring-zinc-900" required />
                  <span>
                    Accept <Link href={`/${lang}/privacy-policy`} target="_blank" className="underline hover:text-zinc-600 transition-colors">Privacy Policy</Link>
                  </span>
                </label>
                <label className="flex items-start gap-4 text-[11px] text-zinc-900 cursor-pointer uppercase font-black tracking-tight leading-tight group">
                  <input type="checkbox" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} className="mt-1 rounded-sm h-4 w-4 border-slate-300 text-zinc-900 focus:ring-zinc-900" />
                  <span className="opacity-80 font-bold">{settings.signUpMarketingConsentText?.[lang] || 'Subscribe to Newsletter'}</span>
                </label>
              </div>
            )}
          </form>

          {!isForgotPassword && (
            <div className="mt-6 space-y-4">
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-zinc-100"></div>
                <span className="flex-shrink mx-4 text-[9px] font-black uppercase tracking-widest text-zinc-900 pointer-events-none select-none">OR Secure Access</span>
                <div className="flex-grow border-t border-zinc-100"></div>
              </div>
              
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={!settings.googleAuthEnabled}
                className="w-full group flex items-center justify-center gap-3 h-11 border border-slate-200 rounded-none text-[14px] font-semibold uppercase tracking-wider text-zinc-950 bg-white hover:bg-zinc-50 transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale shadow-none"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>{settings.continueWithGoogleText?.[lang] || 'Continue with Google'}</span>
              </button>
            </div>
          )}

          <div className="mt-10 text-center border-t border-zinc-100 pt-8">
            <button
              type="button"
              onClick={() => {
                if (isForgotPassword) setIsForgotPassword(false);
                else setIsLogin(!isLogin);
              }}
              className="text-[10px] font-black uppercase tracking-widest text-zinc-951 underline underline-offset-8 decoration-zinc-200 hover:decoration-zinc-900 transition-all"
            >
              {isForgotPassword ? 'Back to Login' : (isLogin ? settings.dontHaveAccountText?.[lang] : settings.alreadyHaveAccountText?.[lang])}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
