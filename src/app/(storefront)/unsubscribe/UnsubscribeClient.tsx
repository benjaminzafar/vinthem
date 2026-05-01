"use client";

import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { unsubscribeAction } from "@/app/actions/newsletter";

export function UnsubscribeClient() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [isPending, startTransition] = useTransition();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const lang = pathname.split('/')[1] || 'en';
  
  const message = useMemo(
    () => searchParams.get("email") ? "We prefilled your email from the unsubscribe link." : null,
    [searchParams]
  );

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await unsubscribeAction(formData);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#f4f1ea] px-4 py-20">
      <div className="mx-auto max-w-2xl rounded-none border border-stone-200 bg-white px-6 py-10 shadow-none-[0_24px_90px_rgba(15,23,42,0.08)] sm:px-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-stone-500">Email preferences</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-900">Unsubscribe in one step.</h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          Stop launch emails, newsletter updates, and marketing campaigns here. Transactional emails about orders
          and support cases will still be sent when needed.
        </p>

        {message && (
          <div className="mt-6 rounded-none border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        )}

        <form action={handleSubmit} className="mt-8 space-y-5">
          <input type="hidden" name="unsubscribeToken" value={searchParams.get("token") ?? ""} />
          <div>
            <label htmlFor="newsletter-email" className="mb-2 block text-sm font-medium text-stone-800">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              name="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isPending}
              className="w-full rounded-none border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-900"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-none bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
          >
            {isPending ? "Updating..." : "Unsubscribe from marketing emails"}
          </button>
        </form>

        <div className="mt-8 rounded-none border border-stone-200 bg-stone-50 px-5 py-4 text-sm text-stone-600">
          Looking for privacy details instead? Read our{" "}
          <Link href={`/${lang}/p/privacy-policy`} className="font-medium underline underline-offset-4">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href={`/${lang}/p/cookie-policy`} className="font-medium underline underline-offset-4">
            Cookie Policy
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
