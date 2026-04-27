"use client";

import React from 'react';
import { Languages, Wand2, Loader2 } from 'lucide-react';
import { LocalizedString } from '@/store/useSettingsStore';

interface LocalizedSettingInputProps {
  label: string;
  value: LocalizedString;
  onChange: (newValue: LocalizedString) => void;
  languages: string[];
  type?: 'text' | 'textarea';
  onAITranslate?: () => Promise<void>;
  onAIAutoComplete?: () => Promise<void>;
  isGenerating?: boolean; // Represents "Auto-Fill" action
  isTranslating?: boolean; // Represents "Translate" action
  description?: string;
}

export function LocalizedSettingInput({
  label,
  value,
  onChange,
  languages,
  type = 'text',
  onAITranslate,
  onAIAutoComplete,
  isGenerating,
  isTranslating,
  description
}: LocalizedSettingInputProps) {
  const baseInputClasses = "w-full bg-white border border-zinc-200 px-3 py-2 text-[13px] font-medium text-zinc-900 transition-all focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 placeholder:text-zinc-500 rounded-sm";

  return (
    <div className="space-y-2 group">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest leading-none">
            {label}
          </label>
           {description && (
            <p className="text-[10px] text-zinc-500 font-medium italic">{description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {onAIAutoComplete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAIAutoComplete(); }}
              disabled={isGenerating || isTranslating}
              className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-black uppercase tracking-tighter text-indigo-600 bg-indigo-50 border border-indigo-100 rounded hover:bg-indigo-100 transition-all disabled:opacity-50"
              title="AI Magic Fill"
            >
              {isGenerating ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Wand2 className="w-2.5 h-2.5" />}
              Auto-Fill
            </button>
          )}
          {onAITranslate && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAITranslate(); }}
              disabled={isGenerating || isTranslating || !value['en']}
              className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-black uppercase tracking-tighter text-zinc-600 bg-white border border-zinc-200 rounded hover:bg-zinc-50 transition-all disabled:opacity-50"
              title="Translate English to All"
            >
              {isTranslating ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Languages className="w-2.5 h-2.5" />}
              Translate
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {languages.map(lang => (
          <div key={lang} className="relative flex items-center">
            <div className="absolute left-2.5 z-10 px-1 bg-zinc-50 border border-zinc-200 rounded text-[9px] font-black text-zinc-500 uppercase tabular-nums">
              {lang}
            </div>
            {type === 'textarea' ? (
              <textarea
                value={value[lang] || ''}
                onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
                className={`${baseInputClasses} pl-10 min-h-[80px] py-3 resize-none`}
                placeholder={`Description in ${lang.toUpperCase()}...`}
              />
            ) : (
              <input
                type="text"
                value={value[lang] || ''}
                onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
                className={`${baseInputClasses} pl-10 h-10`}
                placeholder={`Enter in ${lang.toUpperCase()}...`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
