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
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-8">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="animate-pulse bg-slate-50 border border-slate-100 aspect-square rounded-[4px]" />
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 space-y-6 text-center">
        <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-200">
          <ImageIcon className="w-8 h-8" />
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">No Asset Data</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 max-w-[200px] leading-relaxed">This directory is currently awaiting your professional content.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-8">
      <AnimatePresence mode="popLayout">
        {assets.map((obj) => (
          <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            key={obj.key}
            className={`group relative cursor-pointer ${selectionMode ? 'active:scale-95' : ''}`}
            onClick={() => selectionMode && onSelect?.(obj.url)}
          >
            <div className={`aspect-square bg-slate-50 rounded-[4px] overflow-hidden border transition-all duration-500 ${selectionMode ? 'border-slate-200 hover:border-slate-900' : 'border-slate-200 hover:border-slate-900'} flex items-center justify-center relative shadow-sm hover:shadow-xl hover:shadow-slate-200/50`}>
              <Image 
                src={obj.url} 
                alt={obj.key}
                fill
                className={`object-cover transition-transform duration-700 group-hover:scale-110 ${deletingKey === obj.key ? 'opacity-20 grayscale' : ''}`}
                unoptimized 
              />
              
              {/* Premium Glassmorphic Overlay */}
              {!selectionMode && (
                <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center backdrop-blur-[2px]">
                   <div className="flex bg-white/90 backdrop-blur-md rounded-full shadow-2xl p-1 scale-90 group-hover:scale-100 transition-transform duration-300">
                      <button 
                        onClick={(e) => onCopyUrl(obj.url, obj.key, e)}
                        className="w-12 h-12 rounded-full flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-all"
                        title="Copy Link"
                      >
                        {copyingKeys.has(obj.key) ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(obj); }}
                        className="w-12 h-12 rounded-full flex items-center justify-center text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                        title="Remove Asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              )}

              {/* Deleting Overlay */}
              {deletingKey === obj.key && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                  <RefreshCcw className="w-6 h-6 animate-spin text-slate-900" />
                </div>
              )}

              {selectionMode && (
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all">
                   <div className="bg-slate-900 text-white p-2 rounded-[4px] shadow-lg">
                     <Check className="w-4 h-4" />
                   </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 px-1 flex flex-col space-y-1">
              <p className="text-[10px] text-slate-900 font-black uppercase tracking-widest truncate" title={obj.key}>
                {obj.key.split('/').pop()}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                  {formatSize(obj.size)}
                </span>
                <span className="text-[8px] text-slate-300 font-bold uppercase">
                  {new Date(obj.lastModified).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
