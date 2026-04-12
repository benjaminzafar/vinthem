"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  className?: string;
  label?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ className = "", label = "Back" }) => {
  const navigate = useRouter();
  return (
    <button 
      onClick={() => navigate.back()} 
      className={`inline-flex items-center text-xs font-medium text-brand-muted hover:text-brand-ink transition-all uppercase tracking-wide ${className}`}
    >
      <ArrowLeft className="mr-2 w-3.5 h-3.5" />
      {label}
    </button>
  );
};
