import React, { useState, useEffect } from 'react';
import { useNpl } from '../context/NplContext';
import { Clock, MapPin, ChevronRight } from 'lucide-react';
import { getSessionMediaKey, getSiteMedia } from '../utils/siteMedia';

export const MatchCenter = () => {
  const { matches, teams, openModal, siteMedia, seasons, selectedSeason, setSelectedSeason } = useNpl();
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

  const showDemoMatches = import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get('demoMatches') === '1';
  const sessionTeams = teams.filter((team) => (
    (team.sessions || team.seasons || [team.session]).includes(selectedSeason)
  ));
  const demoTeam1 = sessionTeams[0] || teams[0] || {
    id: 'demo-team-1',
    name: 'Narua Royals',
    shortName: 'NR',
    primaryColor: '#ef233c'
  };
  const demoTeam2 = sessionTeams[1] || teams.find((team) => team.id !== demoTeam1.id) || {
    id: 'demo-team-2',
    name: 'Barpada Strikers',
    shortName: 'BS',
    primaryColor: '#0ea5e9'
  };
  const demoMatches = [
    {
      id: `demo-final-${selectedSeason}`,
      season: selectedSeason,
      matchNumber: 'DEMO 01',
      tournamentPhase: 'FINAL',
      status: 'COMPLETED',
      date: '18 Oct 2026',
      time: '7:30 PM',
      venue: 'NPL Demo Stadium',
      result: `${demoTeam1.name} win by 5 wickets`,
      playerOfMatch: { name: 'Demo Player', performance: '62 runs • 3 wickets' },
      team1: { ...demoTeam1, score: '161/5', overs: '18.0' },
      team2: { ...demoTeam2, score: '158/8', overs: '20.0' }
    },
    {
      id: `demo-live-${selectedSeason}`,
      season: selectedSeason,
      matchNumber: 'DEMO 02',
      tournamentPhase: 'LEAGUE MATCH',
      status: 'LIVE',
      date: '18 Oct 2026',
      time: '4:00 PM',
      venue: 'NPL Demo Ground',
      equation: 'Need 42 runs from 28 balls',
      currentBatsmen: [{ name: 'Demo Batter 1', score: '38 (24)' }, { name: 'Demo Batter 2', score: '16 (11)' }],
      currentBowler: { name: 'Demo Bowler', figures: '2/24 (3.2)' },
      team1: { ...demoTeam1, score: '126/4', overs: '16.0', target: 168 },
      team2: { ...demoTeam2, score: '167/6', overs: '20.0' }
    },
    {
      id: `demo-upcoming-${selectedSeason}`,
      season: selectedSeason,
      matchNumber: 'DEMO 03',
      tournamentPhase: 'LEAGUE MATCH',
      status: 'UPCOMING',
      date: '19 Oct 2026',
      time: '7:30 PM',
      venue: 'Narua Cricket Ground',
      preview: 'A sample upcoming fixture to preview the match card design.',
      team1: { ...demoTeam2 },
      team2: { ...demoTeam1 }
    }
  ];
  const sessionMatches = showDemoMatches
    ? demoMatches
    : matches.filter((match) => (match.season || match.session) === selectedSeason);
  const filteredMatches = sessionMatches.filter(m => {
    if (filter === 'ALL') return true;
    return m.status === filter;
  });

  const liveMatchesCount = sessionMatches.filter(m => m.status === 'LIVE').length;
  const upcomingMatchesCount = sessionMatches.filter(m => m.status === 'UPCOMING').length;
  const completedMatchesCount = sessionMatches.filter(m => m.status === 'COMPLETED').length;

  return (
    <section id="matches" className="npl-section-bg border-t border-slate-800 py-20">
      <div className="mx-auto max-w-[1700px] px-4 sm:px-6 lg:px-8">
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

        {showDemoMatches && (
          <p className="mx-auto mb-4 max-w-[1700px] rounded-lg border border-amber-500/30 bg-amber-950/30 px-4 py-2 text-center text-xs font-bold text-amber-200">
            Demo preview only — sample fixtures are not saved and are never shown on the live site.
          </p>
        )}

        {/* Match Cards Grid */}
        <div className="mx-auto grid max-w-[1700px] grid-cols-1 gap-4">
          {filteredMatches.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center text-slate-400">No matches are scheduled for {selectedSeason} yet.</p>
          ) : filteredMatches.map((match) => {
            const team1Obj = teams.find(t => t.id === match.team1?.id) || match.team1;
            const team2Obj = teams.find(t => t.id === match.team2?.id) || match.team2;
            const sides = [
              {
                team: team1Obj,
                matchTeam: match.team1,
                side: 'left'
              },
              {
                team: team2Obj,
                matchTeam: match.team2,
                side: 'right'
              }
            ].map(({ team, matchTeam, side }) => ({
              team,
              matchTeam,
              side,
              color: team?.primaryColor || team?.color || '#1d4ed8',
              secondaryColor: team?.secondaryColor || '#0f172a',
              logo: team?.id
                ? getSiteMedia(siteMedia, `team-logo:${team.id}`, selectedSeason, team.logo)
                : team?.logo,
              banner: team?.id
                ? siteMedia[getSessionMediaKey(`match-banner:${team.id}`, selectedSeason)] || ''
                : ''
            }));
            const winner = match.status === 'COMPLETED'
              ? sides.find(({ matchTeam }) => match.result?.toLowerCase().startsWith(matchTeam?.name?.toLowerCase()))
              : null;

            return (
              <div
                key={match.id}
                className="group relative overflow-hidden rounded-[10px] border border-slate-700/70 bg-[#071638] shadow-lg shadow-slate-950/30 transition-colors hover:border-sky-400/40"
              >
                <div className="relative flex h-10 items-center justify-between gap-3 overflow-hidden border-b border-slate-800/80 bg-[#071638] px-4 sm:px-5">
                  <p className="relative z-10 min-w-0 truncate text-xs font-extrabold text-white sm:text-sm">
                    {match.status === 'COMPLETED' && match.result
                      ? match.result
                      : `${match.matchNumber} • ${match.tournamentPhase}`}
                  </p>
                  {match.status === 'LIVE' && (
                    <span className="relative z-10 flex shrink-0 items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                      Live
                    </span>
                  )}
                  {match.status === 'UPCOMING' && (
                    <span className="relative z-10 flex shrink-0 items-center gap-1 rounded-full bg-blue-900/70 px-3 py-1 text-[10px] font-bold text-blue-100">
                      <Clock className="h-3.5 w-3.5" />
                      {match.date} • {match.time}
                    </span>
                  )}
                  {match.status === 'COMPLETED' && (
                    <span className="relative z-10 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-100">
                      {match.tournamentPhase || 'MATCH'}
                    </span>
                  )}
                </div>

                <div className="relative h-[clamp(120px,8.8vw,150px)] overflow-hidden bg-[#06172a]">
                  {sides.map(({ team, matchTeam, side, color, secondaryColor, logo, banner }) => {
                    const isLeft = side === 'left';
                    const teamInitials = (team?.shortName || team?.name || matchTeam?.name || 'NPL')
                      .split(/\s+/)
                      .filter(Boolean)
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 3);
                    const isWinner = winner?.side === side;
                    const shouldDim = winner && !isWinner;
                    return (
                      <div
                        key={side}
                        className={`absolute inset-y-0 z-10 w-[55%] overflow-hidden ${isLeft ? 'left-0' : 'right-0'}`}
                        style={{ clipPath: isLeft ? 'polygon(0 0, 100% 0, 89% 100%, 0 100%)' : 'polygon(11% 0, 100% 0, 100% 100%, 0 100%)' }}
                      >
                        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${color} 0%, ${color} 48%, ${secondaryColor} 100%)` }} />
                        {banner && (
                          <img
                            src={banner}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        )}
                        {banner && (
                          <div
                            aria-hidden="true"
                            className="absolute inset-0"
                            style={{
                              background: `linear-gradient(135deg, ${color} 0%, ${secondaryColor} 100%)`,
                              mixBlendMode: 'multiply',
                              opacity: 0.6
                            }}
                          />
                        )}
                        <div className="absolute inset-0 bg-slate-950/10" />
                        <div className={`absolute inset-0 ${isLeft ? 'bg-gradient-to-r from-black/20 via-transparent to-black/10' : 'bg-gradient-to-l from-black/20 via-transparent to-black/10'}`} />
                        <div className={`absolute -top-8 h-16 w-16 rounded-full border-[12px] opacity-60 ${isLeft ? 'right-[14%]' : 'left-[14%]'}`} style={{ borderColor: `${secondaryColor}b3` }} />
                        <div className={`absolute -bottom-10 h-16 w-24 rounded-full border-[12px] opacity-45 ${isLeft ? 'right-[50%]' : 'left-[50%]'}`} style={{ borderColor: `${secondaryColor}99` }} />
                        <div className={`absolute top-0 h-full w-[42%] opacity-20 ${isLeft ? 'right-0' : 'left-0'}`} style={{ background: isLeft ? 'linear-gradient(145deg, transparent 48%, #020817 49%, #020817 58%, transparent 59%)' : 'linear-gradient(35deg, transparent 48%, #020817 49%, #020817 58%, transparent 59%)' }} />
                        <div className={`absolute inset-y-0 z-10 flex min-w-0 items-center gap-2 px-2 sm:gap-3 sm:px-4 lg:gap-5 lg:px-7 ${isLeft ? 'left-0 w-[84%]' : 'right-0 w-[84%]'}`}>
                          {isLeft && (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center sm:h-14 sm:w-14 lg:h-[92px] lg:w-[92px]">
                              {logo ? (
                                <img src={logo} alt={`${team?.name || matchTeam?.name} logo`} className="h-full w-full object-contain drop-shadow-lg" />
                              ) : (
                                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-slate-950/50 text-[9px] font-black text-white shadow-lg sm:h-11 sm:w-11 sm:text-xs">
                                  {teamInitials}
                                </span>
                              )}
                            </div>
                          )}
                          {isLeft ? (
                            <>
                              <span className="min-w-0 flex-1 truncate text-[9px] font-extrabold leading-tight text-white drop-shadow sm:text-xs lg:text-lg">
                                {matchTeam?.name || team?.name}
                              </span>
                              <div className="flex shrink-0 items-baseline gap-1 text-white drop-shadow-md">
                                {matchTeam?.score ? (
                                  <>
                                    {matchTeam.overs && <span className="hidden text-[9px] font-semibold text-white/75 sm:inline sm:text-xs">{matchTeam.overs}</span>}
                                    <span className="font-sports text-base font-black leading-none sm:text-2xl lg:text-[30px]">{matchTeam.score}</span>
                                  </>
                                ) : <span className="text-[9px] font-bold uppercase tracking-wide text-white/70 sm:text-xs">TBC</span>}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex shrink-0 items-baseline gap-1 text-white drop-shadow-md">
                                {matchTeam?.score ? (
                                  <>
                                    <span className="font-sports text-base font-black leading-none sm:text-2xl lg:text-[30px]">{matchTeam.score}</span>
                                    {matchTeam.overs && <span className="hidden text-[9px] font-semibold text-white/75 sm:inline sm:text-xs">{matchTeam.overs}</span>}
                                  </>
                                ) : <span className="text-[9px] font-bold uppercase tracking-wide text-white/70 sm:text-xs">TBC</span>}
                              </div>
                              <span className="min-w-0 flex-1 truncate text-right text-[9px] font-extrabold leading-tight text-white drop-shadow sm:text-xs lg:text-lg">
                                {matchTeam?.name || team?.name}
                              </span>
                            </>
                          )}
                          {!isLeft && (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center sm:h-14 sm:w-14 lg:h-[92px] lg:w-[92px]">
                              {logo ? (
                                <img src={logo} alt={`${team?.name || matchTeam?.name} logo`} className="h-full w-full object-contain drop-shadow-lg" />
                              ) : (
                                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-slate-950/50 text-[9px] font-black text-white shadow-lg sm:h-11 sm:w-11 sm:text-xs">
                                  {teamInitials}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {shouldDim && <div className="absolute inset-0 z-[15] bg-slate-950/35" />}
                      </div>
                    );
                  })}
                  <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/90 font-sports text-[10px] font-black text-white shadow-lg sm:h-10 sm:w-10 sm:text-sm">
                    VS
                  </div>
                </div>

                {match.status === 'LIVE' && (
                  <div className="space-y-3 border-t border-slate-800/80 bg-red-950/15 p-4">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-950/30 p-2.5 text-xs">
                      <span className="truncate font-bold text-amber-300">
                        ⚡ {match.equation}
                      </span>
                      <span className="shrink-0 font-mono text-slate-300">
                        Target: {match.team1?.target || 192}
                      </span>
                    </div>

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

                {match.status === 'UPCOMING' && (
                  <div className="space-y-3 border-t border-slate-800/80 bg-blue-950/15 p-4">
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-blue-600/20 bg-blue-950/30 p-3">
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

                <div className="relative flex min-h-[58px] flex-col gap-2 overflow-hidden border-t border-slate-800/80 bg-[#071638] px-4 py-2 text-xs text-slate-100 sm:min-h-[62px] sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="relative z-10 min-w-0">
                    <p className="truncate font-bold text-white">
                      {match.tournamentPhase} • {match.date}{match.time ? `, ${match.time}` : ''}
                    </p>
                    <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-slate-400">
                      <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                      <span className="truncate">{match.venue}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => openModal('match-details', match)}
                    className="relative z-10 flex shrink-0 items-center gap-1 rounded-full bg-slate-800/80 px-3 py-1.5 font-sports text-xs tracking-wider text-white transition-colors hover:bg-slate-700 hover:text-amber-300"
                  >
                    <span>Match Center</span>
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
