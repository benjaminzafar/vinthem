"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import i18nInstance from '@/i18n';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  availableLanguages: string[];
  variant?: 'dropdown' | 'boxes';
}

export function LanguageSwitcher({ availableLanguages, variant = 'dropdown' }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { i18n } = useTranslation();

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
    i18nInstance.changeLanguage(lng);
    setIsOpen(false);
  };

  if (variant === 'boxes') {
    return (
      <div className="flex flex-wrap gap-2">
        {availableLanguages.map((lng) => (
          <button
            key={lng}
            onClick={() => changeLanguage(lng)}
            className={`w-12 h-10 flex items-center justify-center text-[11px] font-bold uppercase tracking-widest transition-all ${
              i18n.language === lng 
                ? 'bg-slate-900 text-white' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {lng}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 p-2 text-gray-600 hover:text-black hover:bg-gray-50 rounded-none transition-colors text-xs font-medium uppercase"
      >
        <span>{i18n.language}</span>
        <ChevronDown className="w-3 h-3" strokeWidth={1.5} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-4 w-32 bg-white rounded-none border border-slate-300 z-50 py-2 shadow-xl"
          >
            {availableLanguages.map((lng) => (
              <button
                key={lng}
                onClick={() => changeLanguage(lng)}
                className={`block w-full text-left px-5 py-2 text-sm transition-colors ${i18n.language === lng ? 'text-slate-900 font-bold bg-slate-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                {lng.toUpperCase()}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
