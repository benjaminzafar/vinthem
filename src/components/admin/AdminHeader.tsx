"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, MoreVertical, LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 py-8 border-b border-gray-200/60 last:border-0">
      <div className="w-full sm:w-auto flex-shrink-0">
        <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">{title}</h2>
        {description && <p className="text-sm text-zinc-500 mt-1">{description}</p>}
      </div>
      
      <div className="flex items-center gap-2 w-full sm:flex-1 justify-end">
        {search && (
          <div className={`relative flex-1 transition-all duration-300 ease-in-out ${isSearchFocused ? 'max-w-xl' : 'max-w-[140px] sm:max-w-md'}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder={search.placeholder || "Search..."}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="pl-9 sm:pl-10 pr-4 border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 w-full bg-white text-zinc-900 border px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-md transition-colors"
            />
          </div>
        )}

        <div className="flex items-center gap-2 flex-shrink-0 ml-auto sm:ml-0">
          {primaryAction && (
            <button 
              onClick={primaryAction.onClick}
              className="flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-4 sm:px-6 py-2.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap h-[42px]"
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
                className="flex items-center justify-center bg-white text-zinc-900 border border-zinc-200 p-2.5 rounded-md hover:bg-zinc-50 transition-colors h-[42px] w-[42px]"
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
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-zinc-200 z-20 py-1 overflow-hidden"
                  >
                    {statsLabel && (
                      <div className="px-4 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 bg-zinc-50/50">
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
                            : 'text-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        <action.icon className={`w-4 h-4 ${action.variant === 'danger' ? 'text-red-400' : 'text-zinc-400'}`} />
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
