"use client";

import React, { useState } from 'react';
import { Eye, EyeOff, Check, X, ChevronDown } from 'lucide-react';

interface CredentialInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'password' | 'toggle' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
  description?: string;
}

export function CredentialInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  options,
  description
}: CredentialInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  const baseClasses = "w-full bg-white border border-zinc-200 px-3 py-2 text-[13px] font-medium text-zinc-900 transition-all focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 placeholder:text-zinc-400 rounded-sm shadow-sm";

  return (
    <div className="space-y-1.5 group">
      <div className="flex items-center justify-between px-0.5">
        <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest leading-none">
          {label}
        </label>
        {description && (
           <span className="text-[10px] text-zinc-400 font-medium italic">{description}</span>
        )}
      </div>

      <div className="relative">
        {type === 'select' ? (
          <div className="relative">
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={`${baseClasses} appearance-none pr-8 cursor-pointer hover:border-zinc-300`}
            >
              {options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        ) : type === 'toggle' ? (
          <button
            onClick={() => onChange(value === 'true' ? 'false' : 'true')}
            className={`flex items-center gap-2 px-3 py-1.5 transition-all text-[11px] font-black uppercase tracking-widest border rounded ${
              value === 'true' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]' 
                : 'bg-zinc-50 border-zinc-200 text-zinc-400'
            }`}
          >
            {value === 'true' ? (
              <><Check className="w-3.5 h-3.5" /> Activated</>
            ) : (
              <><X className="w-3.5 h-3.5" /> Deactivated</>
            )}
          </button>
        ) : (
          <>
            <input
              type={isPassword && !showPassword ? 'password' : 'text'}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || (isPassword ? '••••••••' : `Enter ${label}...`)}
              className={baseClasses}
            />
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                title={showPassword ? "Hide Secret" : "Show Secret"}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
