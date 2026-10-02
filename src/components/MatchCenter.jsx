import React, { useState, useEffect } from 'react';
import { useNpl } from '../context/NplContext';
import { TeamBadge } from './TeamBadge';
import { Clock, MapPin, Award, ChevronRight } from 'lucide-react';

export const MatchCenter = () => {
  const { matches, teams, openModal, seasons, selectedSeason, setSelectedSeason } = useNpl();
  const [filter, setFilter] = useState('ALL'); // ALL, LIVE, UPCOMING, COMPLETED
  const seasonInfo = seasons.find((season) => season.edition === selectedSeason) || seasons[0];

  // Countdown timer helper for upcoming matches
  const [timeLeft, setTimeLeft] = useState({
    hours: 28,
    minutes: 45,
    seconds: 12
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sessionMatches = matches.filter((match) => (match.season || match.session) === selectedSeason);
  const filteredMatches = sessionMatches.filter(m => {
    if (filter === 'ALL') return true;
    return m.status === filter;
  });

  const liveMatchesCount = sessionMatches.filter(m => m.status === 'LIVE').length;
  const upcomingMatchesCount = sessionMatches.filter(m => m.status === 'UPCOMING').length;
  const completedMatchesCount = sessionMatches.filter(m => m.status === 'COMPLETED').length;

  return (
    <section id="matches" className="py-20 bg-[#050B17] border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header and Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-500/30 text-red-400 text-xs font-bold tracking-widest uppercase mb-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span>LIVE MATCH HUB</span>
            </div>
            <h2 className="font-sports text-4xl sm:text-5xl lg:text-6xl text-white tracking-wide uppercase leading-none">
              NPL <span className="text-gold-gradient">MATCH CENTER</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Follow every over, live score updates, match schedules, and complete scorecards.
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

            <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 self-start md:self-auto">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  filter === 'ALL'
                    ? "bg-amber-500 text-slate-950 font-black shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                ALL ({sessionMatches.length})
              </button>

              <button
                onClick={() => setFilter('LIVE')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  filter === 'LIVE'
                    ? "bg-red-600 text-white font-black shadow-md shadow-red-600/30"
                    : "text-slate-400 hover:text-red-400"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                LIVE ({liveMatchesCount})
              </button>

              <button
                onClick={() => setFilter('UPCOMING')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  filter === 'UPCOMING'
                    ? "bg-blue-600 text-white font-black shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                UPCOMING ({upcomingMatchesCount})
              </button>

              <button
                onClick={() => setFilter('COMPLETED')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  filter === 'COMPLETED'
                    ? "bg-slate-700 text-white font-black shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                COMPLETED ({completedMatchesCount})
              </button>
            </div>
          </div>
        </div>

        {/* Match Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMatches.length === 0 ? (
            <p className="lg:col-span-2 rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center text-slate-400">No matches are scheduled for {selectedSeason} yet.</p>
          ) : filteredMatches.map((match) => {
            const team1Obj = teams.find(t => t.id === match.team1?.id) || match.team1;
            const team2Obj = teams.find(t => t.id === match.team2?.id) || match.team2;

            return (
              <div
                key={match.id}
                className={`rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group border ${
                  match.status === 'LIVE'
                    ? "bg-gradient-to-br from-red-950/20 via-slate-900 to-slate-950 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
                    : match.status === 'UPCOMING'
                    ? "bg-gradient-to-br from-blue-950/20 via-slate-900 to-slate-950 border-blue-500/30 hover:border-blue-500/60"
                    : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Top Status Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400 tracking-wider">
                      {match.matchNumber} • {match.tournamentPhase}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {match.status === 'LIVE' && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white font-bold text-xs uppercase tracking-wider animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white"></span>
                        LIVE
                      </span>
                    )}
                    {match.status === 'UPCOMING' && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700 font-semibold text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        {match.date} • {match.time}
                      </span>
                    )}
                    {match.status === 'COMPLETED' && (
                      <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold text-xs">
                        {match.date}
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Teams Faceoff */}
                <div className="space-y-4">
                  {/* Team 1 Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TeamBadge team={team1Obj} size="md" />
                      <div>
                        <h4 className="font-heading font-bold text-white text-base sm:text-lg">
                          {match.team1?.name}
                        </h4>
                        <span className="text-xs text-slate-400 font-medium">
                          {team1Obj?.slogan || "Contender"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {match.team1?.score ? (
                        <>
                          <span className="font-sports text-2xl sm:text-3xl text-white block leading-none">
                            {match.team1.score}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            ({match.team1.overs} ov)
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          Upcoming
                        </span>
                      )}
                    </div>
                  </div>

                  {/* VS Divider */}
                  <div className="flex items-center gap-3 my-2">
                    <div className="h-px bg-slate-800 flex-grow" />
                    <span className="font-sports text-sm text-slate-500 tracking-wider">VS</span>
                    <div className="h-px bg-slate-800 flex-grow" />
                  </div>

                  {/* Team 2 Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TeamBadge team={team2Obj} size="md" />
                      <div>
                        <h4 className="font-heading font-bold text-white text-base sm:text-lg">
                          {match.team2?.name}
                        </h4>
                        <span className="text-xs text-slate-400 font-medium">
                          {team2Obj?.slogan || "Contender"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {match.team2?.score ? (
                        <>
                          <span className="font-sports text-2xl sm:text-3xl text-white block leading-none">
                            {match.team2.score}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            ({match.team2.overs} ov)
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          Upcoming
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Specific Section content based on match state */}

                {/* 1. If LIVE Match */}
                {match.status === 'LIVE' && (
                  <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between text-xs bg-red-950/30 p-2.5 rounded-xl border border-red-500/20">
                      <span className="font-bold text-amber-300">
                        ⚡ {match.equation}
                      </span>
                      <span className="text-slate-300 font-mono">
                        Target: {match.team1?.target || 192}
                      </span>
                    </div>

                    {/* Current Batsmen & Bowler at crease */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block font-bold">Batting</span>
                        {match.currentBatsmen?.map(b => (
                          <div key={b.name} className="text-slate-200 font-semibold truncate">
                            {b.name} <span className="text-amber-400">{b.score}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block font-bold">Bowling</span>
                        <div className="text-slate-200 font-semibold truncate">
                          {match.currentBowler?.name}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          {match.currentBowler?.figures}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. If UPCOMING Match: Countdown timer & Venue */}
                {match.status === 'UPCOMING' && (
                  <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between bg-blue-950/30 p-3 rounded-xl border border-blue-600/20">
                      <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                        MATCH STARTS IN:
                      </span>
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white">
                        <span className="px-2 py-1 rounded bg-blue-900/60 border border-blue-700/50">
                          {timeLeft.hours}h
                        </span>
                        <span>:</span>
                        <span className="px-2 py-1 rounded bg-blue-900/60 border border-blue-700/50">
                          {timeLeft.minutes}m
                        </span>
                        <span>:</span>
                        <span className="px-2 py-1 rounded bg-blue-900/60 border border-blue-700/50 text-amber-400">
                          {timeLeft.seconds}s
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 italic line-clamp-1">
                      {match.preview}
                    </p>
                  </div>
                )}

                {/* 3. If COMPLETED Match: Result & Player of the Match */}
                {match.status === 'COMPLETED' && (
                  <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
                    <div className="text-sm font-bold text-emerald-400">
                      ✓ {match.result}
                    </div>

                    {match.playerOfMatch && (
                      <div className="flex items-center justify-between text-xs bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-400" />
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Player of the Match</span>
                            <span className="text-white font-bold">{match.playerOfMatch.name}</span>
                          </div>
                        </div>
                        <span className="text-slate-300 font-medium text-[11px] text-right">
                          {match.playerOfMatch.performance}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Bar: Venue and View Button */}
                <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{match.venue}</span>
                  </div>

                  <button
                    onClick={() => openModal('match-details', match)}
                    className="font-sports text-sm tracking-wider text-amber-400 hover:text-amber-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                  >
                    <span>VIEW MATCH CENTER</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
