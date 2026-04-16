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

  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onIntersect();
        }
      },
      { threshold: 0.1 }
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

  return (
    <div 
      ref={sentinelRef} 
      className={`py-8 flex flex-col items-center justify-center gap-3 ${className}`}
    >
      {isLoading && (
        <>
          <RefreshCcw className="w-5 h-5 animate-spin text-slate-400" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 animate-pulse">
            {loadingMessage}
          </p>
        </>
      )}
      {!hasMore && !isLoading && (
        <div className="w-full flex items-center gap-4 px-6">
          <div className="h-px bg-slate-200 flex-1" />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-300">
            End of records
          </span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>
      )}
    </div>
  );
}
