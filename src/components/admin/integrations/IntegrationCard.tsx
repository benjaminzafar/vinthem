"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, HelpCircle, Save, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface IntegrationCardProps {
  id: string;
  title: string;
  logo: React.ReactNode;
  isConnected: boolean;
  onSave: () => Promise<void>;
  isSaving: boolean;
  tutorial?: React.ReactNode;
  children: React.ReactNode;
}

export function IntegrationCard({
  id,
  title,
  logo,
  isConnected,
  onSave,
  isSaving,
  tutorial,
  children
}: IntegrationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <motion.div 
      layout
      className="bg-white border-none shadow-none rounded-md overflow-hidden flex flex-col hover:bg-zinc-50/10 transition-all"
    >
      <div 
        className="px-6 py-4 cursor-pointer flex items-center justify-between bg-zinc-50/10"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded border border-zinc-200 bg-white flex items-center justify-center p-1.5 transition-shadow">
            {logo}
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 leading-none tracking-tight">{title}</h3>
            <div className="mt-1.5 flex items-center gap-1.5">
               <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-zinc-300'}`} />
               <span className={`text-[10px] font-bold uppercase tracking-wider ${isConnected ? 'text-emerald-600' : 'text-zinc-400'}`}>
                {isConnected ? 'Active & Encrypted' : 'Requires Setup'}
               </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {tutorial && (
            <button 
              onClick={(e) => { e.stopPropagation(); setShowTutorial(!showTutorial); }}
              className={`p-1.5 rounded-md transition-colors ${showTutorial ? 'bg-zinc-100 text-brand-ink' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'}`}
              title="View Documentation"
            >
              <HelpCircle className="w-4 h-4" />
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
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-visible"
          >
            <div className="px-6 py-6 border-t border-zinc-100 space-y-5">
              {children}
            </div>
            
            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
               <div className="text-[11px] text-zinc-400 font-medium tracking-tight">
                  {isConnected ? 'All credentials are AES-256 protected' : 'Pending synchronization'}
               </div>
               <button
                onClick={(e) => { e.stopPropagation(); onSave(); }}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-all font-bold text-[13px] tracking-tight disabled:opacity-50 shadow-sm"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {isSaving ? 'Syncing...' : 'Update Settings'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTutorial && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-zinc-100 border-t border-zinc-200 px-6 py-5"
          >
             <div className="flex items-center justify-between mb-3 border-b border-zinc-200 pb-2">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Configuration Guide</span>
                <button onClick={() => setShowTutorial(false)} className="text-zinc-400 hover:text-zinc-900 font-black text-lg leading-none">&times;</button>
             </div>
             <div className="text-[13px] leading-relaxed text-zinc-600 font-medium">
                {tutorial}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
