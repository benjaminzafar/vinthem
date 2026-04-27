"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Save, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface SettingCardProps {
  id: string;
  title: string;
  icon: React.ElementType;
  onSave?: () => Promise<void>;
  isSaving?: boolean;
  tutorial?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export function SettingCard({
  id,
  title,
  icon: Icon,
  onSave,
  isSaving,
  tutorial,
  children,
  defaultExpanded = false
}: SettingCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <motion.div 
      layout
      className="bg-white border-none shadow-none rounded-md overflow-hidden flex flex-col hover:bg-zinc-50/10 transition-all border-b border-zinc-50"
    >
      <div 
        className="px-6 py-4 cursor-pointer flex items-center justify-between bg-zinc-50/10"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center transition-shadow">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 leading-none tracking-tight">{title}</h3>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {tutorial && (
            <button 
              onClick={(e) => { e.stopPropagation(); setShowTutorial(!showTutorial); }}
              className={`p-1.5 rounded-md transition-colors ${showTutorial ? 'bg-zinc-100 text-brand-ink' : 'text-zinc-500 hover:text-zinc-600 hover:bg-zinc-100'}`}
              title="View Guide"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-zinc-100 transition-colors">
            {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-visible"
          >
            <div className="px-6 py-6 border-t border-zinc-100/50 space-y-6">
              {children}
            </div>
            
            {onSave && (
              <div className="px-6 py-4 border-t border-zinc-100/50 bg-zinc-50/20 flex justify-end items-center">
                 <button
                  onClick={(e) => { e.stopPropagation(); onSave(); }}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-all font-bold text-[12px] tracking-tight disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  {isSaving ? 'Synchronizing...' : 'Save Section'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTutorial && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-zinc-50/50 border-t border-zinc-100 px-6 py-5"
          >
             <div className="flex items-center justify-between mb-3 border-b border-zinc-100 pb-2">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Configuration Insight</span>
                <button onClick={() => setShowTutorial(false)} className="text-zinc-500 hover:text-zinc-900 font-black text-lg leading-none transition-colors">&times;</button>
             </div>
             <div className="text-[12px] leading-relaxed text-zinc-500 font-medium">
                {tutorial}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
