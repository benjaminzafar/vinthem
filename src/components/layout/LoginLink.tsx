"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { localizeHref } from '@/lib/i18n-routing';

const UserIcon = ({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

interface LoginLinkProps {
  lang: string;
  loginText: string;
}

export function LoginLink({ lang, loginText }: LoginLinkProps) {
  const pathname = usePathname();
  
  // We want to redirect back to the current page after login
  const redirectUrl = encodeURIComponent(pathname);
  const href = localizeHref(lang, `/auth?redirect=${redirectUrl}`);

  return (
    <Link
      href={href}
      className="px-2 py-2 text-slate-600 hover:text-brand-ink transition-colors flex items-center justify-center"
      aria-label={loginText}
    >
      <UserIcon className="w-5 h-5" strokeWidth={1.5} />
    </Link>
  );
}
