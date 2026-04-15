import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Copy, Check, ImageIcon, RefreshCcw } from 'lucide-react';

interface Asset {
  key: string;
  url: string;
  size: number;
  lastModified: string;
}

interface AssetGridProps {
  assets: Asset[];
  loading: boolean;
  onSelect?: (url: string) => void;
  onDelete: (asset: Asset) => void;
  onCopyUrl: (url: string, key: string, e: React.MouseEvent) => void;
  deletingKey: string | null;
  copyingKeys: Set<string>;
  selectionMode?: boolean;
}

export function AssetGrid({ 
  assets, 
  loading, 
  onSelect, 
  onDelete, 
  onCopyUrl, 
  deletingKey, 
  copyingKeys, 
  selectionMode 
}: AssetGridProps) {
  
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading && assets.length === 0) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="animate-pulse bg-slate-50 border border-slate-200 aspect-square rounded" />
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-lg text-center bg-slate-50/50">
        <div className="w-12 h-12 bg-white border border-slate-300 rounded-full flex items-center justify-center text-slate-300 mb-4">
          <ImageIcon className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-900 tracking-tight">Empty Directory</p>
        <p className="text-xs text-slate-500 mt-1">Upload assets to populate this folder.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
      <AnimatePresence mode="popLayout">
        {assets.map((obj) => (
          <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            key={obj.key}
            className={`group relative cursor-pointer ${selectionMode ? 'active:scale-95' : ''}`}
            onClick={() => selectionMode && onSelect?.(obj.url)}
          >
            <div className={`aspect-square bg-slate-50 rounded overflow-hidden border transition-all ${selectionMode ? 'border-slate-300 hover:border-slate-900' : 'border-slate-300 hover:border-slate-900'} flex items-center justify-center relative`}>
              <Image 
                src={obj.url} 
                alt={obj.key}
                fill
                className={`object-cover transition-transform group-hover:scale-105 ${deletingKey === obj.key ? 'opacity-20 grayscale' : ''}`}
                unoptimized 
              />
              
              {/* Refined Action Overlay - Match Admin Style */}
              {!selectionMode && (
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                   <button 
                     onClick={(e) => onCopyUrl(obj.url, obj.key, e)}
                     className="w-10 h-10 bg-white rounded shadow-lg flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-all"
                     title="Copy Link"
                   >
                     {copyingKeys.has(obj.key) ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); onDelete(obj); }}
                     className="w-10 h-10 bg-white rounded shadow-lg flex items-center justify-center text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                     title="Delete"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              )}

              {deletingKey === obj.key && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                  <RefreshCcw className="w-6 h-6 animate-spin text-slate-900" />
                </div>
              )}

              {selectionMode && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all">
                   <div className="bg-slate-900 text-white p-1.5 rounded shadow-lg">
                     <Check className="w-4 h-4" />
                   </div>
                </div>
              )}
            </div>
            
            <div className="mt-3 px-1 space-y-0.5">
              <p className="text-[11px] text-slate-900 font-bold uppercase tracking-tight truncate" title={obj.key}>
                {obj.key.split('/').pop()}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  {formatSize(obj.size)}
                </span>
                <span className="text-[9px] text-slate-400 font-medium">
                  {new Date(obj.lastModified).toLocaleDateString()}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
