'use client';

import React from 'react';
import { X, Images } from 'lucide-react';
import { MediaManager } from './MediaManager';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
}

export function MediaPickerModal({ isOpen, onClose, onSelect, title = "Select Asset" }: MediaPickerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[4px] shadow-none border border-zinc-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header - Sharp & Deep */}
        <div className="px-10 py-5 border-b border-zinc-200 bg-white flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-zinc-900 rounded-[4px] flex items-center justify-center text-white shrink-0">
              <Images className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-zinc-900 uppercase tracking-widest">{title}</h3>
              <p className="text-[11px] text-zinc-500 font-bold tracking-widest uppercase mt-0.5">Media Library Assets</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors bg-zinc-50 hover:bg-zinc-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 bg-white">
          <MediaManager 
            selectionMode 
            onSelect={(url) => {
              onSelect(url);
              onClose();
            }} 
          />
        </div>

        {/* Footer - Perfectly Balanced */}
        <div className="px-10 py-5 border-t border-zinc-200 bg-zinc-50/30 flex items-center justify-between shrink-0">
           <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Select an asset from your Cloudflare R2 Cloud storage</p>
            <button 
              onClick={onClose}
              className="px-10 h-10 bg-black text-white rounded-[4px] text-[11px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all"
            >
              Dismiss
            </button>
        </div>
      </div>
    </div>
  );
}
