import React from 'react';
import { useNpl } from '../context/NplContext';
import { getSiteMedia } from '../utils/siteMedia';

export const TeamBadge = ({ team, size = "md", showName = false, shape = "rounded", logoSrcOverride, sizeClassName = '' }) => {
  const { siteMedia, selectedSeason } = useNpl();
  const sizeMap = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-9 h-9 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
    xl: "w-24 h-24 text-xl"
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const isLogoOnly = shape === "none";
  const primaryColor = team?.primaryColor || team?.color || "#F59E0B";
  const shortName = team?.shortName || team?.short || "NPL";
  const logoSrc = getSiteMedia(siteMedia, `team-logo:${team?.id}`, selectedSeason, team?.logo) || logoSrcOverride;

  return (
    <div className="inline-flex items-center gap-2.5">
      <div
        className={`relative ${isLogoOnly ? 'h-20 w-auto' : currentSize} ${sizeClassName} ${shape === 'circle' ? 'rounded-full' : isLogoOnly ? '' : 'rounded-xl'} flex items-center justify-center font-sports tracking-wider text-white ${isLogoOnly ? '' : 'shadow-lg'} ${logoSrc ? 'overflow-visible' : 'overflow-hidden'} flex-shrink-0 transition-transform duration-200 hover:scale-105`}
        style={{
          background: logoSrc ? 'transparent' : `linear-gradient(135deg, ${primaryColor} 0%, #0B132B 100%)`,
          boxShadow: logoSrc ? 'none' : `0 4px 14px ${primaryColor}40`,
          border: logoSrc ? 'none' : `1.5px solid ${primaryColor}80`
        }}
        title={team?.name}
      >
        {logoSrc ? (
          <img src={logoSrc} alt={`${team?.name || shortName} logo`} className={`relative z-10 h-full ${isLogoOnly ? 'w-auto' : 'w-full object-contain drop-shadow-md'}`} />
        ) : (
          <>
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 40 40">
                <path d="M0,0 L40,40 M40,0 L0,40" stroke="#FFF" strokeWidth="2" />
              </svg>
            </div>
            <span className="relative z-10 max-w-full break-words px-0.5 text-center text-[clamp(8px,2.5vw,1rem)] font-bold leading-tight drop-shadow-md">{shortName}</span>
          </>
        )}

        {/* Small corner star if team has won titles */}
        {!isLogoOnly && team?.titles > 0 && (
          <span className="absolute top-0.5 right-1 z-20 text-[9px] text-amber-300 drop-shadow">
            ★
          </span>
        )}
      </div>

      {showName && (
        <span className="font-heading font-semibold text-slate-100 text-sm md:text-base">
          {team?.name}
        </span>
      )}
    </div>
  );
};
