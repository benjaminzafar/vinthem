import React from 'react';
import { Home, ChevronRight } from 'lucide-react';

interface BreadcrumbsProps {
  currentPath: string[];
  onNavigate: (path: string[]) => void;
}

export function Breadcrumbs({ currentPath, onNavigate }: BreadcrumbsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden border-b border-slate-100 mb-8">
      <button 
        onClick={() => onNavigate([])}
        className={`flex items-center gap-2 h-9 px-3 rounded-none border transition-all text-[11px] font-bold uppercase tracking-widest ${
          currentPath.length === 0 
            ? 'bg-slate-900 text-white border-slate-900' 
            : 'bg-white border-slate-300 text-slate-500 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <Home className="w-3.5 h-3.5" />
        <span>Root</span>
      </button>
      
      {currentPath.map((folder, i) => (
        <React.Fragment key={i}>
          <div className="text-slate-300">
             <ChevronRight className="w-4 h-4" />
          </div>
          <button 
            onClick={() => onNavigate(currentPath.slice(0, i + 1))}
            className={`flex items-center h-9 px-3 rounded-none border transition-all text-[11px] font-bold tracking-widest whitespace-nowrap ${
              i === currentPath.length - 1 
                ? 'bg-slate-900 text-white border-slate-900' 
                : 'bg-white border-slate-300 text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {folder}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
