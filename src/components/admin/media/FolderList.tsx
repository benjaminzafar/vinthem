import React from 'react';
import { Folder, ChevronRight, Trash2 } from 'lucide-react';

interface FolderListProps {
  folders: string[];
  onNavigate: (folder: string) => void;
  onDelete: (folder: string) => void;
  selectionMode?: boolean;
}

export function FolderList({ folders, onNavigate, onDelete, selectionMode }: FolderListProps) {
  if (folders.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
      {folders.map(folder => (
        <div
          key={folder}
          role="button"
          tabIndex={0}
          className="group flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-none hover:border-slate-900 transition-all text-left cursor-pointer"
          onClick={() => onNavigate(folder)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate(folder); }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-white border border-slate-300 rounded-none flex items-center justify-center text-slate-500 group-hover:text-slate-900 transition-colors shrink-0">
              <Folder className="w-5 h-5" />
            </div>
            <div className="truncate">
              <span className="block text-sm font-bold text-slate-900 truncate tracking-tight">{folder}</span>
              <span className="block text-[10px] font-bold text-slate-500 tracking-widest mt-0.5">Directory</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!selectionMode && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(folder); }}
                className="p-2 text-slate-300 hover:text-rose-600 transition-opacity opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
          </div>
        </div>
      ))}
    </div>
  );
}
