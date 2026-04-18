"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, MoreVertical, LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SecondaryAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface AdminHeaderProps {
  title: string;
  description?: string;
  primaryAction?: {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
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
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 py-8 border-b border-slate-300 last:border-0">
      <div className="w-full sm:w-auto flex-shrink-0">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>

      <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
        {search && (
          <div className={`relative flex-1 sm:w-64 transition-all duration-300 ${isSearchFocused ? 'sm:w-80' : ''}`}>
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearchFocused ? 'text-slate-900' : 'text-slate-400'}`} />
            <input 
              type="text"
              placeholder={search.placeholder || "System search..."}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="pl-10 pr-4 h-10 border-slate-300 focus:outline-none focus:border-slate-900 w-full bg-white text-slate-900 border text-sm font-medium rounded transition-colors"
            />
          </div>
        )}

        <div className="flex items-center gap-2 flex-shrink-0 ml-auto sm:ml-0">
          {primaryAction && (
            <button 
              onClick={primaryAction.onClick}
              className="flex items-center justify-center bg-slate-900 text-white hover:bg-slate-800 border border-transparent px-6 h-10 text-sm font-medium rounded transition-colors whitespace-nowrap"
            >
              <primaryAction.icon className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{primaryAction.label}</span>
              <span className="sm:hidden">{primaryAction.label.split(' ')[0]}</span>
            </button>
          )}

          {secondaryActions.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsActionsOpen(!isActionsOpen)}
                className="flex items-center justify-center bg-white text-slate-900 border border-slate-300 h-10 w-10 rounded hover:bg-slate-50 transition-colors"
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
                    className="absolute right-0 mt-2 w-48 bg-white rounded border border-slate-300 z-20 py-1 overflow-hidden"
                  >
                    {statsLabel && (
                      <div className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                        {statsLabel}
                      </div>
                    )}
                    {secondaryActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => { action.onClick(); setIsActionsOpen(false); }}
                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${
                          action.variant === 'danger' 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <action.icon className={`w-4 h-4 ${action.variant === 'danger' ? 'text-red-400' : 'text-slate-400'}`} />
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
