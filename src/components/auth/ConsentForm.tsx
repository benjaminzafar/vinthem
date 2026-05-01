"use client";
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { recordSignupConsentAction } from '@/app/actions/auth';
import { useSettingsStore } from '@/store/useSettingsStore';

export function ConsentForm({ lang }: { lang: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings } = useSettingsStore();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const next = searchParams.get('next') || '/';

  const t = (obj: any, fallback: string) => {
    if (!obj) return fallback;
    return obj[lang] || obj['en'] || fallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms || !acceptedPrivacy) {
      toast.error('Please accept the Terms and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      const result = await recordSignupConsentAction({
        acceptedTerms,
        acceptedPrivacy,
        marketingOptIn
      });

      if (result.success) {
        toast.success('Preferences saved!');
        
        // 1. Prevent double-locale (/en/en)
        let targetPath = next;
        const langPrefix = `/${lang}`;
        
        if (lang && !targetPath.startsWith(langPrefix + '/') && targetPath !== langPrefix) {
          if (targetPath.startsWith('/')) {
             targetPath = `${langPrefix}${targetPath}`;
          } else {
             targetPath = `${langPrefix}/${targetPath}`;
          }
        }
        
        router.push(targetPath);
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-10 border border-slate-200 rounded-none !shadow-none max-w-md w-full">
      <div className="mb-8 text-center">
        <div className="mx-auto w-12 h-12 bg-zinc-50 flex items-center justify-center rounded-none mb-4">
          <ShieldCheck className="w-6 h-6 text-zinc-900" />
        </div>
        <h2 className="text-[12px] font-bold tracking-widest text-zinc-900 uppercase">
          {t(settings.finalizeAccountTitle, 'Finalize Account')}
        </h2>
        <p className="mt-2 text-xs text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
          {t(settings.finalizeAccountSubtitle, 'Please confirm your legal preferences to continue.')}
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4 bg-zinc-50/50 p-6 border border-zinc-100 rounded-none">
          <label className="flex items-start gap-4 text-xs text-zinc-900 cursor-pointer uppercase font-black tracking-tight group">
            <input 
              type="checkbox" 
              checked={acceptedTerms} 
              onChange={(e) => setAcceptedTerms(e.target.checked)} 
              className="mt-0.5 rounded-none h-4 w-4 border-zinc-200 text-zinc-900 focus:ring-zinc-900"
              required 
            />
            <span className="leading-tight">
              I Accept the <Link href={`/${lang}/terms-of-service`} target="_blank" className="underline text-zinc-900 hover:opacity-70 transition-all">Terms of Service</Link>
            </span>
          </label>

          <label className="flex items-start gap-4 text-xs text-zinc-900 cursor-pointer uppercase font-black tracking-tight group">
            <input 
              type="checkbox" 
              checked={acceptedPrivacy} 
              onChange={(e) => setAcceptedPrivacy(e.target.checked)} 
              className="mt-0.5 rounded-none h-4 w-4 border-zinc-200 text-zinc-900 focus:ring-zinc-900"
              required 
            />
            <span className="leading-tight">
              I Accept the <Link href={`/${lang}/privacy-policy`} target="_blank" className="underline text-zinc-900 hover:opacity-70 transition-all">Privacy Policy</Link>
            </span>
          </label>

          <label className="flex items-start gap-4 text-xs text-zinc-900 cursor-pointer uppercase font-black tracking-tight group">
            <input 
              type="checkbox" 
              checked={marketingOptIn} 
              onChange={(e) => setMarketingOptIn(e.target.checked)} 
              className="mt-0.5 rounded-none h-4 w-4 border-zinc-200 text-zinc-900 focus:ring-zinc-900"
            />
            <span className="leading-tight">
              Email me about launches, editorial stories, and offers. Unsubscribe at any time.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-zinc-900 text-white text-sm font-black uppercase tracking-[0.25em] transition-all hover:bg-black disabled:opacity-50 rounded-none"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </div>
          ) : (
            'Complete Setup'
          )}
        </button>
      </form>
    </div>
  );
}
