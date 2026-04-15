import React from 'react';
import { Home, ChevronRight } from 'lucide-react';

interface BreadcrumbsProps {
  currentPath: string[];
  onNavigate: (path: string[]) => void;
}

export function Breadcrumbs({ currentPath, onNavigate }: BreadcrumbsProps) {
  return (
    <div className="flex items-center space-x-3 text-[11px] font-bold uppercase tracking-widest text-slate-500 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden">
      <button 
        onClick={() => onNavigate([])}
        className={`flex items-center space-x-2 transition-colors shrink-0 ${currentPath.length === 0 ? 'text-slate-900' : 'hover:text-slate-900'}`}
      >
        <Home className="w-3.5 h-3.5" />
        <span>Root</span>
      </button>
      
      {currentPath.map((folder, i) => (
        <React.Fragment key={i}>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-300" />
          <button 
            onClick={() => onNavigate(currentPath.slice(0, i + 1))}
            className={`transition-colors whitespace-nowrap shrink-0 ${i === currentPath.length - 1 ? 'text-slate-900' : 'hover:text-slate-900'}`}
          >
            {folder}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
