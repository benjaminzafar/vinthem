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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-gray-200/60 shadow-xl w-full max-w-sm flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-3 py-2 h-[52px] border-b border-zinc-200 bg-zinc-50/50">
          <h3 className="text-[16px] font-semibold text-zinc-900 tracking-tight">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors h-[36px] w-[36px] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="px-4 py-3 bg-zinc-50/30">
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="pt-4 border-t border-zinc-200 flex gap-3">
            <button onClick={onClose} className="flex-1 flex items-center justify-center bg-white text-zinc-900 hover:bg-zinc-50 border border-zinc-200 px-6 h-[44px] text-sm font-medium rounded-md transition-colors">Cancel</button>
            <button 
              onClick={() => { onConfirm(); onClose(); }} 
              className={`flex-1 flex items-center justify-center border border-transparent px-6 h-[44px] text-sm font-medium rounded-md transition-colors ${getVariantClasses()}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
