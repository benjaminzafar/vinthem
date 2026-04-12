"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';

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
    <div className="relative w-full" ref={containerRef}>
      <div
        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm truncate">{getSelectedLabels() || placeholder}</span>
        <ChevronDown className="w-4 h-4 text-zinc-400" />
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-lg">
          <div className="p-2 border-b border-zinc-100 flex items-center">
            <Search className="w-4 h-4 text-zinc-400 mr-2" />
            <input
              type="text"
              className="w-full text-sm outline-none"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.map(option => (
              <div
                key={option.value}
                className={`px-4 py-2 text-sm cursor-pointer hover:bg-zinc-100 ${
                  (isMulti && Array.isArray(value) && value.includes(option.value)) || value === option.value
                    ? 'bg-zinc-50 font-medium'
                    : ''
                }`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
