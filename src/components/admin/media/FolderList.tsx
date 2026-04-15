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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 mb-8">
      {folders.map(folder => (
        <div
          key={folder}
          className="group flex flex-col items-center space-y-3 p-3 rounded transition-all border border-slate-200 hover:border-slate-400 hover:bg-slate-50 relative bg-white shadow-sm"
        >
          <button
            onClick={() => onNavigate(folder)}
            className="w-full aspect-square bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-slate-400 group-hover:text-slate-900 group-hover:bg-white transition-all relative overflow-hidden"
          >
            <Folder className="w-8 h-8" />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all">
               <ChevronRight className="w-4 h-4" />
            </div>
          </button>
          
          {/* Folder Actions */}
          {!selectionMode && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(folder); }}
              className="absolute top-1 right-1 p-1 bg-white rounded shadow-sm opacity-0 group-hover:opacity-100 transition-all text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100"
              title="Delete Folder"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-900 truncate w-full text-center px-1">
            {folder}
          </span>
        </div>
      ))}
    </div>
  );
}
