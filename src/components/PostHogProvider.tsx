"use client";

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import React from 'react';

export function PostHogProvider({ 
  children, 
  apiKey,
  host,
}: { 
  children: React.ReactNode,
  apiKey?: string,
  host?: string
}) {
  void apiKey;
  void host;

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
