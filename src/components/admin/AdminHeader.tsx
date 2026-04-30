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
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 sm:gap-5 mb-6 py-4 sm:py-6 border-b border-slate-300 last:border-0">
      <div className="w-full xl:w-auto flex-shrink-0">
        <h2 className="text-[18px] sm:text-[20px] font-semibold text-slate-900 tracking-tight">{title}</h2>
        {description && <p className="text-[12px] sm:text-[13px] text-slate-500 mt-1.5 max-w-2xl">{description}</p>}
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full xl:w-auto mt-1 sm:mt-0">
        {search && (
          <div className={`relative flex-1 min-w-0 sm:min-w-[260px] transition-all duration-300 ${isSearchFocused ? 'xl:w-80' : 'xl:w-72'}`}>
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearchFocused ? 'text-slate-900' : 'text-slate-500'}`} />
            <input 
              type="text"
              placeholder={search.placeholder || "System search..."}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="pl-10 pr-4 h-10 border-slate-300 focus:outline-none focus:border-slate-900 w-full bg-white text-slate-900 border text-sm font-medium rounded-md transition-colors"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2 flex-wrap sm:flex-nowrap flex-shrink-0 w-full sm:w-auto sm:ml-auto xl:ml-0">
          {primaryAction && (
            <button 
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className="flex-1 sm:flex-none min-w-[140px] flex items-center justify-center bg-slate-900 text-white hover:bg-slate-800 border border-transparent px-4 sm:px-6 h-10 text-sm font-medium rounded-md transition-colors whitespace-nowrap disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              <primaryAction.icon className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{primaryAction.label}</span>
              <span className="sm:hidden">{primaryAction.label.split(' ')[0]}</span>
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
