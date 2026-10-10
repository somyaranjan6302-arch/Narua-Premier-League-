import React from 'react';

export const PlayerPortrait = ({ photo, alt = 'Player portrait', teamColor = '#2563EB', className = '' }) => {
  if (photo) {
    return <img src={photo} alt={alt} className={className} />;
  }

  return (
    <div
      role="img"
      aria-label={`${alt} illustration`}
      className={`flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(145deg, ${teamColor} 0%, #0b1530 82%)` }}
    >
      <svg viewBox="0 0 240 300" className="h-full w-full" aria-hidden="true">
        <circle cx="120" cy="104" r="49" fill="#dbe4ef" />
        <path d="M82 97c1-34 18-56 48-56 30 0 47 22 47 54-12-8-23-20-30-32-14 17-39 27-65 29Z" fill="#17233f" />
        <path d="M65 177c14-17 33-26 55-26s42 9 56 26l28 94H37l28-94Z" fill={teamColor} />
        <path d="m96 153 24 29 24-29" fill="#f8fafc" opacity=".92" />
        <path d="M38 269h164l-12 31H50l-12-31Z" fill="#091124" opacity=".72" />
        <path d="M106 183h28v37h-28z" fill="#f8fafc" opacity=".85" />
        <path d="M111 190h18v24h-18z" fill={teamColor} />
      </svg>
    </div>
  );
};
