
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
        className={`relative rounded overflow-hidden border border-slate-100 shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={imageUrl}
          alt={name || "User profile"}
          fill
          className="object-cover"
          referrerPolicy="no-referrer"
          sizes={`${size}px`}
        />
      </div>
    );
  }

  // Fallback: Elegant Alphabet Avatar
  const initial = name ? name.charAt(0).toUpperCase() : 'U';
  
  return (
    <div 
      className={`
        flex items-center justify-center rounded shrink-0
        bg-slate-900 text-white font-bold tracking-tighter
        border border-slate-800 shadow-sm
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
