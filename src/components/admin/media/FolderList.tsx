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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-12">
      {folders.map(folder => (
        <div
          key={folder}
          className="group flex flex-col p-4 bg-white border border-slate-200 rounded-[4px] hover:border-slate-900 transition-all cursor-pointer relative overflow-hidden"
          onClick={() => onNavigate(folder)}
        >
          {/* Vertical Accent Line */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-100 group-hover:bg-slate-900 transition-colors" />
          
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-[4px] flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-all">
              <Folder className="w-5 h-5" />
            </div>
            
            {!selectionMode && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(folder); }}
                className="p-2 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-1">
            <span className="block text-[10px] font-black text-slate-900 uppercase tracking-widest truncate">
              {folder}
            </span>
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Directory
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between text-slate-300 group-hover:text-slate-900 transition-colors">
             <div className="h-[2px] w-8 bg-current opacity-20" />
             <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      ))}
    </div>
  );
}
