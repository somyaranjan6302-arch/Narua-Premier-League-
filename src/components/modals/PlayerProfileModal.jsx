import React from 'react';
import { X } from 'lucide-react';
import { PlayerPortrait } from '../PlayerPortrait';

export const PlayerProfileModal = ({ player, onClose }) => {
  if (!player) return null;
  const teamColor = player.teamColor || '#1d4ed8';
  const teamName = player.teamName || player.team || 'NPL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative my-4 flex w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#071022] shadow-2xl shadow-black/60" style={{ '--player-team': teamColor }}>
        <header className="relative z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-5 py-3.5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white">NPL • Player Profile</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{teamName}</p>
          </div>
          <button onClick={onClose} aria-label="Close player profile" className="rounded-xl border border-white/10 bg-slate-900/80 p-2 text-slate-300 transition hover:border-white/30 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="relative isolate min-h-[340px] overflow-hidden sm:min-h-[390px]">
          <div className="absolute inset-y-0 right-0 w-[72%]">
            <PlayerPortrait photo={player.photo} alt={player.name || 'Player'} teamColor={teamColor} className="h-full w-full object-cover object-top" />
            <div className="absolute inset-0 opacity-10 mix-blend-screen" style={{ backgroundColor: teamColor }} />
            <div className="absolute inset-0 bg-gradient-to-r from-[#071022] via-[#071022]/35 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071022] via-transparent to-black/10" />
          </div>
          <div className="absolute left-5 top-5 z-10 max-w-[56%] sm:left-7 sm:top-7">
            <span className="inline-flex rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-200">Official Squad</span>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-white/65">{player.teamShort || 'NPL'}</p>
            <h2 className="mt-1 break-words font-sports text-3xl uppercase leading-[0.98] tracking-wide text-white drop-shadow-lg sm:text-4xl">
              {player.name || player.fullName || 'Player'}
            </h2>
            <span className="mt-3 inline-flex rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg" style={{ backgroundColor: teamColor }}>
              {player.role || 'Cricketer'}
            </span>
            <p className="mt-2 max-w-48 text-xs font-medium leading-relaxed text-slate-200 drop-shadow">{player.style || `${player.battingStyle || 'Right Hand'} • ${player.bowlingStyle || 'Bowler'}`}</p>
          </div>
          <div className="absolute right-4 top-4 z-10 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-white/80 bg-slate-950/90 p-1 shadow-xl sm:right-6 sm:top-6 sm:h-16 sm:w-16">
            {player.teamLogo ? (
              <img src={player.teamLogo} alt={`${teamName} franchise logo`} className="h-full w-full object-contain" />
            ) : (
              <span className="text-center text-[10px] font-black uppercase leading-tight text-white">{player.teamShort || 'NPL'}</span>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between gap-3 border-t border-white/10 px-5 py-3.5 sm:px-7">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Franchise</p>
              <p className="mt-0.5 max-w-60 truncate text-sm font-extrabold text-white">{teamName}</p>
            </div>
            <div className="shrink-0 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Season</p>
              <p className="text-xs font-bold text-white">{player.season || player.session || 'NPL'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-2.5 text-center sm:grid-cols-4">
            <div className="rounded-xl border border-white/[0.07] bg-slate-950/70 p-3.5">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Runs</span>
              <span className="mt-1 block font-sports text-2xl leading-none text-white">{player.runs || 0}</span>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-slate-950/70 p-3.5">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Wickets</span>
              <span className="mt-1 block font-sports text-2xl leading-none text-white">{player.wickets || 0}</span>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-slate-950/70 p-3.5">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Strike Rate</span>
              <span className="mt-1 block font-mono text-sm font-bold text-white">{player.strikeRate || '—'}</span>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-slate-950/70 p-3.5">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Economy</span>
              <span className="mt-1 block font-mono text-sm font-bold text-white">{player.economy || '—'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 rounded-2xl border border-white/[0.07] bg-slate-950/70 p-4 text-xs sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] pb-2 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
              <span className="text-slate-400">Best batting</span>
              <span className="font-sports text-base text-white">{player.bestScore || '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-3 sm:pl-2">
              <span className="text-slate-400">Best bowling</span>
              <span className="font-sports text-base text-white">{player.bestBowling || '—'}</span>
            </div>
          </div>

          {player.details && (
            <p className="rounded-xl border border-white/[0.07] bg-slate-950/50 p-3 text-xs leading-relaxed text-slate-300">{player.details}</p>
          )}
        </div>
      </div>
    </div>
  );
};
