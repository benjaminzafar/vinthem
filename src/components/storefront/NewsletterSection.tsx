'use client';

import React, { useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { subscribeAction } from '@/app/actions/newsletter';
import type { StorefrontSettings } from '@/store/useSettingsStore';

interface NewsletterSectionProps {
  settings: StorefrontSettings;
  lang: string;
}

export function NewsletterSection({ settings, lang }: NewsletterSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubscribe = async (formData: FormData) => {
    startTransition(async () => {
      const result = await subscribeAction(formData);
      if (result.success) {
        toast.success(result.message);
        setFeedback({ type: 'success', message: result.message });
        formRef.current?.reset();
      } else {
        toast.error(result.message);
        setFeedback({ type: 'error', message: result.message });
      }
    });
  };

  return (
    <section className="bg-[#E6E6E4] text-brand-ink py-32 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-ink/10 to-transparent"></div>
      </div>
      <div className="max-w-2xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-2xl md:text-3xl font-sans mb-6 tracking-tight font-medium">
          {settings.newsletterPlaceholder?.[lang]}
        </h2>
        <p className="text-brand-ink/70 mb-12 text-sm md:text-base max-w-md mx-auto font-normal leading-relaxed">
          {settings.newsletterSectionSubtitle?.[lang] || 'Subscribe to receive updates, access to exclusive deals, and more.'}
        </p>
        
        <form 
          ref={formRef}
          action={handleSubscribe}
          className="max-w-md mx-auto space-y-4"
        >
          <input type="hidden" name="source" value="storefront_homepage" />
          <div className="relative flex items-center">
            <input 
              type="email" 
              name="email"
              placeholder="Enter your email address" 
              className="w-full bg-white border border-brand-ink/10 rounded px-6 py-4 text-brand-ink placeholder:text-brand-muted focus:outline-none focus:border-brand-ink/30 focus:bg-white/50 transition-all text-sm font-sans"
              required
              disabled={isPending}
              aria-label="Email address for newsletter"
            />
            <button 
              type="submit" 
              disabled={isPending}
              className="absolute right-2 top-2 bottom-2 bg-brand-ink text-white px-6 rounded text-xs font-bold uppercase tracking-wider hover:bg-brand-ink/90 transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {isPending ? '...' : (settings.newsletterButtonText?.[lang])}
            </button>
          </div>

          <label className="flex items-start gap-3 text-left text-sm text-brand-ink/75">
            <input
              type="checkbox"
              name="marketingConsent"
              required
              disabled={isPending}
              className="mt-1 h-4 w-4 rounded border-brand-ink/20 text-brand-ink focus:ring-brand-ink"
            />
            <span>
              I want marketing emails about product drops and offers. I can{' '}
              <Link href="/unsubscribe" className="underline underline-offset-4">
                unsubscribe anytime
              </Link>
              .
            </span>
          </label>

          <p className="text-xs text-brand-ink/55">
            By subscribing, you agree to our{' '}
            <Link href="/p/privacy-policy" className="underline underline-offset-4">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/p/cookie-policy" className="underline underline-offset-4">
              Cookie Policy
            </Link>
            .
          </p>

          {feedback && (
            <div
              className={`rounded border px-4 py-3 text-sm ${
                feedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {feedback.message}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

