'use client';

import React, { useTransition } from 'react';
import { toast } from 'sonner';
import { subscribeAction } from '@/app/actions/newsletter';

interface NewsletterSectionProps {
  settings: any;
  lang: string;
}

export function NewsletterSection({ settings, lang }: NewsletterSectionProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubscribe = async (formData: FormData) => {
    startTransition(async () => {
      const result = await subscribeAction(formData);
      if (result.success) {
        toast.success(result.message);
        // Reset form manually if needed
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <section className="bg-[#E6E6E4] text-brand-ink py-32 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-ink/10 to-transparent"></div>
      </div>
      <div className="max-w-2xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-3xl md:text-5xl font-sans mb-6 tracking-tight font-light">
          {settings.newsletterPlaceholder?.[lang]}
        </h2>
        <p className="text-brand-ink/70 mb-12 text-sm md:text-base max-w-md mx-auto font-light">
          {settings.newsletterSectionSubtitle?.[lang] || 'Subscribe to receive updates, access to exclusive deals, and more.'}
        </p>
        
        <form 
          action={handleSubscribe}
          className="relative max-w-md mx-auto flex items-center"
        >
          <input 
            type="email" 
            name="email"
            placeholder="Enter your email address" 
            className="w-full bg-white border border-brand-ink/10 rounded-full px-6 py-4 text-brand-ink placeholder:text-brand-muted focus:outline-none focus:border-brand-ink/30 focus:bg-white/50 transition-all text-sm font-sans"
            required
            disabled={isPending}
          />
          <button 
            type="submit" 
            disabled={isPending}
            className="absolute right-2 top-2 bottom-2 bg-brand-ink text-white px-6 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-brand-ink/90 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {isPending ? '...' : (settings.newsletterButtonText?.[lang])}
          </button>
        </form>
      </div>
    </section>
  );
}
