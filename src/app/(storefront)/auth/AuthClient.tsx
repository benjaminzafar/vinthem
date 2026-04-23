"use client";
import React, { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { Mail, Lock, User } from 'lucide-react';
import type { StorefrontSettings } from '@/store/useSettingsStore';
import Link from 'next/link';
import { recordSignupConsentAction, syncCurrentUserProfileAction } from '@/app/actions/auth';
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
  const navigate = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setUser, setIsAdmin } = useAuthStore();
  const settings = useStorefrontSettings(initialSettings);
  const lang = getClientLocale(pathname);
  const signUpTermsPrefix = settings.signUpTermsConsentText?.[lang] || 'I agree to the';
  const signUpPrivacyText = settings.signUpPrivacyConsentText?.[lang] || 'I have read the Privacy Policy and Cookie Policy.';
  const redirectTarget = searchParams.get('redirect') || searchParams.get('next') || '/';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const supabase = createClient();

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ 
          email, 
          password
        });
        if (error) throw error;
      } else {
        if (!acceptedTerms || !acceptedPrivacy) {
          throw new Error('You must accept the Terms and Privacy Policy to create an account.');
        }

        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
            data: {
              full_name: name
            }
          }
        });
        if (error) throw error;

        // If identities is an empty array, the user already exists (security mitigation)
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          throw new Error(settings.userAlreadyExistsErrorText?.[lang] || 'An account with this email already exists.');
        }

        // If confirmation is required, there is NO session yet.
        // We cannot call server actions that require a session.
        if (!data.session) {
          setShowOTP(true);
          setOtpType('signup');
          return;
        }

        if (data.user) {
          const syncResult = await syncCurrentUserProfileAction(name);
          if (!syncResult.success) throw new Error(syncResult.message);

          const consentResult = await recordSignupConsentAction({
            fullName: name,
            acceptedTerms,
            acceptedPrivacy,
            marketingOptIn,
          });

          if (!consentResult.success) throw new Error(consentResult.message);
        }
      }

      // Check admin role or establish session state
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Ensure profile exists (especially on social login or legacy accounts)
        await syncCurrentUserProfileAction(name || user.user_metadata?.full_name);
        
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        setIsAdmin(profile?.role === 'admin');
      }

      toast.success(isLogin ? settings.loginSuccessText?.[lang] : settings.accountCreatedSuccessText?.[lang]);
      navigate.refresh();
      navigate.push(redirectTarget);
    } catch (error: unknown) {
      const err = error as any;
      if (err.status === 429 || err.code === 'too_many_requests' || err.message?.toLowerCase().includes('rate limit')) {
        toast.error('Security Check: Too many requests. Please wait 5-10 minutes before trying again to protect your account.');
      } else {
        const msg = err.message || 'Authentication failed';
        if (msg.toLowerCase().includes('email not confirmed')) {
          setShowOTP(true);
          setOtpType('signup');
        } else {
          toast.error(msg);
        }
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Implementation of 10-minute rate limiting
    const RATE_LIMIT_MS = 10 * 60 * 1000;
    const lastRequestKey = `last_reset_request_${email}`;
    const lastRequest = localStorage.getItem(lastRequestKey);
    const now = Date.now();

    if (lastRequest) {
      const timePassed = now - parseInt(lastRequest);
      if (timePassed < RATE_LIMIT_MS) {
        const minutesLeft = Math.ceil((RATE_LIMIT_MS - timePassed) / 60000);
        const waitMsg = settings.rateLimitWaitErrorText?.[lang] || 'Please wait before requesting another code.';
        toast.error(`${waitMsg} (${minutesLeft} min remaining)`);
        return;
      }
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      
      // Store current time on success
      localStorage.setItem(lastRequestKey, now.toString());
      
      toast.success(settings.resetPasswordSentSuccessText?.[lang] || 'Recovery code sent');
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
      toast.error(settings.googleLoginUnavailableText?.[lang] || 'Google sign-in is not available right now.');
      return;
    }

    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      toast.success(settings.googleLoginSuccessText?.[lang]);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Google login failed';
      toast.error(msg);
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

      {/* Main Content Card - Clean Minimalism */}
      <div className="relative z-10 max-w-md w-full">
        {showOTP ? (
          <div className="bg-white/90 backdrop-blur-md p-2 rounded-3xl shadow-2xl">
            <OTPVerification 
              email={email}
              type={otpType}
              onSuccess={async () => {
                // Ensure the session is fully synced to the client before redirecting
                const supabase = createClient();
                await supabase.auth.getSession();
                
                if (otpType === 'recovery') {
                  navigate.push(`/${lang}/auth/reset-password`);
                  return;
                }

                toast.success(settings.loginSuccessText?.[lang] || 'Authenticated successfully');
                
                // Set loading back to true to hide the OTP form and show a transition
                setLoading(true);
                
                // Force a refresh to update server-side auth state
                navigate.refresh();
                
                // Small delay to ensure the cookie is processed by the browser
                setTimeout(() => {
                  navigate.push(redirectTarget);
                }, 100);
              }}
              labels={{
                title: settings.otpTitle?.[lang],
                subtitle: settings.otpSubtitle?.[lang],
                checkSpam: settings.otpCheckSpam?.[lang],
                verifyButton: settings.otpVerifyButton?.[lang],
                clearButton: settings.otpClearButton?.[lang],
                errorInvalid: settings.invalidOtpErrorText?.[lang]
              }}
            />
            <div className="mt-6 text-center">
              <button 
                onClick={() => setShowOTP(false)}
                className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                Back to {isForgotPassword ? 'Reset Password' : (isLogin ? 'Sign In' : 'Sign Up')}
              </button>
            </div>
          </div>
        ) : isForgotPassword ? (
          <div className="bg-white/90 backdrop-blur-md p-10 rounded-2xl border border-zinc-100">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-sans font-bold tracking-tight text-zinc-900">
                {settings.forgotPasswordTitle?.[lang]}
              </h2>
              <p className="mt-3 text-sm text-zinc-600 font-medium leading-relaxed">
                {settings.forgotPasswordSubtitle?.[lang]}
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleForgotPassword}>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 transition-colors group-focus-within:text-zinc-900" />
                <input
                  type="email"
                  required
                  className="appearance-none rounded-xl relative block w-full pl-11 pr-4 py-4 bg-zinc-50/80 border border-zinc-200 placeholder-zinc-500 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all sm:text-sm font-medium"
                  placeholder={settings.emailLabel?.[lang]}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    settings.sendResetLinkButtonText?.[lang]
                  )}
                </span>
              </button>
            </form>

            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="text-[11px] font-black uppercase tracking-widest text-zinc-950 underline underline-offset-4 decoration-zinc-200 hover:decoration-zinc-950 transition-all"
              >
                {settings.backToLoginText?.[lang]}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-md p-10 rounded-2xl border border-zinc-100">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-sans font-bold tracking-tight text-zinc-900">
                {isLogin ? settings.signInTitle?.[lang] : settings.signUpTitle?.[lang]}
              </h2>
              <p className="mt-3 text-sm text-zinc-600 font-medium leading-relaxed">
                {isLogin ? 'Enter your details to access your account' : 'Start your journey with us today'}
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleAuth}>
              {!isLogin && (
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 transition-colors group-focus-within:text-zinc-900" />
                  <input
                    type="text"
                    required
                    className="appearance-none rounded-xl relative block w-full pl-11 pr-4 py-4 bg-zinc-50/80 border border-zinc-200 placeholder-zinc-500 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all sm:text-sm font-medium"
                    placeholder={settings.fullNameLabelText?.[lang]}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 transition-colors group-focus-within:text-zinc-900" />
                <input
                  type="email"
                  required
                  className="appearance-none rounded-xl relative block w-full pl-11 pr-4 py-4 bg-zinc-50/80 border border-zinc-200 placeholder-zinc-500 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all sm:text-sm font-medium"
                  placeholder={settings.emailLabel?.[lang]}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 transition-colors group-focus-within:text-zinc-900" />
                <input
                  type="password"
                  required
                  className="appearance-none rounded-xl relative block w-full pl-11 pr-4 py-4 bg-zinc-50/80 border border-zinc-200 placeholder-zinc-500 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all sm:text-sm font-medium"
                  placeholder={settings.passwordLabel?.[lang]}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {isLogin && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    {settings.forgotPasswordText?.[lang]}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex items-center justify-center py-4 px-6 bg-zinc-900 text-white text-[13px] font-bold rounded-2xl transition-all hover:bg-black hover:shadow-xl hover:shadow-zinc-200/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      {isLogin ? 'Signing In...' : 'Creating Account...'}
                    </div>
                  ) : (
                    isLogin ? settings.signInButtonText?.[lang] : settings.signUpButtonText?.[lang]
                  )}
                </span>
                {!loading && (
                  <div className="absolute right-6 opacity-40 transition-transform group-hover:translate-x-1 group-hover:opacity-100">
                    {isLogin ? <Lock className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>
                )}
              </button>

              {!isLogin && (
                <div className="space-y-4 rounded-[1.5rem] border border-zinc-100 bg-zinc-50/30 p-6 mt-8">
                  <label className="flex items-start gap-4 text-xs text-zinc-500 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(event) => setAcceptedTerms(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded-md border-zinc-200 text-zinc-900 focus:ring-zinc-900 transition-all cursor-pointer"
                      required
                    />
                    <span className="leading-relaxed">
                      {signUpTermsPrefix}{' '}
                      <Link href="/p/terms-of-service" className="font-semibold text-zinc-900 underline underline-offset-4 decoration-zinc-100 hover:decoration-zinc-900 transition-all">
                        {settings.termsOfServicePageTitle?.[lang] || 'Terms of Service'}
                      </Link>.
                    </span>
                  </label>

                  <label className="flex items-start gap-4 text-xs text-zinc-500 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acceptedPrivacy}
                      onChange={(event) => setAcceptedPrivacy(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded-md border-zinc-200 text-zinc-900 focus:ring-zinc-900 transition-all cursor-pointer"
                      required
                    />
                    <span className="leading-relaxed">
                      {signUpPrivacyText}{' '}
                      <Link href="/p/privacy-policy" className="font-semibold text-zinc-900 underline underline-offset-4 decoration-zinc-100 hover:decoration-zinc-900 transition-all">
                        {settings.privacyPolicyPageTitle?.[lang] || 'Privacy Policy'}
                      </Link>{' '}
                      {lang === 'sv' ? 'och' : lang === 'fi' ? 'ja' : lang === 'da' ? 'og' : 'and'}{' '}
                      <Link href="/p/cookie-policy" className="font-semibold text-zinc-900 underline underline-offset-4 decoration-zinc-100 hover:decoration-zinc-900 transition-all">
                        {settings.cookiePolicyPageTitle?.[lang] || 'Cookie Policy'}
                      </Link>.
                    </span>
                  </label>

                  <label className="flex items-start gap-4 text-xs text-zinc-500 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={marketingOptIn}
                      onChange={(event) => setMarketingOptIn(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded-md border-zinc-200 text-zinc-900 focus:ring-zinc-900 transition-all cursor-pointer"
                    />
                    <span className="leading-relaxed">
                      {settings.signUpMarketingConsentText?.[lang] || 'Email me about launches and exclusive offers.'}
                    </span>
                  </label>
                </div>
              )}
            </form>

            <div className="relative my-10 flex items-center">
              <div className="flex-grow border-t border-zinc-200"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Secure Entry
              </span>
              <div className="flex-grow border-t border-zinc-200"></div>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={!settings.googleAuthEnabled}
                className="w-full group flex items-center justify-center gap-3 py-4 border border-zinc-200 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] text-zinc-950 bg-white hover:bg-zinc-50 hover:border-zinc-300 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
              >
                <svg className="w-4 h-4 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>{settings.continueWithGoogleText?.[lang]}</span>
              </button>
              
              {!settings.googleAuthEnabled && (
                <p className="text-center text-[10px] text-zinc-400 font-medium">
                  {settings.googleLoginUnavailableText?.[lang] || 'Google sign-in is not available right now.'}
                </p>
              )}
            </div>

            <div className="mt-10 text-center">
              <p className="text-[11px] font-medium text-zinc-600">
                {isLogin ? settings.dontHaveAccountText?.[lang] : settings.alreadyHaveAccountText?.[lang]}
                {' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-black uppercase tracking-widest text-zinc-950 underline underline-offset-4 decoration-zinc-200 hover:decoration-zinc-950 transition-all ml-1"
                >
                  {isLogin ? settings.signUpButtonText?.[lang] : settings.signInButtonText?.[lang]}
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
