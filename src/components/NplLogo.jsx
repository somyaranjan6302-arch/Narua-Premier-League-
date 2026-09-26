import React from 'react';

export const NplLogo = ({ size = "md", showText = true, imageSrc, compactOnMobile = false }) => {
  const dimensionClass = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-12 h-12 sm:w-16 sm:h-16",
    xl: "w-24 h-24"
  }[size] || "w-11 h-11";

  return (
    <div className="flex min-w-0 max-w-full items-center gap-3 select-none group cursor-pointer">
      <div className={`relative ${dimensionClass} flex-shrink-0 transition-transform duration-300 group-hover:scale-105`}>
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/30 to-blue-600/30 rounded-full blur-md" />
        
        {imageSrc ? (
          <img src={imageSrc} alt="NPL logo" className="relative w-full h-full object-contain" />
        ) : (
        <svg viewBox="0 0 100 110" className="w-full h-full drop-shadow-[0_4px_12px_rgba(245,158,11,0.35)]">
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B1528" />
              <stop offset="50%" stopColor="#132347" />
              <stop offset="100%" stopColor="#080E1E" />
            </linearGradient>
            <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="ballGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#991B1B" />
            </linearGradient>
          </defs>

          {/* Shield Outline */}
          <path
            d="M50 5 L88 20 C88 65, 50 98, 50 98 C50 98, 12 65, 12 20 Z"
            fill="url(#shieldGrad)"
            stroke="url(#goldBorder)"
            strokeWidth="3.5"
          />

          {/* Inner Accent Line */}
          <path
            d="M50 12 L80 24 C80 60, 50 88, 50 88 C50 88, 20 60, 20 24 Z"
            fill="none"
            stroke="rgba(245, 158, 11, 0.4)"
            strokeWidth="1.2"
          />

          {/* Crossed Golden Cricket Bats */}
          <g transform="translate(50, 48) scale(0.65)" stroke="url(#goldBorder)" strokeWidth="3" fill="#D97706">
            <line x1="-30" y1="-30" x2="30" y2="30" strokeLinecap="round" />
            <line x1="30" y1="-30" x2="-30" y2="30" strokeLinecap="round" />
          </g>

          {/* Seamed Red Cricket Ball in Center */}
          <circle cx="50" cy="48" r="14" fill="url(#ballGrad)" stroke="#FDE68A" strokeWidth="1.5" />
          {/* Cricket Ball Seam */}
          <path
            d="M39 44 C45 42, 55 42, 61 44 M39 52 C45 54, 55 54, 61 52"
            stroke="#FEF08A"
            strokeWidth="1.2"
            strokeDasharray="2,2"
            fill="none"
          />

          {/* Golden Stars at top */}
          <g fill="#FDE68A">
            <polygon points="50,16 52,21 57,21 53,24 55,29 50,26 45,29 47,24 43,21 48,21" transform="scale(0.8) translate(12, 4)" />
          </g>

          {/* League Lettering NPL */}
          <text
            x="50"
            y="76"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="14"
            fontFamily="'Bebas Neue', sans-serif"
            fontWeight="bold"
            letterSpacing="2"
          >
            NPL
          </text>
        </svg>
        )}
      </div>

      {showText && (
        <div className={`flex min-w-0 flex-col text-left ${compactOnMobile ? 'max-w-full' : ''}`}>
          <div className={`flex items-center gap-x-1.5 gap-y-0.5 ${compactOnMobile ? 'flex-wrap' : ''}`}>
            <span className={`font-sports ${compactOnMobile ? 'text-xl sm:text-2xl md:text-3xl' : 'text-2xl md:text-3xl'} leading-none tracking-wider text-white`}>
              NARUA
            </span>
            <span className={`font-sports ${compactOnMobile ? 'text-xl sm:text-2xl md:text-3xl' : 'text-2xl md:text-3xl'} leading-none tracking-wider text-amber-400`}>
              PREMIER LEAGUE
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] md:text-xs text-slate-400 uppercase tracking-widest font-semibold">
            <span className="text-amber-500">EST. 2024</span>
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <span>OFFICIAL T20 LEAGUE</span>
          </div>
        </div>
      )}
    </div>
  );
};
