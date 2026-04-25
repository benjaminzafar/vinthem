"use client";
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export function ConsentGuardian() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    async function checkConsent() {
      // 1. Skip check if already on auth or consent pages
      if (pathname.includes('/auth') || pathname.includes('/callback')) {
        return;
      }

      // 2. Check current session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 3. Check profile for terms acceptance
      const { data: profile } = await supabase
        .from('users')
        .select('accepted_terms_at')
        .eq('id', user.id)
        .maybeSingle();

      // 4. If logged in but no terms (or no profile yet) -> redirect
      // Strict EU Standard: Assume NO CONSENT until proven otherwise.
      if (!profile || !profile.accepted_terms_at) {
        // Extract language prefix from pathname - carefully avoid doubling
        const langMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
        const lang = langMatch ? langMatch[1] : '';
        
        // Use a relative path from the current language base
        // If we are already at /en/..., we just need /auth/consent
        // Next.js router.push handles prefixing if configured, but here we'll ensure it's clean
        const target = lang ? `/${lang}/auth/consent` : '/auth/consent';
        
        // Prevent double redirect if we're already moving there
        if (!pathname.includes('/auth/consent')) {
          router.push(`${target}?next=${pathname}`);
        }
      }
    }

    checkConsent();
  }, [pathname, router, supabase]);

  return null;
}
