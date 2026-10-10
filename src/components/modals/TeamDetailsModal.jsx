import React from 'react';
import { useNpl } from '../../context/NplContext';
import { TeamBadge } from '../TeamBadge';
import { getSiteMedia } from '../../utils/siteMedia';
import { X, Trophy, UserCheck, Shield, MapPin, Award } from 'lucide-react';

export const TeamDetailsModal = ({ team, onClose }) => {
  const { openModal, siteMedia, selectedSeason } = useNpl();
  if (!team) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#091124] border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header with franchise banner & color bar */}
        <div className="relative h-44 sm:h-52 bg-slate-950 overflow-hidden flex-shrink-0">
          <img
            src={getSiteMedia(siteMedia, `team:${team.id}`, selectedSeason, team.banner)}
            alt={team.name}
            className="w-full h-full object-cover filter brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#091124] via-[#091124]/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 border border-slate-700 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Team Emblem & Info over banner */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
            <div className="flex items-center gap-4">
              <TeamBadge team={team} size="xl" />
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
                  OFFICIAL FRANCHISE
                </span>
                <h3 className="font-sports text-3xl sm:text-5xl text-white tracking-wide leading-none">
                  {team.name}
                </h3>
                <span className="text-xs text-slate-300 italic">
                  "{team.slogan}"
                </span>
              </div>
            </div>

            {team.titles > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500 text-amber-300 font-sports text-sm">
                <Trophy className="w-4 h-4" />
                <span>{team.titles} {team.titles === 1 ? 'CHAMPIONSHIP' : 'CHAMPIONSHIPS'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Performance Statistics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-4 bg-slate-950 border-b border-slate-800 text-center text-xs">
          <div className="p-2 bg-slate-900/60 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase block font-bold">Matches</span>
            <span className="font-sports text-2xl text-white">{team.matches}</span>
          </div>
          <div className="p-2 bg-slate-900/60 rounded-xl">
            <span className="text-[10px] text-emerald-400 uppercase block font-bold">Wins</span>
            <span className="font-sports text-2xl text-emerald-400">{team.wins}</span>
          </div>
          <div className="p-2 bg-slate-900/60 rounded-xl">
            <span className="text-[10px] text-rose-400 uppercase block font-bold">Losses</span>
            <span className="font-sports text-2xl text-rose-400">{team.losses}</span>
          </div>
          <div className="p-2 bg-slate-900/60 rounded-xl">
            <span className="text-[10px] text-amber-400 uppercase block font-bold">Win %</span>
            <span className="font-sports text-2xl text-amber-400">{team.winPercentage}%</span>
          </div>
          <div className="col-span-2 sm:col-span-1 p-2 bg-slate-900/60 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase block font-bold">Titles</span>
            <span className="font-sports text-2xl text-amber-300">{team.titles}</span>
          </div>
        </div>

        {/* Franchise Details (Captain, Owner, Home Ground) */}
        <div className="p-6 border-b border-slate-800 bg-[#060D1E] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-bold">Captain</span>
              <span className="font-bold text-white text-sm">{team.captain}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-bold">Owner</span>
              <span className="font-bold text-slate-200 text-sm">{team.owner}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-bold">Home Venue</span>
              <span className="font-bold text-slate-200 text-sm">{team.home}</span>
            </div>
          </div>
        </div>

        {/* Squad List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-grow">
          <div className="flex items-center justify-between">
            <h4 className="font-sports text-xl text-white tracking-wider">
              OFFICIAL SQUAD ROSTER ({team.squad?.length || 0} PLAYERS)
            </h4>
            <span className="text-xs text-slate-400 font-semibold">
              Click player to view individual stats
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {team.squad?.map((player) => (
              <div
                key={player.id}
                onClick={() => openModal('player-profile', {
                  ...player,
                  teamId: team.id,
                  teamName: team.name,
                  teamShort: team.shortName,
                  teamColor: team.primaryColor,
                  teamLogo: getSiteMedia(siteMedia, `team-logo:${team.id}`, selectedSeason, team.logo),
                  photo: getSiteMedia(siteMedia, `player-photo:${team.id}-${player.id}`, selectedSeason, player.photo),
                  season: selectedSeason
                })}
                className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all flex items-center justify-between text-xs group"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white group-hover:text-amber-400">
                      {player.name}
                    </span>
                    {player.isCaptain && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        C
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {player.role} • {player.style}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-sports text-base text-amber-400 block leading-tight">
                    {player.runs ? `${player.runs} R` : `${player.wickets || 0} W`}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Age {player.age}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
