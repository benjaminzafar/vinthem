"use client";
import React, { useState, useEffect } from 'react';
import { ref, listAll, getMetadata, deleteObject, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Trash2, Image as ImageIcon, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function MediaCenter() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageUsage, setStorageUsage] = useState(0);

  const fetchFiles = async () => {
    setLoading(true);
    console.log('Fetching files...');
    
    try {
      const storageRef = ref(storage);
      console.log('Storage ref created:', storageRef.fullPath);
      
      const result = await listAll(storageRef);
      console.log('listAll result:', result);
      
      const items = result.items;
      
      if (items.length === 0) {
        setFiles([]);
        setStorageUsage(0);
        setLoading(false);
        return;
      }

      let totalSize = 0;
      const fileDetails = [];
      
      // Process in batches to avoid rate limiting
      const BATCH_SIZE = 3;
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        if (i > 0) await delay(1000); // 1000ms delay between batches
        const batch = items.slice(i, i + BATCH_SIZE);
        const batchDetails = await Promise.all(batch.map(async (itemRef: any) => {
          try {
            // Use a timeout for metadata and download URL to avoid hanging
            const metadataPromise = getMetadata(itemRef);
            const urlPromise = getDownloadURL(itemRef);
            
            const [metadata, url] = await Promise.all([metadataPromise, urlPromise]);
            
            return {
              name: itemRef.name,
              size: metadata.size,
              contentType: metadata.contentType,
              url,
              ref: itemRef
            };
          } catch (error) {
            console.error(`Error fetching details for ${itemRef.name}:`, error);
            return null;
          }
        }));
        
        const successfulDetails = batchDetails.filter(detail => detail !== null);
        fileDetails.push(...successfulDetails);
        totalSize += successfulDetails.reduce((sum, file) => sum! + file!.size, 0);
      }
      
      setFiles(fileDetails);
      setStorageUsage(totalSize);
    } catch (error: any) {
      console.error('Error fetching files:', error);
      if (error.code === 'storage/retry-limit-exceeded') {
        toast.error('Storage connection timed out. Please check your internet or Firebase setup.');
      } else {
        toast.error('Failed to load media files: ' + (error.message || String(error)));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDelete = async (fileRef: any) => {
    try {
      await deleteObject(fileRef);
      toast.success('File deleted');
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
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
              <img src={file.url} alt={file.name} className="w-full h-32 object-cover rounded" referrerPolicy="no-referrer" />
              <p className="text-xs truncate" title={file.name}>{file.name}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{formatSize(file.size)}</span>
                <button onClick={() => handleDelete(file.ref)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
