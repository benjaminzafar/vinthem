
import React from 'react';
import Image from 'next/image';

interface UserAvatarProps {
  name?: string;
  imageUrl?: string;
  size?: number;
  className?: string;
}

export function UserAvatar({ name, imageUrl, size = 28, className = "" }: UserAvatarProps) {
  // If we have an image URL, show the image
  if (imageUrl && imageUrl.trim() !== "") {
    return (
      <div 
        className={`relative rounded-none overflow-hidden border border-slate-100 shrink-0 transform-gpu ${className}`}
        style={{ width: size, height: size, WebkitBackfaceVisibility: 'hidden' }}
      >
        <div className="absolute inset-0 w-full h-full transform-gpu" style={{ WebkitBackfaceVisibility: 'hidden', WebkitTransform: 'translate3d(0,0,0)' }}>
          <Image
            src={imageUrl}
            alt={name || "User profile"}
            fill
            className="object-cover"
            referrerPolicy="no-referrer"
            sizes={`${size}px`}
          />
        </div>
      </div>
    );
  }

  // Fallback: Elegant Alphabet Avatar
  const initial = name ? name.charAt(0).toUpperCase() : 'U';
  
  return (
    <div 
      className={`
        flex items-center justify-center rounded-none shrink-0
        bg-slate-900 text-white font-bold tracking-tighter
        border border-slate-800 shadow-none
        ${className}
      `}
      style={{ 
        width: size, 
        height: size,
        fontSize: size * 0.45 
      }}
    >
      {initial}
    </div>
  );
}
