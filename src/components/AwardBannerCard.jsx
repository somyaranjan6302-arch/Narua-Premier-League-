import React from 'react';
import { UserRound } from 'lucide-react';

export const AwardBannerCard = ({
  title,
  name,
  value,
  valueLabel,
  photo,
  teamLogo,
  teamName,
  primaryColor = '#0e7490',
  secondaryColor = '#075985',
  details,
  onClick
}) => {
  const Card = onClick ? 'button' : 'article';
  const teamInitials = (teamName || 'NPL')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 3);

  return (
    <Card
      {...(onClick ? { type: 'button', onClick, 'aria-label': `${title}: ${name}, ${value}` } : {})}
      className="relative isolate block aspect-[1.7] w-full overflow-visible text-left text-white transition duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 top-[18%] -z-10 overflow-hidden rounded-xl shadow-lg"
        style={{ background: `linear-gradient(125deg, ${primaryColor} 0%, ${primaryColor} 42%, ${secondaryColor} 100%)` }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(ellipse at 72% 50%, transparent 0%, ${secondaryColor} 100%), repeating-linear-gradient(135deg, transparent 0 24px, rgba(255,255,255,0.12) 25px 31px, transparent 32px 50px)`
          }}
        />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/20" />
      </span>

      <span className="absolute left-2.5 top-[25%] z-20 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-white p-1 shadow-lg sm:left-3 sm:h-11 sm:w-11">
        {teamLogo ? (
          <img src={teamLogo} alt={teamName ? `${teamName} logo` : ''} className="h-full w-full object-contain" />
        ) : (
          <span className="text-center text-[10px] font-black uppercase leading-tight text-slate-900">
            {teamInitials}
          </span>
        )}
      </span>

      {photo ? (
        <img
          src={photo}
          alt={name ? `${name} portrait` : ''}
          className="absolute inset-y-0 left-0 z-10 h-full w-[58%] origin-bottom-left object-contain object-bottom transition-transform duration-500 ease-out hover:scale-[1.08]"
          loading="lazy"
        />
      ) : (
        <span className="absolute inset-y-0 left-0 z-10 flex h-full w-[53%] items-end justify-center text-white/20">
          <UserRound className="h-[95%] w-[95%] origin-bottom-left stroke-[0.8] transition-transform duration-500 ease-out hover:scale-[1.08]" />
        </span>
      )}

      <span className="absolute bottom-0 right-0 top-[18%] z-10 w-[65%] rounded-r-xl bg-gradient-to-r from-transparent via-black/10 to-black/20" />
      <span className="absolute bottom-0 right-0 z-20 flex h-[82%] w-[56%] flex-col items-end justify-between px-2.5 py-3 text-right sm:px-4 sm:py-4">
        <span className="flex w-full flex-col items-end">
          <span className="line-clamp-2 max-w-full break-words rounded-md bg-black/35 px-2.5 py-1.5 text-[9px] font-black uppercase leading-tight tracking-wide sm:px-3 sm:text-xs">
            {title}
          </span>
          <span className="mt-2 line-clamp-2 w-full font-heading text-sm font-extrabold uppercase leading-tight sm:text-lg">
            {name}
          </span>
        </span>
        <span className="flex w-full flex-col items-end">
          {valueLabel && (
            <span className="text-[9px] font-bold uppercase leading-tight text-white/90 sm:text-xs">
              {valueLabel}
            </span>
          )}
          <span className="max-w-full truncate font-sports text-3xl leading-none tracking-tight drop-shadow-md sm:text-5xl">
            {value}
          </span>
          {details && (
            <span className="mt-1 line-clamp-2 max-w-full text-[8px] font-semibold leading-tight text-white/85 sm:text-[10px]">
              {details}
            </span>
          )}
        </span>
      </span>
    </Card>
  );
};
