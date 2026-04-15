import React from 'react';
import { Home, ChevronRight } from 'lucide-react';

interface BreadcrumbsProps {
  currentPath: string[];
  onNavigate: (path: string[]) => void;
}

export function Breadcrumbs({ currentPath, onNavigate }: BreadcrumbsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-6 [&::-webkit-scrollbar]:hidden">
      <button 
        onClick={() => onNavigate([])}
        className={`flex items-center gap-2 h-8 px-4 rounded-[4px] text-[10px] font-black uppercase tracking-widest transition-all ${
          currentPath.length === 0 
            ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
            : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-900 hover:text-slate-900'
        }`}
      >
        <Home className="w-3.5 h-3.5" />
        <span>Root Dashboard</span>
      </button>
      
      {currentPath.map((folder, i) => (
        <React.Fragment key={i}>
          <div className="text-slate-300">
             <ChevronRight className="w-4 h-4" />
          </div>
          <button 
            onClick={() => onNavigate(currentPath.slice(0, i + 1))}
            className={`flex items-center h-8 px-4 rounded-[4px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              i === currentPath.length - 1 
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-900 hover:text-slate-900'
            }`}
          >
            {folder}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
