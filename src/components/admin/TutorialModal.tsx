"use client";
import React from 'react';
import { X } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
}

export function TutorialModal({ isOpen, onClose, title, content }: TutorialModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">{title} Setup Guide</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4 text-sm text-zinc-600 space-y-4">
          {content}
        </div>
        <div className="px-6 py-4 border-t border-zinc-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
