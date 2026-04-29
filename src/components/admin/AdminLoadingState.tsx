"use client";

import React from 'react';

type AdminLoadingStateProps = {
  eyebrow?: string;
  title?: string;
  detail?: string;
  compact?: boolean;
  className?: string;
};

export function AdminLoadingState({
  eyebrow = 'Admin Workspace',
  title = 'Syncing live data',
  detail = 'Preparing the next view with the latest records and configuration.',
  compact = false,
  className = '',
}: AdminLoadingStateProps) {
  return (
    <div
      className={`relative overflow-hidden rounded border border-slate-200 bg-white ${
        compact ? 'p-8' : 'p-10 sm:p-12'
      } ${className}`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(248,250,252,0.4),rgba(241,245,249,0.95),rgba(248,250,252,0.4))] bg-[length:200%_100%] animate-[shimmer_2.2s_linear_infinite]" />
      <div className="relative space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-900 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
              {eyebrow}
            </span>
          </div>
          <div className="space-y-2">
            <div className="h-6 w-56 rounded bg-slate-100" />
            <div className="h-3 w-full max-w-xl rounded bg-slate-100" />
            <div className="h-3 w-3/4 max-w-lg rounded bg-slate-100" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="rounded border border-slate-200 bg-slate-50/80 p-4">
              <div className="h-3 w-20 rounded bg-slate-200" />
              <div className="mt-4 h-8 w-24 rounded bg-slate-200" />
              <div className="mt-6 h-2 w-full rounded bg-slate-200" />
            </div>
          ))}
        </div>

        <div className="grid gap-3">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.8fr)] gap-4 rounded border border-slate-200 bg-white px-4 py-4"
            >
              <div className="h-4 rounded bg-slate-100" />
              <div className="h-4 rounded bg-slate-100" />
              <div className="h-4 rounded bg-slate-100" />
            </div>
          ))}
        </div>

        <div className="text-[11px] font-medium text-slate-500">{detail}</div>
      </div>
    </div>
  );
}
