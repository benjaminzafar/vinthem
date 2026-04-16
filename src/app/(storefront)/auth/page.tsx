"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { Mail, Lock, User } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import Link from 'next/link';
import { recordSignupConsentAction, syncCurrentUserProfileAction } from '@/app/actions/auth';
import { getClientLocale } from '@/lib/locale';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const navigate = useRouter();
  const { setIsAdmin } = useAuthStore();
  const { settings } = useSettingsStore();
  const lang = getClientLocale();
  const signUpTermsPrefix = settings.signUpTermsConsentText?.[lang] || 'I agree to the';
  const signUpPrivacyText = settings.signUpPrivacyConsentText?.[lang] || 'I have read the Privacy Policy and Cookie Policy.';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
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
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });
        if (error) throw error;

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

      // Check admin role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const syncResult = await syncCurrentUserProfileAction(name);
        if (!syncResult.success) throw new Error(syncResult.message);
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        setIsAdmin(profile?.role === 'admin');
      }

      toast.success(isLogin ? settings.loginSuccessText?.[lang] : settings.accountCreatedSuccessText?.[lang]);
      navigate.push('/');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Authentication failed';
      toast.error(msg);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-sans font-bold text-gray-900">
            {isLogin ? settings.signInTitle?.[lang] : settings.signUpTitle?.[lang]}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                className="appearance-none rounded-xl relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
                placeholder={settings.fullNameLabelText?.[lang]}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="email"
              required
              className="appearance-none rounded-xl relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
              placeholder={settings.emailLabel?.[lang]}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="password"
              required
              className="appearance-none rounded-xl relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
              placeholder={settings.passwordLabel?.[lang]}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900"
          >
            {isLogin ? settings.signInButtonText?.[lang] : settings.signUpButtonText?.[lang]}
          </button>

          {!isLogin && (
            <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
              <label className="flex items-start gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-zinc-900 focus:ring-zinc-900"
                  required
                />
                <span>
                  {signUpTermsPrefix}{' '}
                  <Link href="/p/terms-of-service" className="font-medium underline underline-offset-4">
                    {settings.termsOfServicePageTitle?.[lang] || 'Terms of Service'}
                  </Link>.
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(event) => setAcceptedPrivacy(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-zinc-900 focus:ring-zinc-900"
                  required
                />
                <span>
                  {signUpPrivacyText}{' '}
                  <Link href="/p/privacy-policy" className="font-medium underline underline-offset-4">
                    {settings.privacyPolicyPageTitle?.[lang] || 'Privacy Policy'}
                  </Link>{' '}
                  {lang === 'sv' ? 'och' : lang === 'fi' ? 'ja' : lang === 'da' ? 'og' : 'and'}{' '}
                  <Link href="/p/cookie-policy" className="font-medium underline underline-offset-4">
                    {settings.cookiePolicyPageTitle?.[lang] || 'Cookie Policy'}
                  </Link>.
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(event) => setMarketingOptIn(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-zinc-900 focus:ring-zinc-900"
                />
                <span>
                  {settings.signUpMarketingConsentText?.[lang] || 'Email me about launches, editorial stories, and offers. You can unsubscribe at any time.'}
                </span>
              </label>
            </div>
          )}
        </form>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={!settings.googleAuthEnabled}
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900"
          >
            {settings.continueWithGoogleText?.[lang]}
          </button>
          {!settings.googleAuthEnabled && (
            <p className="mt-3 text-center text-xs text-gray-500">
              {settings.googleLoginUnavailableText?.[lang] || 'Google sign-in is not available right now.'}
            </p>
          )}
        </div>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-zinc-900 hover:text-zinc-900"
          >
            {isLogin ? settings.dontHaveAccountText?.[lang] : settings.alreadyHaveAccountText?.[lang]}
          </button>
        </div>
      </div>
    </div>
  );
}
