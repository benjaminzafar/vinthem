"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTranslation } from 'react-i18next';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useRouter();
  const { setIsAdmin } = useAuthStore();
  const { settings } = useSettingsStore();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
          // Create user profile row
          await supabase.from('users').upsert({
            id: data.user.id,
            email,
            name,
            role: 'client',
          });
        }
      }

      // Check admin role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        setIsAdmin(profile?.role === 'admin' || user.email === 'benjaminzafar10@gmail.com');
      }

      toast.success(isLogin ? settings.loginSuccessText?.[lang] : settings.accountCreatedSuccessText?.[lang]);
      navigate.push('/');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Authentication failed';
      toast.error(msg);
    }
  };

  const handleGoogleLogin = async () => {
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
        </form>

        <div className="mt-6">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900"
          >
            {settings.continueWithGoogleText?.[lang]}
          </button>
        </div>

        <div className="text-center mt-4">
          <button
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
