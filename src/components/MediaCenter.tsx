"use client";
import React, { useState, useEffect } from 'react';
import { Trash2, Image as ImageIcon, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';

type MediaFile = {
  name: string;
  size: number;
  contentType?: string;
  url: string;
  id: string | null;
};

export function MediaCenter() {
  const supabase = createClient();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageUsage, setStorageUsage] = useState(0);

  const fetchFiles = async () => {
    setLoading(true);
    
    try {
      // Supabase storage list
      const { data, error } = await supabase
        .storage
        .from('uploads')
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'desc' },
        });

      if (error) throw error;

      if (!data || data.length === 0) {
        setFiles([]);
        setStorageUsage(0);
        setLoading(false);
        return;
      }

      let totalSize = 0;
      const fileDetails: MediaFile[] = data.map(file => {
        const { data: { publicUrl } } = supabase
          .storage
          .from('uploads')
          .getPublicUrl(file.name);

        totalSize += file.metadata?.size || 0;

        return {
          name: file.name,
          size: file.metadata?.size || 0,
          contentType: file.metadata?.mimetype,
          url: publicUrl,
          id: file.id ?? null
        };
      });
      
      setFiles(fileDetails);
      setStorageUsage(totalSize);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error fetching files:', error);
      toast.error('Failed to load media files: ' + message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDelete = async (fileName: string) => {
    const toastId = toast.loading('Deleting file...');
    try {
      const { error } = await supabase
        .storage
        .from('uploads')
        .remove([fileName]);
      
      if (error) throw error;
      
      toast.success('File deleted', { id: toastId });
      fetchFiles();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown delete error';
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file: ' + message, { id: toastId });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Media Center</h2>
        <button onClick={fetchFiles} className="p-2 text-gray-500 hover:text-indigo-600">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
      
      <div className="py-8 border-b border-gray-200/60 last:border-0">
        <p className="text-sm text-gray-600">Total Storage Used: {formatSize(storageUsage)}</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {files.map((file) => (
            <div key={file.name} className="border border-gray-200 rounded-lg p-2 space-y-2">
                <div className="relative w-full h-32 overflow-hidden rounded">
                  <Image src={file.url} alt={file.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                </div>
              <p className="text-xs truncate" title={file.name}>{file.name}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{formatSize(file.size)}</span>
                <button onClick={() => handleDelete(file.name)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {files.length === 0 && !loading && (
             <div className="col-span-full py-20 text-center text-zinc-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No media files found in 'uploads' bucket.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
