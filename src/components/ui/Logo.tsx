
import React from 'react';

interface LogoProps {
  className?: string;
  isDark?: boolean;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  isDark = false, 
  showText = true 
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon Mark: Geometric V / Architectural Angle */}
      <svg 
        width="28" 
        height="28" 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <path 
          d="M8 12L20 32L32 12" 
          stroke={isDark ? "white" : "currentColor"} 
          strokeWidth="3.5" 
          strokeLinecap="square"
        />
        <path 
          d="M14 6L20 16L26 6" 
          stroke={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.2)"} 
          strokeWidth="2" 
          strokeLinecap="square"
        />
      </svg>

      {/* Text Mark */}
      {showText && (
        <span 
          className={`
            text-lg font-bold tracking-[0.25em] transition-colors
            ${isDark ? 'text-white' : 'text-slate-900'}
          `}
          style={{ fontFamily: 'var(--font-ui), sans-serif' }}
        >
          VINTHEM
        </span>
      )}
    </div>
  );
};
