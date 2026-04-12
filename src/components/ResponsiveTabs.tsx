"use client";
import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface ResponsiveTabsProps {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (id: string) => void;
}

export const ResponsiveTabs: React.FC<ResponsiveTabsProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <>
      {/* Desktop: Horizontal Tabs */}
      <div className="hidden sm:flex w-full border-b border-zinc-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 h-[44px] text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'text-zinc-900 border-b-2 border-zinc-900'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile: Accordion Headers */}
      <div className="sm:hidden flex flex-col gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-all border border-zinc-200 rounded-md ${
              activeTab === tab.id
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-900 hover:bg-zinc-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </div>
            {activeTab === tab.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </>
  );
};
