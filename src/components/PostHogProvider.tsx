"use client";

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import React, { useEffect } from 'react';
import type { PostHogConfig, PostHogInterface } from 'posthog-js';

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
    // Final Shield: Intercept and silence the specific PostHog script load errors
    const handleError = (event: ErrorEvent) => {
      const isPostHogError = 
        event.message?.includes('failed to load script') || 
        event.filename?.includes('posthog') ||
        (event.error?.stack?.includes('posthog') && event.error?.message?.includes('failed to load script'));
      
      if (isPostHogError) {
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
    };

    window.addEventListener('error', handleError, true);

    if (apiKey) {
      const config: Partial<PostHogConfig> & {
        disable_toolbar_app: boolean;
        disable_web_vitals: boolean;
        advanced_disable_flags: boolean;
      } = {
        api_host: host || 'https://eu.i.posthog.com',
        person_profiles: 'always',
        capture_pageview: true,
        capture_performance: false,
        autocapture: false,
        capture_dead_clicks: false,
        disable_session_recording: true,
        disable_surveys: true,
        disable_toolbar_app: true,
        disable_web_vitals: true,
        persistence: 'memory',
        advanced_disable_flags: true, // Updated from deprecated advanced_disable_decide
        loaded: (ph: PostHogInterface) => {
          if (process.env.NODE_ENV === 'development') ph.debug();
        },
      };

      posthog.init(apiKey, config);
    }

    return () => window.removeEventListener('error', handleError, true);
  }, [apiKey, host]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
