"use client";

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import React, { useEffect } from 'react';

export function PostHogProvider({ 
  children, 
  apiKey, 
  host 
}: { 
  children: React.ReactNode,
  apiKey?: string,
  host?: string
}) {
  useEffect(() => {
    const key = apiKey || process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const apiHost = host || process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';

    if (key && typeof window !== 'undefined') {
      posthog.init(key, {
        api_host: apiHost,
        person_profiles: 'identified_only',
        capture_pageview: true 
      });
    }
  }, [apiKey, host]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
