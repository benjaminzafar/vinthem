"use client";
import React from 'react';

export function PrintLabelButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
    >
      Confirm & Print Label
    </button>
  );
}
