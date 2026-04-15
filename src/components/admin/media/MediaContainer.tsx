'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  RefreshCcw,
  FilePlus,
  HardDrive,
  FileText,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Breadcrumbs } from './Breadcrumbs';
import { FolderList } from './FolderList';
import { AssetGrid } from './AssetGrid';

interface Asset {
  key: string;
  size: number;
  lastModified: string;
  url: string;
}

interface MediaStats {
  totalSize: number;
  fileCount: number;
}

interface MediaContainerProps {
  onSelect?: (url: string) => void;
  selectionMode?: boolean;
}

export function MediaContainer({ onSelect, selectionMode }: MediaContainerProps) {
  const [folders, setFolders] = useState<string[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<MediaStats>({ totalSize: 0, fileCount: 0 });
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [copyingKeys, setCopyingKeys] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<{ key: string, isFolder: boolean } | null>(null);

  const fetchMedia = useCallback(async (pathArr: string[] = currentPath) => {
    setLoading(true);
    const prefix = pathArr.length > 0 ? pathArr.join('/') + '/' : '';
    
    try {
      const res = await fetch(`/api/admin/media?prefix=${encodeURIComponent(prefix)}&t=${Date.now()}`, {
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setFolders(data.folders || []);
      setAssets(data.objects || []);
      setStats(data.stats || { totalSize: 0, fileCount: 0 });
    } catch (error: any) {
      toast.error('Failed to load media: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  useEffect(() => {
    fetchMedia();
  }, [currentPath, fetchMedia]);

  const handleNavigate = (path: string[]) => setCurrentPath(path);
  const enterFolder = (folderName: string) => setCurrentPath([...currentPath, folderName]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    // Use current folder as path
    const uploadPath = currentPath.length > 0 ? currentPath.join('/') : 'uploads';
    formData.append('path', uploadPath);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success('File uploaded successfully');
      fetchMedia();
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { key, isFolder } = confirmDelete;
    
    setDeletingKey(key);
    setConfirmDelete(null);
    
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) throw new Error('Authorization required.');

      const res = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ key }),
        cache: 'no-store'
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      toast.success(isFolder ? 'Folder deleted' : 'File deleted');
      fetchMedia();
    } catch (error: any) {
      toast.error('Delete failed: ' + error.message);
    } finally {
      setDeletingKey(null);
    }
  };

  const handleCopyUrl = (url: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopyingKeys(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    toast.success('URL copied');
    setTimeout(() => {
      setCopyingKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 2000);
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(a => a.key.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [assets, searchQuery]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. Stats Row - Scandinavian Style */}
      {!selectionMode && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-300 p-6 rounded flex items-center space-x-5">
             <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded flex items-center justify-center text-slate-900 shrink-0">
               <HardDrive className="w-5 h-5" />
             </div>
             <div>
               <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-2">Folder Volume</p>
               <p className="text-2xl font-bold text-slate-900 tracking-tight">{assets.length} Files</p>
             </div>
          </div>
          <div className="bg-white border border-slate-300 p-6 rounded flex items-center space-x-5 text-slate-900">
             <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded flex items-center justify-center text-slate-900 shrink-0">
               <FileText className="w-5 h-5" />
             </div>
             <div>
               <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-2">Storage Stats</p>
               <p className="text-2xl font-bold text-slate-900 tracking-tight">Optimized</p>
             </div>
          </div>
          <div className="bg-slate-900 p-6 rounded flex items-center justify-between group">
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Infrastructure</p>
               <p className="text-sm font-bold uppercase tracking-widest text-white">Cloudflare R2</p>
             </div>
             <button 
               onClick={() => fetchMedia()}
               className="p-3 bg-white/10 rounded hover:bg-white/20 transition-all text-white"
               disabled={loading}
             >
               <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
             </button>
          </div>
        </div>
      )}

      {/* 2. Controls - Unified Search & Upload */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
         <div className="relative w-full lg:max-w-2xl group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <input 
              type="text" 
              placeholder="Filter current folder assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 bg-white border border-slate-300 rounded pl-12 pr-6 text-sm focus:outline-none focus:border-slate-900 transition-all font-medium placeholder:text-slate-400"
            />
         </div>

         <div className="flex items-center gap-3 w-full lg:w-auto">
            <label className={`flex-1 lg:flex-none flex items-center justify-center gap-2 h-11 px-8 bg-slate-900 text-white rounded text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
               <FilePlus className="w-4 h-4" />
               <span>{uploading ? 'Uploading...' : 'Quick Upload'}</span>
               <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
            </label>
         </div>
      </div>

      {/* 3. Navigation & Grid Area */}
      <div className="bg-white border border-slate-300 rounded p-6 sm:p-10 min-h-[500px]">
         <Breadcrumbs currentPath={currentPath} onNavigate={handleNavigate} />
         
         <div className="mt-6">
            {loading && assets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <RefreshCcw className="w-6 h-6 animate-spin text-slate-900" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Retrieving Asset Metadata...</p>
              </div>
            ) : (
              <>
                <FolderList 
                  folders={folders} 
                  onNavigate={enterFolder} 
                  onDelete={(fname) => setConfirmDelete({ 
                    key: [...currentPath, fname].join('/') + '/', 
                    isFolder: true 
                  })}
                  selectionMode={selectionMode}
                />
                
                <AssetGrid 
                  assets={filteredAssets}
                  loading={loading}
                  onSelect={onSelect}
                  onDelete={(asset) => setConfirmDelete({ key: asset.key, isFolder: false })}
                  onCopyUrl={handleCopyUrl}
                  deletingKey={deletingKey}
                  copyingKeys={copyingKeys}
                  selectionMode={selectionMode}
                />
              </>
            )}
         </div>
      </div>

      {/* Footer Info */}
      {!selectionMode && (
        <div className="flex items-center gap-2 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
           <AlertCircle className="w-3.5 h-3.5" />
           <span>Optimized Stream: Showing items from {currentPath.length > 0 ? `/${currentPath.join('/')}` : 'Project Root'}</span>
        </div>
      )}

      {/* Final Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded border border-slate-300 shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Irreversible Action</h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                  Permanently delete this {confirmDelete.isFolder ? 'folder and ALL associated content' : 'asset from the media cloud'}?
                </p>
              </div>
              <div className="flex w-full gap-3 pt-2">
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 h-12 bg-white border border-slate-300 rounded text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 h-12 bg-rose-600 rounded text-[11px] font-black uppercase tracking-widest text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
