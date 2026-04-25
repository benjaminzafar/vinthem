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
        // Extract language or default to root
        const langMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
        const lang = langMatch ? langMatch[1] : '';
        const target = lang ? `/${lang}/auth/consent` : '/auth/consent';
        
        router.push(`${target}?next=${pathname}`);
      }
    }

    checkConsent();
  }, [pathname, router, supabase]);

  return null;
}
