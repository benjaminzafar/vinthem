"use client";

import React, { useState, useRef, useEffect, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getClientLocale, persistLocaleCookie } from '@/lib/locale';
import { normalizeLocalizedPath } from '@/lib/i18n-routing';

interface LanguageSwitcherProps {
  availableLanguages: string[];
  variant?: 'dropdown' | 'boxes';
}

export function LanguageSwitcher({ availableLanguages, variant = 'dropdown' }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [targetLang, setTargetLang] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = getClientLocale(pathname);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const changeLanguage = (lng: string) => {
    if (lng === currentLocale || isPending) return;
    
    setTargetLang(lng);
    persistLocaleCookie(lng);
    setIsOpen(false);
    
    startTransition(() => {
      router.push(normalizeLocalizedPath(pathname || '/', lng));
      router.refresh();
    });
  };

  if (variant === 'boxes') {
    return (
      <div className="flex flex-wrap gap-2">
        {availableLanguages.map((lng) => {
          const isActivelySwitching = isPending && targetLang === lng;
          return (
            <button
              key={lng}
              disabled={isPending}
              onClick={() => changeLanguage(lng)}
              className={`min-w-12 h-10 px-3 flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden ${
                currentLocale === lng 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              } ${isPending && targetLang !== lng ? 'opacity-40 pointer-events-none' : ''}`}
            >
              {isActivelySwitching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span>{lng}</span>
              )}
              {currentLocale === lng && !isPending && (
                 <div className="absolute top-0 right-0 p-0.5">
                    <div className="w-1 h-1 bg-white rounded-full" />
                 </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        disabled={isPending}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 p-1.5 px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all text-[10px] font-black uppercase tracking-widest border border-transparent hover:border-slate-100 rounded-lg ${isPending ? 'opacity-50' : ''}`}
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin text-slate-400" /> : <span>{currentLocale}</span>}
        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-3 w-36 bg-white shadow-2xl shadow-slate-900/10 border border-slate-100 z-[100] py-2 overflow-hidden"
          >
            {availableLanguages.map((lng) => (
              <button
                key={lng}
                disabled={isPending}
                onClick={() => changeLanguage(lng)}
                className={`flex items-center justify-between w-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${currentLocale === lng ? 'text-slate-900 bg-slate-50' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <span>{lng}</span>
                {isPending && targetLang === lng && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                {currentLocale === lng && !isPending && <div className="w-1 h-1 bg-slate-900 rounded-full" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
