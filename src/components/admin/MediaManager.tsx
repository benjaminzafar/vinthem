'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  ExternalLink, 
  Copy, 
  FileText, 
  HardDrive, 
  FilePlus,
  RefreshCcw,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Folder,
  ChevronRight,
  Home,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

interface R2Object {
  key: string;
  size: number;
  lastModified: string;
  url: string;
}

interface MediaStats {
  totalSize: number;
  fileCount: number;
}

interface MediaManagerProps {
  onSelect?: (url: string) => void;
  selectionMode?: boolean;
}

export function MediaManager({ onSelect, selectionMode }: MediaManagerProps) {
  const [objects, setObjects] = useState<R2Object[]>([]);
  const [stats, setStats] = useState<MediaStats>({ totalSize: 0, fileCount: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copyingKeys, setCopyingKeys] = useState<Set<string>>(new Set());
  const [currentPath, setCurrentPath] = useState<string[]>([]);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/media');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setObjects(data.objects || []);
      setStats(data.stats || { totalSize: 0, fileCount: 0 });
    } catch (error: any) {
      toast.error('Failed to load media: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Folder & File logic
  const { currentFiles, currentFolders } = useMemo(() => {
    const prefix = currentPath.length > 0 ? currentPath.join('/') + '/' : '';
    
    const folders = new Set<string>();
    const files: R2Object[] = [];

    objects.forEach(obj => {
      if (obj.key.startsWith(prefix)) {
        const relativePath = obj.key.slice(prefix.length);
        const parts = relativePath.split('/');
        
        if (parts.length > 1) {
          folders.add(parts[0]);
        } else if (parts[0]) {
          files.push(obj);
        }
      }
    });

    return {
      currentFiles: files,
      currentFolders: Array.from(folders).sort()
    };
  }, [objects, currentPath]);

  const handleDelete = async (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this file? This cannot be undone.')) return;

    try {
      const res = await fetch('/api/admin/media', {
        method: 'DELETE',
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      toast.success('File deleted successfully');
      fetchMedia();
    } catch (error: any) {
      toast.error('Delete failed: ' + error.message);
    }
  };

  const handleCopyUrl = (url: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    const next = new Set(copyingKeys);
    next.add(key);
    setCopyingKeys(next);
    toast.success('URL copied to clipboard');
    setTimeout(() => {
      const prev = new Set(copyingKeys);
      prev.delete(key);
      setCopyingKeys(prev);
    }, 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    // Use current folder as path if possible
    const uploadPath = currentPath.length > 0 ? currentPath.join('/') : 'uploads';
    formData.append('path', uploadPath);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
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

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = currentFiles.filter(obj => 
    obj.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navigateTo = (folder: string) => setCurrentPath([...currentPath, folder]);
  const goUp = () => setCurrentPath(currentPath.slice(0, -1));
  const goToRoot = () => setCurrentPath([]);

  return (
    <div className={`space-y-8 animate-in fade-in duration-500 ${selectionMode ? 'p-1' : ''}`}>
      {/* Header & Stats (Hidden in selection mode) */}
      {!selectionMode && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded border border-slate-300">
            <div className="flex items-center space-x-5">
              <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded flex items-center justify-center text-slate-900 shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Storage Used</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatSize(stats.totalSize)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded border border-slate-300">
            <div className="flex items-center space-x-5">
              <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded flex items-center justify-center text-slate-900 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Total Assets</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.fileCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded flex items-center justify-between text-white relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Infrastructure</p>
              <p className="text-sm font-bold uppercase tracking-widest text-white">Cloudflare R2</p>
            </div>
            <button 
              onClick={fetchMedia}
              className="p-3 bg-white/10 rounded hover:bg-white/20 transition-all relative z-10"
              disabled={loading}
            >
              <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="relative w-full md:max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search assets in current folder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded pl-12 pr-6 h-10 text-sm focus:outline-none focus:border-slate-900 transition-all placeholder:text-slate-400 text-slate-900 font-medium"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <label className={`
            flex-1 md:flex-none flex items-center justify-center space-x-3 px-8 h-10 bg-slate-900 text-white rounded text-sm font-medium hover:bg-slate-800 transition-all cursor-pointer
            ${uploading ? 'opacity-50 pointer-events-none' : ''}
          `}>
            <FilePlus className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Media'}</span>
            <input 
              type="file" 
              className="hidden" 
              onChange={handleFileUpload}
              disabled={uploading}
              accept="image/*"
            />
          </label>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center space-x-3 text-[11px] font-bold uppercase tracking-widest text-slate-500 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
        <button 
          onClick={goToRoot}
          className={`flex items-center space-x-2 transition-colors ${currentPath.length === 0 ? 'text-slate-900' : 'hover:text-slate-900'}`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Root</span>
        </button>
        {currentPath.map((folder, i) => (
          <React.Fragment key={i}>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-300" />
            <button 
              onClick={() => setCurrentPath(currentPath.slice(0, i + 1))}
              className={`transition-colors whitespace-nowrap ${i === currentPath.length - 1 ? 'text-slate-900' : 'hover:text-slate-900'}`}
            >
              {folder}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Media Grid */}
      <div className={`${selectionMode ? '' : 'bg-white rounded border border-slate-300 p-8 sm:p-12'} min-h-[400px]`}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-5">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Accessing R2 storage...</p>
          </div>
        ) : (currentFolders.length === 0 && filteredFiles.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-6 text-center">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-300">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-900">No assets in this folder</p>
              <p className="text-xs text-slate-500 font-medium mt-2">Upload a new file or navigate higher.</p>
              {currentPath.length > 0 && (
                <button 
                  onClick={goUp}
                  className="mt-6 px-6 h-10 border border-slate-300 rounded text-[11px] font-bold uppercase tracking-widest hover:border-slate-900 hover:text-slate-900 transition-all flex items-center justify-center mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-2" />
                  Go Up
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={`grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6`}>
            {/* Folder Icons */}
            {currentFolders.map(folder => (
              <button
                key={folder}
                onClick={() => navigateTo(folder)}
                className="group flex flex-col items-center space-y-3 p-2 rounded transition-all border border-transparent hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="w-full aspect-square bg-slate-50 border border-slate-200 rounded flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-all relative overflow-hidden">
                  <Folder className="w-10 h-10" />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all">
                     <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-900 truncate w-full text-center">
                  {folder}
                </span>
              </button>
            ))}

            {/* Files */}
            <AnimatePresence mode="popLayout">
              {filteredFiles.map((obj) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={obj.key}
                  className={`group relative cursor-pointer ${selectionMode ? 'active:scale-95' : ''}`}
                  onClick={() => selectionMode && onSelect?.(obj.url)}
                >
                  <div className={`aspect-square bg-slate-50 rounded overflow-hidden border transition-all ${selectionMode ? 'border-slate-200 hover:border-slate-900 group-hover:border-2' : 'border-slate-200 hover:border-slate-400'} flex items-center justify-center relative`}>
                    <Image 
                      src={obj.url} 
                      alt={obj.key}
                      fill
                      className="object-cover transition-transform group-hover:scale-110"
                      unoptimized 
                    />
                    
                    {/* Overlay Actions */}
                    {!selectionMode && (
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center space-y-3 backdrop-blur-sm">
                         <div className="flex space-x-2">
                           <button 
                             onClick={(e) => handleCopyUrl(obj.url, obj.key, e)}
                             className="w-10 h-10 bg-white rounded flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-lg"
                             title="Copy URL"
                           >
                             {copyingKeys.has(obj.key) ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                           </button>
                           <button 
                             onClick={(e) => handleDelete(obj.key, e)}
                             className="w-10 h-10 bg-white rounded flex items-center justify-center text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-lg"
                             title="Delete"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                      </div>
                    )}

                    {selectionMode && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all">
                         <div className="bg-slate-900 text-white p-1.5 rounded-sm">
                           <Check className="w-3.5 h-3.5" />
                         </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 px-1">
                    <p className="text-[10px] text-slate-900 font-bold uppercase tracking-widest truncate" title={obj.key}>
                      {obj.key.split('/').pop()}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">{formatSize(obj.size)}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {!selectionMode && (
        <div className="flex items-center space-x-2 text-slate-400 text-[11px] font-bold uppercase tracking-widest px-2">
           <AlertCircle className="w-3.5 h-3.5" />
           <p>Media Assets Managed via Cloudflare Infrastructure</p>
        </div>
      )}
    </div>
  );
}
