import React, { useState, useMemo } from 'react';
import { useNpl } from '../context/NplContext';
import { Search, UserCheck, Shield, Zap, Target, Filter } from 'lucide-react';

export const PlayerSection = () => {
  const { teams, openModal } = useNpl();
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all players across all teams into a unified list
  const allPlayers = useMemo(() => {
    const list = [];
    teams.forEach(team => {
      if (team.squad) {
        team.squad.forEach(player => {
          list.push({
            ...player,
            teamId: team.id,
            teamName: team.name,
            teamShort: team.shortName,
            teamColor: team.primaryColor,
            strikeRate: player.strikeRate || (player.role === 'Bowler' ? '112.5' : '148.6'),
            economy: player.economy || (player.wickets > 0 ? '6.85' : '-'),
            bestScore: player.bestScore || (player.runs > 500 ? '94*' : '58*'),
            bestBowling: player.bestBowling || (player.wickets > 20 ? '4/18' : '2/24'),
            photo: player.photo || `https://images.unsplash.com/photo-${1500000000000 + (player.id.charCodeAt(1) || 50) * 1234567}?auto=format&fit=crop&w=400&q=80`
          });
        });
      }
    });
    return list;
  }, [teams]);

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
    if (selectedTeam !== 'ALL' && p.teamId !== selectedTeam) return false;

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
    <section id="players" className="py-20 bg-[#050B17] border-t border-slate-800">
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

          <div className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 rounded-xl self-start md:self-auto">
            Showing {filteredPlayers.length} Players
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
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              aria-label="Filter by franchise team"
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Teams</option>
              {teams.map(t => (
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
              className="glass-panel-card rounded-2xl p-5 border border-slate-800 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer group flex flex-col justify-between shadow-xl"
            >
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
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                      alt={player.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {player.name}
                    </h3>
                    <span className="text-[11px] text-slate-400 block line-clamp-1">
                      {player.style}
                    </span>
                  </div>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs">
                  <div className="bg-slate-950/80 p-2 rounded-lg text-center">
                    <span className="text-[10px] text-slate-400 uppercase block">Total Runs</span>
                    <span className="font-sports text-lg text-amber-400 leading-none">{player.runs || 0}</span>
                  </div>

                  <div className="bg-slate-950/80 p-2 rounded-lg text-center">
                    <span className="text-[10px] text-slate-400 uppercase block">Wickets</span>
                    <span className="font-sports text-lg text-purple-400 leading-none">{player.wickets || 0}</span>
                  </div>

                  <div className="bg-slate-950/80 p-2 rounded-lg text-center">
                    <span className="text-[10px] text-slate-400 uppercase block">Strike Rate</span>
                    <span className="font-mono text-xs font-semibold text-slate-200">{player.strikeRate}</span>
                  </div>

                  <div className="bg-slate-950/80 p-2 rounded-lg text-center">
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
