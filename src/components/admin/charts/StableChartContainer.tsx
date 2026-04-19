"use client";

import React, { ReactNode, useEffect, useRef, useState } from 'react';

interface StableChartContainerProps {
  children: ReactNode;
  className?: string;
  minHeight?: number;
}

export function StableChartContainer({
  children,
  className,
  minHeight = 320,
}: StableChartContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const updateReadiness = () => {
      const { width, height } = element.getBoundingClientRect();
      // Recharts throws error if width/height is -1. Ensure they are comfortably positive.
      const ready = width > 1 && height > 1;
      setIsReady(ready);
    };

    updateReadiness();

    const observer = new ResizeObserver(() => {
      // Use requestAnimationFrame to ensure layout has settled
      window.requestAnimationFrame(() => {
        updateReadiness();
      });
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minWidth: 0, minHeight, position: 'relative' }}
    >
      {isReady ? (
        <div className="absolute inset-0 w-full h-full">
           {children}
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 animate-pulse rounded">
           <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
        </div>
      )}
    </div>
  );
}
