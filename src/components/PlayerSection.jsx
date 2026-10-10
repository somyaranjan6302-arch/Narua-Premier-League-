import React, { useState, useMemo } from 'react';
import { useNpl } from '../context/NplContext';
import { SessionSelector } from './SessionSelector';
import { Search, UserCheck } from 'lucide-react';
import { getSiteMedia } from '../utils/siteMedia';
import { PlayerPortrait } from './PlayerPortrait';

export const PlayerSection = () => {
  const { teams, openModal, seasons, selectedSeason, setSelectedSeason, siteMedia } = useNpl();
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const sessionTeams = useMemo(() => teams.filter((team) => {
    const teamSessions = Array.isArray(team.sessions)
      ? team.sessions
      : Array.isArray(team.seasons)
        ? team.seasons
        : team.session
          ? [team.session]
          : seasons.map((season) => season.edition);
    return teamSessions.includes(selectedSeason);
  }), [teams, seasons, selectedSeason]);
  const activeSelectedTeam = sessionTeams.some((team) => team.id === selectedTeam) ? selectedTeam : 'ALL';

  // Extract players for the active session into a unified list.
  const allPlayers = useMemo(() => {
    const list = [];
    sessionTeams.forEach(team => {
      if (team.squad) {
        team.squad.forEach(player => {
          list.push({
            ...player,
            teamId: team.id,
            teamName: team.name,
            teamShort: team.shortName,
            season: selectedSeason,
            teamColor: team.primaryColor,
            teamSecondaryColor: team.secondaryColor,
            teamLogo: getSiteMedia(siteMedia, `team-logo:${team.id}`, selectedSeason, team.logo),
            strikeRate: player.strikeRate || (player.role === 'Bowler' ? '112.5' : '148.6'),
            economy: player.economy || (player.wickets > 0 ? '6.85' : '-'),
            bestScore: player.bestScore || (player.runs > 500 ? '94*' : '58*'),
            bestBowling: player.bestBowling || (player.wickets > 20 ? '4/18' : '2/24'),
            photo: getSiteMedia(siteMedia, `player-photo:${team.id}-${player.id}`, selectedSeason, player.photo)
          });
        });
      }
    });
    return list;
  }, [sessionTeams, siteMedia, selectedSeason]);

  // Filtering
  const filteredPlayers = allPlayers.filter(p => {
    // Role filter
    if (selectedRole !== 'ALL') {
      if (selectedRole === 'BATTERS' && p.role !== 'Batsman') return false;
      if (selectedRole === 'BOWLERS' && p.role !== 'Bowler') return false;
      if (selectedRole === 'ALL-ROUNDERS' && p.role !== 'All-Rounder') return false;
      if (selectedRole === 'WICKETKEEPERS' && p.role !== 'Wicketkeeper') return false;
    }

    // Team filter
    if (activeSelectedTeam !== 'ALL' && p.teamId !== activeSelectedTeam) return false;

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchTeam = p.teamName?.toLowerCase().includes(q) || p.teamShort?.toLowerCase().includes(q);
      if (!matchName && !matchTeam) return false;
    }

    return true;
  });

  const roles = [
    { id: 'ALL', label: 'ALL PLAYERS' },
    { id: 'BATTERS', label: 'BATTERS' },
    { id: 'BOWLERS', label: 'BOWLERS' },
    { id: 'ALL-ROUNDERS', label: 'ALL-ROUNDERS' },
    { id: 'WICKETKEEPERS', label: 'WICKETKEEPERS' }
  ];

  return (
    <section id="players" className="py-20 bg-[var(--color-npl-navy)] border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-600/40 text-blue-400 text-xs font-bold tracking-widest uppercase mb-3">
              <UserCheck className="w-3.5 h-3.5" />
              <span>OFFICIAL PLAYER ROSTER</span>
            </div>
            <h2 className="font-sports text-4xl sm:text-5xl lg:text-6xl text-white tracking-wide uppercase leading-none">
              NPL <span className="text-gold-gradient">PLAYERS</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Explore profiles, roles, and career statistics of tournament athletes.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <SessionSelector seasons={seasons} selectedSeason={selectedSeason} setSelectedSeason={setSelectedSeason} />
            <div className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 rounded-xl self-start md:self-auto">
              Showing {filteredPlayers.length} Players
            </div>
          </div>
        </div>

        {/* Filter and Search Bar Controls */}
        <div className="glass-panel-card p-4 rounded-2xl border border-slate-800 mb-8 flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Role Tabs */}
          <div className="flex flex-wrap gap-1.5 w-full lg:w-auto">
            {roles.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  selectedRole === r.id
                    ? "bg-amber-500 text-slate-950 font-black shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Search and Team Filter */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            {/* Search Box */}
            <div className="relative flex-grow sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search player or team..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Team Dropdown */}
            <select
              value={activeSelectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              aria-label="Filter by franchise team"
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Teams</option>
              {sessionTeams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.shortName} - {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPlayers.map((player) => (
            <div
              key={`${player.teamId}-${player.id}`}
              onClick={() => openModal('player-profile', player)}
              className="glass-panel-card relative overflow-hidden rounded-2xl p-5 border border-slate-700/70 hover:border-amber-400/70 transition-all duration-300 hover:-translate-y-1 cursor-pointer group flex flex-col justify-between shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openModal('player-profile', player);
                }
              }}
            >
              <div className="absolute inset-x-0 top-0 h-1 opacity-80" style={{ backgroundColor: player.teamColor || '#F59E0B' }} />
              <div>
                {/* Header: Role Badge and Team Pill */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    {player.role}
                  </span>

                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white"
                    style={{ backgroundColor: player.teamColor || '#F59E0B' }}
                  >
                    {player.teamShort}
                  </span>
                </div>

                {/* Player Name and Style */}
                <div className="flex items-center gap-3.5">
                  <div className="relative w-16 h-16 rounded-2xl bg-slate-800 overflow-hidden flex-shrink-0 border border-amber-400/40 ring-2 ring-slate-950 shadow-lg">
                    <PlayerPortrait photo={player.photo} alt={player.name} teamColor={player.teamColor} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold text-base text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-tight">
                      {player.name}
                    </h3>
                    <span className="text-[11px] text-slate-400 block line-clamp-1 mt-1">
                      {player.style}
                    </span>
                  </div>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs">
                  <div className="bg-slate-950/65 p-2.5 rounded-xl text-center border border-white/[0.04]">
                    <span className="text-[10px] text-slate-400 uppercase block">Total Runs</span>
                    <span className="font-sports text-lg text-amber-400 leading-none">{player.runs || 0}</span>
                  </div>

                  <div className="bg-slate-950/65 p-2.5 rounded-xl text-center border border-white/[0.04]">
                    <span className="text-[10px] text-slate-400 uppercase block">Wickets</span>
                    <span className="font-sports text-lg text-purple-400 leading-none">{player.wickets || 0}</span>
                  </div>

                  <div className="bg-slate-950/65 p-2.5 rounded-xl text-center border border-white/[0.04]">
                    <span className="text-[10px] text-slate-400 uppercase block">Strike Rate</span>
                    <span className="font-mono text-xs font-semibold text-slate-200">{player.strikeRate}</span>
                  </div>

                  <div className="bg-slate-950/65 p-2.5 rounded-xl text-center border border-white/[0.04]">
                    <span className="text-[10px] text-slate-400 uppercase block">Best Score</span>
                    <span className="font-mono text-xs font-semibold text-slate-200">{player.bestScore}</span>
                  </div>
                </div>
              </div>

              {/* View Profile */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 text-center">
                <span className="text-[11px] font-bold text-amber-400 group-hover:text-amber-300">
                  VIEW FULL CAREER STATS →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
