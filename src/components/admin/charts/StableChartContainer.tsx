"use client";

import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const CHART_HEIGHTS = {
  compact: 220,
  standard: 280,
  feature: 360,
} as const;

interface StableChartContainerProps {
  children: ReactNode | ((dimensions: { width: number; height: number }) => ReactNode);
  className?: string;
  minHeight?: number;
  size?: keyof typeof CHART_HEIGHTS;
}

export function StableChartContainer({
  children,
  className,
  minHeight,
  size = 'standard',
}: StableChartContainerProps) {
  const resolvedMinHeight = minHeight ?? CHART_HEIGHTS[size];
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: resolvedMinHeight });

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const updateReadiness = () => {
      const { width, height } = element.getBoundingClientRect();
      const nextWidth = Math.max(Math.floor(width), 0);
      const nextHeight = Math.max(Math.floor(height), resolvedMinHeight);
      // Recharts throws error if width/height is -1 or 0. Ensure they are comfortably positive.
      const ready = nextWidth > 0 && nextHeight > 0;
      setDimensions((current) =>
        current.width === nextWidth && current.height === nextHeight
          ? current
          : { width: nextWidth, height: nextHeight }
      );
      setIsReady(ready);
    };

    updateReadiness();

    const queueMeasurement = () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = window.requestAnimationFrame(() => {
        updateReadiness();
      });
    };

    const observer = new ResizeObserver(() => {
      queueMeasurement();
    });

    observer.observe(element);
    queueMeasurement();

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      observer.disconnect();
    };
  }, [resolvedMinHeight]);

  return (
    <div
      ref={containerRef}
      className={cn('relative min-w-0 overflow-hidden', className)}
      style={{ minWidth: 0, height: resolvedMinHeight, minHeight: resolvedMinHeight }}
    >
      {isReady ? (
        <div
          className="w-full"
          style={{
            width: `${Math.max(dimensions.width, 1)}px`,
            height: `${Math.max(dimensions.height, resolvedMinHeight)}px`,
            minWidth: 1,
            minHeight: resolvedMinHeight,
          }}
        >
          {typeof children === 'function'
            ? children({
                width: Math.max(dimensions.width, 1),
                height: Math.max(dimensions.height, resolvedMinHeight),
              })
            : children}
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 animate-pulse rounded">
           <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
        </div>
      )}
    </div>
  );
}
