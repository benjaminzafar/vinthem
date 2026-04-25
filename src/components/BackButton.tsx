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
      className={`inline-flex items-center text-[12px] font-bold text-slate-400 hover:text-slate-950 transition-all uppercase tracking-[0.2em] ${className}`}
    >
      <ArrowLeft className="mr-2 w-3.5 h-3.5" strokeWidth={2.5} />
      {label}
    </button>
  );
};
