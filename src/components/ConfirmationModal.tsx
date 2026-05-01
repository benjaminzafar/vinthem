"use client";
import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary' | 'success';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmLabel = 'Delete',
  confirmVariant = 'danger'
}) => {
  if (!isOpen) return null;

  const getVariantClasses = () => {
    switch (confirmVariant) {
      case 'primary':
        return 'bg-zinc-900 text-white hover:bg-zinc-800';
      case 'success':
        return 'bg-emerald-600 text-white hover:bg-emerald-700';
      case 'danger':
      default:
        return 'bg-red-600 text-white hover:bg-red-700';
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen w-full bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
      <div className="bg-white rounded-none border border-zinc-200 shadow-none w-full max-w-sm flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <h3 className="text-[15px] font-black text-zinc-900 uppercase tracking-widest leading-none">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-zinc-500 hover:text-zinc-900 transition-colors p-2 hover:bg-zinc-100 rounded-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="px-8 py-8">
          <p className="text-zinc-600 text-sm leading-relaxed mb-8 font-medium">{message}</p>
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={onClose} 
              className="flex-1 h-11 text-[11px] font-black uppercase tracking-widest bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 rounded-none-[4px] transition-all"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={() => { onConfirm(); onClose(); }} 
              className={`flex-1 h-11 text-[11px] font-black uppercase tracking-widest rounded-none-[4px] transition-all ${getVariantClasses()}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
