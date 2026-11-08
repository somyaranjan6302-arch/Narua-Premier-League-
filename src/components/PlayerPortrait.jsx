import React, { useId } from 'react';

export const PlayerPortrait = ({ photo, alt = 'Player portrait', teamColor = '#2563EB', className = '' }) => {
  const gradientId = useId().replace(/:/g, '');

  if (photo) {
    return <img src={photo} alt={alt} className={`object-cover object-top ${className}`} />;
  }

  return (
    <div
      role="img"
      aria-label={`${alt} illustration`}
      className={`flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(145deg, ${teamColor} 0%, #0b1530 82%)` }}
    >
      <svg viewBox="0 0 240 300" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id={`${gradientId}-kit`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="45%" stopColor={teamColor} />
            <stop offset="100%" stopColor="#0b1466" />
          </linearGradient>
          <radialGradient id={`${gradientId}-glow`} cx="50%" cy="28%" r="55%">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0b1466" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="240" height="300" fill={`url(#${gradientId}-glow)`} />
        <ellipse cx="120" cy="292" rx="78" ry="14" fill="#070a30" opacity=".45" />
        <circle cx="120" cy="92" r="46" fill="#f3e7d8" />
        <path d="M86 86c4-32 20-50 34-50 16 0 32 16 36 48-10-10-20-22-28-34-12 16-28 28-42 36Z" fill="#1e293b" />
        <path d="M78 168c12-22 28-34 42-34s30 12 42 34c10 18 28 86 32 108H46c4-22 22-90 32-108Z" fill={`url(#${gradientId}-kit)`} />
        <path d="M96 134h48c6 10 8 18 6 28H90c-2-10 0-18 6-28Z" fill="#e2e8f0" />
        <path d="M108 162h24v42c-4 8-20 8-24 0v-42Z" fill="#f8fafc" opacity=".9" />
        <path d="M114 176h12v18h-12z" fill={teamColor} />
        <path d="M58 196c18-8 28-6 34 8M182 196c-18-8-28-6-34 8" stroke="#bfdbfe" strokeWidth="4" fill="none" opacity=".55" />
      </svg>
    </div>
  );
};
