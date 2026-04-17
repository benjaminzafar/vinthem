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
      setIsReady(width > 0 && height > 0);
    };

    updateReadiness();

    const observer = new ResizeObserver(() => {
      updateReadiness();
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
      style={{ minWidth: 0, minHeight }}
    >
      {isReady ? children : null}
    </div>
  );
}
