"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { StorefrontSettings } from '@/store/useSettingsStore';
import Link from 'next/link';
import { checkEmailExistsAction, recordSignupConsentAction, syncCurrentUserProfileAction } from '@/app/actions/auth';
import { getClientLocale } from '@/lib/locale';
import { useStorefrontSettings } from '@/hooks/useStorefrontSettings';
import Image from 'next/image';
import { OTPVerification } from '@/components/auth/OTPVerification';
import { extractLanguageFromPathname, localizeHref } from '@/lib/i18n-routing';
import type { SupabaseClient } from '@supabase/supabase-js';

interface AuthClientProps {
  initialSettings: Partial<StorefrontSettings>;
  supabaseConfig: {
    url: string;
    anonKey: string;
  };
}

type RuntimeSupabaseConfigResponse = {
  url?: string;
  anonKey?: string;
};

export function AuthClient({ initialSettings, supabaseConfig }: AuthClientProps) {
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
  const settings = useStorefrontSettings(initialSettings);
  const pathname = usePathname();
  const lang = getClientLocale(pathname);
  const redirectTarget = searchParams.get('redirect') || searchParams.get('next') || '/';
  const [authClientConfig, setAuthClientConfig] = useState(supabaseConfig);
  const isSupabaseConfigReady = Boolean(authClientConfig.url && authClientConfig.anonKey);
  const supabase = useMemo<SupabaseClient | null>(() => {
    if (!isSupabaseConfigReady) {
      return null;
    }

    return createClient(authClientConfig.url, authClientConfig.anonKey);
  }, [authClientConfig.anonKey, authClientConfig.url, isSupabaseConfigReady]);

  const resolveRuntimeSupabaseConfig = async (): Promise<RuntimeSupabaseConfigResponse | null> => {
    const g = globalThis as typeof globalThis & {
      __supabase_url?: string;
      __supabase_key?: string;
    };

    if (g.__supabase_url && g.__supabase_key) {
      return {
        url: g.__supabase_url,
        anonKey: g.__supabase_key,
      };
    }

    try {
      const response = await fetch('/api/supabase-config', {
        cache: 'no-store',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        return null;
      }

      const config = await response.json() as { success: boolean; url?: string; anonKey?: string };
      if (config.success && config.url && config.anonKey) {
        const result = { url: config.url, anonKey: config.anonKey };
        setAuthClientConfig(result);
        return result;
      }
    } catch {
      return null;
    }

    return null;
  };

  const ensureSupabaseClient = async (): Promise<SupabaseClient | null> => {
    if (supabase) {
      return supabase;
    }

    const runtimeConfig = await resolveRuntimeSupabaseConfig();
    if (!runtimeConfig?.url || !runtimeConfig.anonKey) {
      return null;
    }

    return createClient(runtimeConfig.url, runtimeConfig.anonKey);
  };

  useEffect(() => {
    if (supabaseConfig.url && supabaseConfig.anonKey) {
      setAuthClientConfig(supabaseConfig);
    }
  }, [supabaseConfig]);

  useEffect(() => {
    if (authClientConfig.url && authClientConfig.anonKey) {
      return;
    }

    let cancelled = false;

    const syncClientConfig = async () => {
      const g = globalThis as typeof globalThis & {
        __supabase_url?: string;
        __supabase_key?: string;
      };

      if (g.__supabase_url && g.__supabase_key) {
        if (!cancelled) {
          setAuthClientConfig({ url: g.__supabase_url, anonKey: g.__supabase_key });
        }
        return;
      }

      try {
        const response = await fetch('/api/supabase-config', {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        if (!response.ok) {
          return;
        }

        const config = await response.json() as { success: boolean; url?: string; anonKey?: string };
        if (!cancelled && config.success && config.url && config.anonKey) {
          setAuthClientConfig({ url: config.url, anonKey: config.anonKey });
        }
      } catch {
        // The form will remain disabled and surface the config issue instead of using a broken auth client.
      }
    };

    const handleSupabaseConfigReady = () => {
      const g = globalThis as typeof globalThis & {
        __supabase_url?: string;
        __supabase_key?: string;
      };
      if (g.__supabase_url && g.__supabase_key) {
        setAuthClientConfig({ url: g.__supabase_url, anonKey: g.__supabase_key });
      }
    };

    window.addEventListener('supabase-config-ready', handleSupabaseConfigReady);
    void syncClientConfig();

    return () => {
      cancelled = true;
      window.removeEventListener('supabase-config-ready', handleSupabaseConfigReady);
    };
  }, [authClientConfig.anonKey, authClientConfig.url]);

  const resolvePostAuthRedirect = (target: string) => {
    if (!target) {
      return localizeHref(lang, '/');
    }

    if (/^https?:\/\//i.test(target)) {
      return target;
    }

    const normalizedTarget = target.startsWith('/') ? target : `/${target}`;
    const targetLocale = extractLanguageFromPathname(normalizedTarget);

    if (targetLocale) {
      return normalizedTarget;
    }

    return localizeHref(lang, normalizedTarget);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const authClient = await ensureSupabaseClient();
      if (!authClient) {
        throw new Error('Authentication is still loading. Please try again in a moment.');
      }

      if (isLogin) {
        const { data, error } = await authClient.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (!data.session) {
          throw new Error('Login did not create a valid session. Please try again.');
        }

        await authClient.auth.getUser();
      } else {
        if (!acceptedTerms || !acceptedPrivacy) {
          throw new Error('Please accept the Terms and Privacy Policy.');
        }

        const checkResult = await checkEmailExistsAction(email);
        if (checkResult.exists) {
          throw new Error(settings.userAlreadyExistsErrorText?.[lang] || 'Account already exists.');
        }

        const { data, error } = await authClient.auth.signUp({ 
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
      window.location.assign(resolvePostAuthRedirect(redirectTarget));
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Auth failed';
      if (errorMessage.toLowerCase().includes('email not confirmed')) {
        setShowOTP(true);
        setOtpType('signup');
      } else {
        let localizedErrorMessage = errorMessage;
        if (localizedErrorMessage.toLowerCase().includes('invalid login credentials')) {
          localizedErrorMessage = settings.invalidLoginErrorText?.[lang] || 'Invalid email or password.';
        }
        toast.error(localizedErrorMessage);
      }
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const authClient = await ensureSupabaseClient();
      if (!authClient) {
        throw new Error('Authentication is still loading. Please try again in a moment.');
      }

      const { error } = await authClient.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success(settings.resetPasswordSentSuccessText?.[lang] || 'Code sent!');
      setOtpType('recovery');
      setShowOTP(true);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!settings.googleAuthEnabled) {
      toast.error(settings.googleLoginUnavailableText?.[lang] || 'Google login disabled.');
      return;
    }
    
    try {
      const authClient = await ensureSupabaseClient();
      if (!authClient) {
        throw new Error('Authentication is still loading. Please try again in a moment.');
      }

      const { error } = await authClient.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: `${window.location.origin}/auth/callback` 
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Google login failed');
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
              window.location.assign(
                otpType === 'recovery'
                  ? localizeHref(lang, '/auth/reset-password')
                  : resolvePostAuthRedirect(redirectTarget)
              );
            }}
            labels={{
              title: settings.otpTitle?.[lang],
              subtitle: settings.otpSubtitle?.[lang],
              verifyButton: settings.otpVerifyButton?.[lang],
              errorInvalid: settings.invalidOtpErrorText?.[lang]
            }}
          />
          <button onClick={() => setShowOTP(false)} className="w-full mt-8 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 border-b border-zinc-100 pb-1 self-center">
            Back to Entry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 bg-white overflow-hidden">
      {settings.authBackgroundImage && settings.authBackgroundImage.length > 5 && settings.authBackgroundImage.startsWith('h') && (
        <div className="absolute inset-0 z-0">
          <Image 
            src={settings.authBackgroundImage} 
            alt="Storefront Background"
            fill 
            className="object-cover opacity-100" 
            priority 
          />
        </div>
      )}

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white p-6 sm:p-10 border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/10">
          <div className="mb-8 sm:mb-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 uppercase">
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
              disabled={loading || !isSupabaseConfigReady}
              className="w-full min-h-[48px] bg-zinc-900 text-white text-[14px] font-semibold uppercase tracking-wider transition-all hover:bg-black disabled:opacity-50 rounded-lg flex items-center justify-center border-none shadow-none"
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
                disabled={!settings.googleAuthEnabled || !isSupabaseConfigReady}
                className="w-full group flex items-center justify-center gap-3 min-h-[48px] border border-slate-200 rounded-lg text-[14px] font-semibold uppercase tracking-wider text-zinc-950 bg-white hover:bg-zinc-50 transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale shadow-none"
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
