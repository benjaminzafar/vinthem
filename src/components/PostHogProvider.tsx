"use client";

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import React, { useEffect } from 'react';

export function PostHogProvider({ 
  children, 
  apiKey,
  host,
}: { 
  children: React.ReactNode,
  apiKey?: string,
  host?: string
}) {
  useEffect(() => {
    if (apiKey) {
      posthog.init(apiKey, {
        api_host: host || 'https://eu.i.posthog.com',
        person_profiles: 'always',
        capture_pageview: true,
        disable_surveys: true, // Prevent loading of secondary survey script which often fails
        loaded: (ph) => {
          if (process.env.NODE_ENV === 'development') ph.debug();
        },
      });
    }
  }, [apiKey, host]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
