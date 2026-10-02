import React from 'react';
import { useNpl } from '../context/NplContext';
import { TeamBadge } from './TeamBadge';
import { Users, Trophy, ChevronRight, UserCheck, MapPin } from 'lucide-react';

export const TeamsSection = () => {
  const { teams, openModal, seasons, selectedSeason, setSelectedSeason } = useNpl();
  const seasonInfo = seasons.find((season) => season.edition === selectedSeason) || seasons[0];
  const filteredTeams = teams.filter((team) => {
    const teamSessions = Array.isArray(team.sessions)
      ? team.sessions
      : Array.isArray(team.seasons)
        ? team.seasons
        : team.session
          ? [team.session]
          : seasons.map((season) => season.edition);

    return teamSessions.includes(selectedSeason);
  });

  return (
    <section id="teams" className="py-20 bg-[#050B17] border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-600/40 text-blue-400 text-xs font-bold tracking-widest uppercase mb-3">
              <Users className="w-3.5 h-3.5" />
              <span>THE {filteredTeams.length} CONTENDERS</span>
            </div>
            <h2 className="font-sports text-4xl sm:text-5xl lg:text-6xl text-white tracking-wide uppercase leading-none">
              NPL <span className="text-gold-gradient">TEAMS</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-xl">
              Meet the official franchise teams competing for the Narua Premier League Crown in {selectedSeason}.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <label className="relative z-10 flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Session
              <select
                value={seasonInfo?.edition || ''}
                onChange={(event) => setSelectedSeason(event.target.value)}
                className="relative z-20 min-w-36 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold normal-case text-white focus:border-amber-500 focus:outline-none"
              >
                {seasons.map((season) => (
                  <option key={season.edition} value={season.edition}>{season.edition} ({season.year || season.season})</option>
                ))}
              </select>
            </label>

            <div className="text-xs text-slate-400 font-semibold bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 self-start md:self-auto">
              Click on any team to view complete roster & player statistics
            </div>
          </div>
        </div>

        {/* 8 Teams Grid (12-column responsive layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredTeams.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center text-slate-400">
              No teams are registered for {selectedSeason} yet.
            </div>
          ) : (
            filteredTeams.map((team) => (
              <div
                key={team.id}
                onClick={() => openModal('team-details', team)}
                className="glass-panel-card rounded-3xl p-5 border border-slate-800 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer relative overflow-hidden group flex flex-col justify-between shadow-xl"
              >
              {/* Dynamic top accent glow using franchise colors */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5 transition-all duration-300 group-hover:h-2"
                style={{ backgroundColor: team.primaryColor }}
              />

              <div>
                {/* Header: Badge & Titles */}
                <div className="flex items-start justify-between mb-4">
                  <TeamBadge team={team} size="lg" />
                  
                  {team.titles > 0 ? (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-sports tracking-wider">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>{team.titles} {team.titles === 1 ? 'TITLE' : 'TITLES'}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      CHALLENGER
                    </span>
                  )}
                </div>

                {/* Team Name and Slogan */}
                <h3 className="font-sports text-2xl text-white tracking-wide leading-tight group-hover:text-amber-400 transition-colors">
                  {team.name}
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-1 italic">
                  "{team.slogan}"
                </p>

                {/* Captain and Owner Details */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Captain</span>
                    <span className="font-bold text-white flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                      {team.captain}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Owner</span>
                    <span className="text-slate-300 font-medium truncate max-w-[140px]" title={team.owner}>
                      {team.owner}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Home Ground</span>
                    <span className="text-slate-400 flex items-center gap-1 truncate max-w-[140px]">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {team.home}
                    </span>
                  </div>
                </div>

                {/* Quick Performance Bar */}
                <div className="mt-4 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 grid grid-cols-3 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Played</span>
                    <span className="font-sports text-base text-white">{team.matches}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase block font-bold">Won</span>
                    <span className="font-sports text-base text-emerald-400">{team.wins}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-400 uppercase block font-bold">Win %</span>
                    <span className="font-sports text-base text-amber-300">{team.winPercentage}%</span>
                  </div>
                </div>
              </div>

              {/* View Squad Link */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300">
                  <span>VIEW COMPLETE SQUAD ({team.squad?.length || 15} PLAYERS)</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
