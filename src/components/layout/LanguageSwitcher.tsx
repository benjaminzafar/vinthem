"use client";

import React, { useState, useRef, useEffect, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, Loader2, Globe, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getClientLocale, persistLocaleCookie } from '@/lib/locale';
import { normalizeLocalizedPath } from '@/lib/i18n-routing';
import { Portal } from './Portal';

export const getLanguageName = (code: string) => {
  const names: Record<string, string> = {
    en: 'English',
    sv: 'Svenska',
    fi: 'Suomi',
    da: 'Dansk',
    de: 'Deutsch',
    no: 'Norsk',
    nb: 'Norsk Bokmål',
    nn: 'Nynorsk',
    is: 'Íslenska'
  };
  return names[code.toLowerCase()] || code.toUpperCase();
};

interface LanguageSwitcherProps {
  availableLanguages: string[];
  variant?: 'dropdown' | 'boxes' | 'drawer';
  direction?: 'down' | 'up';
  align?: 'left' | 'right';
}

export function LanguageSwitcher({ availableLanguages, variant = 'dropdown', direction = 'down', align = 'right' }: LanguageSwitcherProps) {
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
              aria-label={`Change language to ${getLanguageName(lng)}`}
              onClick={() => changeLanguage(lng)}
              className={`min-w-12 h-10 px-3 flex items-center justify-center text-xs font-black uppercase tracking-widest transition-all relative overflow-hidden ${
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
                    <div className="w-1 h-1 bg-white rounded" />
                 </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative h-full flex items-center" ref={dropdownRef}>
      <button 
        disabled={isPending}
        aria-label="Change language"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 p-2 px-3.5 bg-slate-50/80 hover:bg-slate-100 text-brand-ink transition-all text-[11px] font-bold uppercase tracking-widest border border-slate-200/50 rounded-full ${isPending ? 'opacity-50' : ''}`}
      >
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-muted" /> : (
          <>
            <Globe className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>{currentLocale}</span>
          </>
        )}
        <ChevronDown 
          className={`w-3.5 h-3.5 text-brand-muted transition-transform duration-300 ${
            direction === 'up' 
              ? (isOpen ? '' : 'rotate-180') 
              : (isOpen ? 'rotate-180' : '')
          }`} 
          strokeWidth={2} 
        />
      </button>

      <AnimatePresence>
        {isOpen && variant === 'drawer' && (
          <Portal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 28, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[1000] px-6 py-8 lg:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-slate-100"
            >
              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-[12px] font-bold uppercase tracking-widest text-brand-ink">
                  Language
                </h3>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-2 -mr-2 text-slate-500 hover:text-brand-ink transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>
              <div className="flex flex-col space-y-1">
                {availableLanguages.map((lng) => {
                  return (
                    <button
                      key={lng}
                      disabled={isPending}
                      aria-label={`Switch to ${getLanguageName(lng)}`}
                      onClick={() => changeLanguage(lng)}
                      className={`flex items-center justify-between w-full py-4 px-4 rounded-2xl transition-all ${currentLocale === lng ? "bg-slate-50/80" : "bg-transparent hover:bg-slate-50/50"}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-[12px] font-bold uppercase tracking-widest transition-colors ${currentLocale === lng ? 'text-brand-ink' : 'text-brand-muted hover:text-brand-ink'}`}>
                          {getLanguageName(lng)}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${currentLocale === lng ? 'bg-white border-slate-200 text-brand-ink' : 'border-transparent text-slate-500'}`}>
                          {lng}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {isPending && targetLang === lng && <Loader2 className="w-4 h-4 animate-spin text-brand-muted" />}
                        {currentLocale === lng && !isPending && <Check className="w-4 h-4 text-brand-ink" strokeWidth={2.5} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </Portal>
        )}

        {isOpen && variant === 'dropdown' && (
          <motion.div
            initial={{ opacity: 0, y: direction === 'up' ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: direction === 'up' ? 10 : -10, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} ${direction === 'up' ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+4px)]'} w-48 bg-white/95 backdrop-blur-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] ring-1 ring-black/[0.05] z-[100] py-2 px-1.5 overflow-hidden rounded-2xl`}
          >

            {availableLanguages.map((lng) => (
              <button
                key={lng}
                disabled={isPending}
                aria-label={`Switch to ${getLanguageName(lng)}`}
                onClick={() => changeLanguage(lng)}
                className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${currentLocale === lng ? "text-brand-ink bg-slate-50" : "text-brand-muted hover:text-brand-ink hover:bg-slate-50/50"}`}
              >
                <div className="flex items-center gap-2.5">
                  <span>{getLanguageName(lng)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${currentLocale === lng ? 'border-slate-200 text-brand-ink bg-white' : 'border-transparent text-slate-300'}`}>
                    {lng}
                  </span>
                  {isPending && targetLang === lng && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-muted" />}
                  {currentLocale === lng && !isPending && <Check className="w-3.5 h-3.5 text-brand-ink" strokeWidth={2.5} />}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
