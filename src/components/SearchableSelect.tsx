"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  isMulti?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  isMulti = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (optionValue: string) => {
    if (isMulti) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(optionValue)) {
        onChange(currentValues.filter(v => v !== optionValue));
      } else {
        onChange([...currentValues, optionValue]);
      }
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const getSelectedLabels = () => {
    if (isMulti && Array.isArray(value)) {
      return value.map(v => options.find(o => o.value === v)?.label).filter(Boolean).join(', ');
    }
    return options.find(o => o.value === value)?.label || placeholder;
  };

  return (
    <div className="relative w-full text-slate-900" ref={containerRef}>
      <div
        className="w-full h-11 px-4 bg-white border border-slate-200 rounded-[4px] cursor-pointer flex items-center justify-between hover:border-slate-400 transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm font-medium truncate">{getSelectedLabels() || placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-slate-900' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-[4px] animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-slate-100 flex items-center bg-slate-50">
            <Search className="w-4 h-4 text-slate-500 mr-2" />
            <input
              type="text"
              className="w-full text-sm outline-none bg-transparent font-medium"
              placeholder="Filter options..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <div
                  key={option.value}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                    (isMulti && Array.isArray(value) && value.includes(option.value)) || value === option.value
                      ? 'bg-slate-900 text-white font-bold'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-xs text-slate-500 font-bold uppercase tracking-widest">
                No matches found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
