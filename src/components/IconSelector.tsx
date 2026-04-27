"use client";
import React, { useState, useMemo } from 'react';
import { icons as lucideIcons } from 'lucide-react';
import * as mdIcons from 'react-icons/md';
import * as faIcons from 'react-icons/fa';
import * as giIcons from 'react-icons/gi';
import { Search, X } from 'lucide-react';

const allIcons: Record<string, React.ElementType> = {
  ...lucideIcons,
  ...mdIcons,
  ...faIcons,
  ...giIcons
};

const allIconNames = Object.keys(allIcons);

interface IconSelectorProps {
  onSelect: (iconName: string) => void;
  onClose: () => void;
}

export const IconSelector: React.FC<IconSelectorProps> = ({ onSelect, onClose }) => {
  const [search, setSearch] = useState('');

  const iconNames = useMemo(() => {
    if (!search) return allIconNames.slice(0, 100); // Show first 100 by default
    const lowerSearch = search.toLowerCase();
    return allIconNames.filter(name => name.toLowerCase().includes(lowerSearch)).slice(0, 100);
  }, [search]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-lg border border-gray-200/60 shadow-xl w-full max-w-[600px] max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-3 py-2 h-[52px] border-b border-zinc-200 bg-zinc-50/50">
          <h3 className="text-[16px] font-semibold text-zinc-900 tracking-tight">Select Icon</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors h-[36px] w-[36px] flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 border-b border-zinc-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
              autoFocus
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-zinc-50/30">
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
            {iconNames.map(name => {
              const IconComponent = allIcons[name];
              return (
                <button
                  key={name}
                  onClick={() => {
                    onSelect(name);
                    onClose();
                  }}
                  className="flex flex-col items-center justify-center p-2 hover:bg-zinc-100 rounded-md transition-colors border border-transparent hover:border-zinc-200 group"
                  title={name}
                >
                  <IconComponent className="w-6 h-6 text-zinc-600 group-hover:text-zinc-900" />
                </button>
              );
            })}
            {iconNames.length === 0 && (
              <div className="col-span-full text-center py-8 text-zinc-500 text-sm">
                No icons found matching "{search}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
