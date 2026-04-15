'use client';

import React from 'react';
import { MediaContainer } from './media/MediaContainer';

interface MediaManagerProps {
  onSelect?: (url: string) => void;
  selectionMode?: boolean;
}

export function MediaManager({ onSelect, selectionMode }: MediaManagerProps) {
  return (
    <div className="animate-in fade-in duration-500">
      <MediaContainer 
        onSelect={onSelect} 
        selectionMode={selectionMode} 
      />
    </div>
  );
}
