"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, MoreVertical, LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SecondaryAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface AdminHeaderProps {
  title: string;
  description?: string;
  primaryAction?: {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    disabled?: boolean;
  };
  secondaryActions?: SecondaryAction[];
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  statsLabel?: string;
}

export function AdminHeader({
  title,
  description,
  primaryAction,
  secondaryActions = [],
  search,
  statsLabel
}: AdminHeaderProps) {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10 py-6 border-b border-slate-200">
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
        {description && <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">{description}</p>}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
        {search && (
          <div className={`relative flex-1 sm:flex-none transition-all duration-300 ${isSearchFocused ? 'w-full sm:w-80' : 'w-full sm:w-64'}`}>
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearchFocused ? 'text-slate-900' : 'text-slate-400'}`} />
            <input 
              type="text"
              placeholder={search.placeholder || "System search..."}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="pl-11 pr-4 h-11 border-slate-200 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 w-full bg-slate-50/50 text-slate-900 border text-[14px] font-semibold rounded-xl transition-all"
            />
          </div>
        )}

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {primaryAction && (
            <button 
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className="flex-1 sm:flex-none flex items-center justify-center bg-slate-900 text-white hover:bg-slate-800 px-6 h-11 text-sm font-bold rounded-xl transition-all active:scale-95 disabled:bg-slate-200 disabled:cursor-not-allowed shadow-sm"
            >
              <primaryAction.icon className="w-4 h-4 mr-2" />
              <span>{primaryAction.label}</span>
            </button>
          )}

          {secondaryActions.length > 0 && (
            <div className="relative ml-auto sm:ml-0" ref={dropdownRef}>
              <button 
                onClick={() => setIsActionsOpen(!isActionsOpen)}
                className="flex items-center justify-center bg-white text-slate-900 border border-slate-300 h-10 w-10 rounded-md hover:bg-slate-50 transition-colors"
                title="More Actions"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {isActionsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-2rem))] sm:w-52 bg-white rounded-md border border-slate-300 z-20 py-1 overflow-hidden shadow-lg shadow-slate-900/5"
                  >
                    {statsLabel && (
                      <div className="hidden sm:block px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                        {statsLabel}
                      </div>
                    )}
                    {secondaryActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => { if (!action.disabled) { action.onClick(); setIsActionsOpen(false); } }}
                        disabled={action.disabled}
                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          action.variant === 'danger' 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <action.icon className={`w-4 h-4 ${action.variant === 'danger' ? 'text-red-400' : 'text-slate-500'}`} />
                        {action.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
