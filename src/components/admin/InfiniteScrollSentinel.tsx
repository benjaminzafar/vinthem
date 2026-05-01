"use client";
import React, { useEffect, useRef } from 'react';
import { RefreshCcw } from 'lucide-react';

interface InfiniteScrollSentinelProps {
  onIntersect: () => void;
  isLoading: boolean;
  hasMore: boolean;
  loadingMessage?: string;
  className?: string;
}

export function InfiniteScrollSentinel({
  onIntersect,
  isLoading,
  hasMore,
  loadingMessage = "Loading more entries...",
  className = ""
}: InfiniteScrollSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const cooldownRef = useRef(false);

  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          if (cooldownRef.current) return;
          
          onIntersect();
          cooldownRef.current = true;
          
          setTimeout(() => {
            cooldownRef.current = false;
          }, 300); // 300ms cooldown
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore, isLoading, onIntersect]);

  if (!isLoading && !hasMore) {
    return <div ref={sentinelRef} className="h-px w-full opacity-0" aria-hidden="true" />;
  }

  return (
    <div 
      ref={sentinelRef} 
      className={`flex min-h-0 w-full items-center justify-center ${className}`}
    >
      {isLoading && (
        <div className="flex items-center gap-2 rounded-none border border-slate-200/70 bg-white/80 px-3 py-1.5 shadow-none-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-sm">
          <RefreshCcw className="h-3.5 w-3.5 animate-spin text-slate-400" />
          <p className="text-[10px] font-medium tracking-[0.12em] text-slate-500 uppercase">
            {loadingMessage}
          </p>
        </div>
      )}
      {!isLoading && hasMore && (
        <div
          aria-hidden="true"
          className="h-px w-full opacity-0 pointer-events-none"
        />
      )}
    </div>
  );
}
