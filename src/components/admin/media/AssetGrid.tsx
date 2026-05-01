import React from 'react';
import Image from 'next/image';
import { Trash2, Copy, Check, ImageIcon, RefreshCcw } from 'lucide-react';
import { toMediaProxyUrl } from '@/lib/media';

interface Asset {
  key: string;
  url: string;
  size: number;
  lastModified: string;
}

interface AssetGridProps {
  assets: Asset[];
  loading: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
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
  loadingMore,
  hasMore,
  onLoadMore,
  onSelect, 
  onDelete, 
  onCopyUrl, 
  deletingKey, 
  copyingKeys, 
  selectionMode 
}: AssetGridProps) {
  const observerTarget = React.useRef(null);
  const [brokenKeys, setBrokenKeys] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          onLoadMore?.();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, onLoadMore]);

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
          <div key={i} className="bg-slate-50 border border-slate-200 aspect-square rounded relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(248,250,252,0.45),rgba(241,245,249,0.9),rgba(248,250,252,0.45))] bg-[length:200%_100%] animate-[shimmer_2.2s_linear_infinite]" />
          </div>
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
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {assets.map((obj) => {
          const mediaUrl = toMediaProxyUrl(obj.url);
          const isBroken = brokenKeys.has(obj.key);
          return (
            <div
              key={obj.key}
              className={`group relative cursor-pointer ${selectionMode ? 'active:scale-95' : ''}`}
              onClick={() => selectionMode && onSelect?.(mediaUrl)}
            >
              <div className={`aspect-square bg-slate-50 rounded overflow-hidden border transition-all ${selectionMode ? 'border-slate-300 hover:border-slate-900' : 'border-slate-300 hover:border-slate-900'} flex items-center justify-center relative`}>
                {!isBroken ? (
                  <Image
                    src={mediaUrl} 
                    alt={obj.key}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                    className={`absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105 ${deletingKey === obj.key ? 'opacity-20 grayscale' : ''}`}
                    onError={() => {
                      setBrokenKeys((previous) => {
                        const next = new Set(previous);
                        next.add(obj.key);
                        return next;
                      });
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),rgba(248,250,252,0.98))] p-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Preview unavailable</p>
                      <p className="text-[11px] text-slate-400">The file is still addressable even though the preview failed.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(event) => onCopyUrl(mediaUrl, obj.key, event)}
                        className="inline-flex h-8 items-center justify-center gap-1 rounded border border-slate-200 bg-white px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 transition-all hover:border-slate-900 hover:text-slate-900"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </button>
                      {!selectionMode && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onDelete(obj);
                          }}
                          className="inline-flex h-8 items-center justify-center gap-1 rounded bg-rose-600 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white transition-all hover:bg-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Refined Action Overlay - Match Admin Style */}
                {!selectionMode && !isBroken && (
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                     <button 
                       onClick={(e) => onCopyUrl(mediaUrl, obj.key, e)}
                       className="w-10 h-10 bg-white rounded flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-all"
                       title="Copy Link"
                     >
                       {copyingKeys.has(obj.key) ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                     </button>
                     <button 
                       onClick={(e) => { e.stopPropagation(); onDelete(obj); }}
                       className="w-10 h-10 bg-white rounded flex items-center justify-center text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                       title="Delete"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                )}

                {deletingKey === obj.key && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 z-20">
                    <div className="h-10 w-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                      Removing
                    </span>
                  </div>
                )}

                {selectionMode && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all">
                     <div className="bg-slate-900 text-white p-1.5 rounded">
                       <Check className="w-4 h-4" />
                     </div>
                  </div>
                )}
              </div>
              
              <div className="mt-3 px-1 space-y-0.5">
                <p className="text-[11px] text-slate-900 font-bold tracking-tight truncate" title={obj.key}>
                  {obj.key.split('/').pop()?.replace(/^\d{13}_/, '')}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold tracking-widest">
                    {formatSize(obj.size)}
                  </span>
                  <span className="text-[9px] text-slate-500 font-medium">
                    {new Date(obj.lastModified).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        
        {loadingMore && (
          <>
            {[...Array(6)].map((_, i) => (
              <div key={`loading-more-${i}`} className="bg-slate-50 border border-slate-200 aspect-square rounded relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(248,250,252,0.45),rgba(241,245,249,0.9),rgba(248,250,252,0.45))] bg-[length:200%_100%] animate-[shimmer_2.2s_linear_infinite]" />
              </div>
            ))}
          </>
        )}
      </div>

      {hasMore && (
        <div 
          ref={observerTarget} 
          className="h-10 flex items-center justify-center"
        >
          {loadingMore && (
            <div className="w-full max-w-md rounded border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center">
                  <RefreshCcw className="w-3.5 h-3.5 text-slate-600" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Asset stream</p>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-1/3 rounded-full bg-slate-300 animate-[shimmer_1.8s_linear_infinite]" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
