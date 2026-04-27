'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  RefreshCcw,
  FilePlus,
  HardDrive,
  FileText,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
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
  publicUrlMissing?: boolean;
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
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ key: string, isFolder: boolean } | null>(null);

  const fetchMedia = useCallback(async (pathArr: string[] = currentPath, token?: string) => {
    const isInitial = !token;
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    const prefix = pathArr.length > 0 ? pathArr.join('/') + '/' : '';
    const url = `/api/admin/media?prefix=${encodeURIComponent(prefix)}&t=${Date.now()}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
    
    try {
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      
      if (data.error) {
        const fullMessage = data.suggestion ? `${data.error}. ${data.suggestion}` : data.error;
        throw new Error(fullMessage);
      }
      
      if (isInitial) {
        setFolders(data.folders || []);
        setAssets(data.objects || []);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        setAssets(prev => [...prev, ...(data.objects || [])]);
      }
      
      setNextToken(data.stats?.nextContinuationToken || null);
    } catch (error: unknown) {
      toast.error('Media Cloud Error: ' + (error instanceof Error ? error.message : String(error)), {
        duration: 8000
      });
    } finally {
      if (isInitial) setLoading(false);
      else setLoadingMore(false);
    }
  }, [currentPath]);

  const handleLoadMore = () => {
    if (nextToken && !loadingMore) {
      fetchMedia(currentPath, nextToken);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [currentPath, fetchMedia]);

  const handleNavigate = (path: string[]) => setCurrentPath(path);
  const enterFolder = (folderName: string) => setCurrentPath([...currentPath, folderName]);

  const sanitizeFileName = (fileName: string) => {
    const extension = fileName.split('.').pop();
    const nameWithoutExtension = fileName.split('.').slice(0, -1).join('.');
    
    // Sanitize: lowercase, remove special characters, replace spaces with hyphens
    const sanitizedName = nameWithoutExtension
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/-+/g, '-')        // Collapse multiple hyphens
      .replace(/^-|-$/g, '');     // Trim hyphens from ends
      
    return `${sanitizedName}.${extension}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    // Create a new sanitized file object
    const sanitizedName = sanitizeFileName(file.name);
    const sanitizedFile = new File([file], sanitizedName, { type: file.type });

    const formData = new FormData();
    formData.append('file', sanitizedFile);
    
    const folderPath = currentPath.length > 0 ? currentPath.join('/') : '';
    const uploadPath = folderPath ? `${folderPath}/${sanitizedName}` : sanitizedName;
    formData.append('path', uploadPath);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success(`Success: ${sanitizedName} uploaded`);
      fetchMedia();
    } catch (error: unknown) {
      toast.error('Upload failed: ' + (error instanceof Error ? error.message : String(error)));
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
      
      toast.success(isFolder ? 'Folder evacuated' : 'Asset purged');
      fetchMedia();
    } catch (error: unknown) {
      toast.error('Delete failed: ' + (error instanceof Error ? error.message : String(error)));
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
    toast.success('Path captured');
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
      {/* 1. Header - Unified with Overview */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-[18px] font-bold text-slate-900 tracking-tight">Digital Assets</h1>
          <p className="text-[12px] text-slate-500 mt-1">Cloud-native infrastructure and intelligent media management</p>
        </div>
        {!selectionMode && (
          <div className="flex items-center gap-3">
            <div className="h-10 px-4 bg-white border border-slate-300 rounded text-[13px] font-medium text-slate-600 flex items-center gap-2">
               <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Storage</span>
               <span className="text-slate-900 font-bold">{assets.length} Items</span>
            </div>
            <button 
              onClick={() => fetchMedia()}
              className="h-10 px-4 border border-slate-300 rounded text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* 2. Controls - Unified with Admin Inputs */}
      <div className="flex flex-col lg:flex-row gap-6">
         <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-slate-900 transition-colors" />
            <input 
              type="text" 
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 bg-slate-50 border border-slate-300 rounded pl-12 pr-6 text-[13px] focus:outline-none focus:border-slate-900 transition-all font-bold uppercase tracking-tight placeholder:text-slate-500"
            />
         </div>

         <label className={`flex items-center justify-center gap-2 h-11 px-8 bg-slate-900 text-white rounded text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <FilePlus className="w-4 h-4" />
            <span>{uploading ? 'Processing...' : 'Upload Asset'}</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
         </label>
      </div>

      {/* 3. Warning Banner if Public URL is missing */}
      {stats.publicUrlMissing && (
        <div className="bg-amber-50 border border-amber-200 rounded p-6 flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
           <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-amber-600" />
           </div>
           <div className="space-y-1">
              <h3 className="text-[13px] font-bold text-amber-900 uppercase tracking-widest">Public Assets Restricted</h3>
              <p className="text-[11px] text-amber-700 font-bold uppercase tracking-widest leading-relaxed max-w-2xl">
                The <span className="underline decoration-amber-300">R2 Public URL</span> is missing in your Integrations settings. Images may appear as broken icons because they are being accessed via private storage endpoints.
              </p>
              <div className="pt-2">
                <Link 
                  href="/admin/integrations" 
                  className="text-[11px] font-bold uppercase tracking-widest text-amber-900 hover:underline inline-flex items-center gap-1"
                >
                  Configure Integrations <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
           </div>
        </div>
      )}

      {/* 4. Main Card Area - Unified with Overview Cards */}
      <div className="bg-white border border-slate-300 rounded p-6 sm:p-8 min-h-[600px]">
         <Breadcrumbs currentPath={currentPath} onNavigate={handleNavigate} />
         
         <div className="mt-8">
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
                  loadingMore={loadingMore}
                  hasMore={!!nextToken}
                  onLoadMore={handleLoadMore}
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
        <div className="flex items-center gap-2 px-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
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
                <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-widest mb-2">Irreversible Action</h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                  Permanently delete this {confirmDelete.isFolder ? 'folder and ALL associated content' : 'asset from the media cloud'}?
                </p>
              </div>
              <div className="flex w-full gap-3 pt-2">
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 h-12 bg-white border border-slate-300 rounded text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 h-12 bg-rose-600 rounded text-[11px] font-bold uppercase tracking-widest text-white hover:bg-rose-700 transition-all"
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

