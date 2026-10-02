import React from 'react';
import { useNpl } from '../context/NplContext';
import { TeamBadge } from './TeamBadge';
import { Trophy, Info } from 'lucide-react';

export const PointsTable = () => {
  const { pointsTable, seasonStandings, seasons, selectedSeason, setSelectedSeason, teams, openModal } = useNpl();
  const seasonInfo = seasons.find((season) => season.edition === selectedSeason) || seasons[0];
  const visiblePointsTable = seasonStandings[selectedSeason]
    || (selectedSeason === seasons[0]?.edition ? pointsTable : []);

  return (
    <section id="standings" className="py-20 bg-[#060D1E] border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-widest uppercase mb-3">
              <Trophy className="w-3.5 h-3.5" />
              <span>NPL {seasonInfo?.edition || 'SEASON'} STANDINGS</span>
            </div>
            <h2 className="font-sports text-4xl sm:text-5xl lg:text-6xl text-white tracking-wide uppercase leading-none">
              POINTS <span className="text-gold-gradient">TABLE</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Top 4 teams qualify for the championship playoffs. Updated after every concluded match.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Session
              <select
                value={seasonInfo?.edition || ''}
                onChange={(event) => setSelectedSeason(event.target.value)}
                className="min-w-36 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold normal-case text-white focus:border-amber-500 focus:outline-none"
              >
                {seasons.map((season) => (
                  <option key={season.edition} value={season.edition}>{season.edition} ({season.year || season.season})</option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 self-start md:self-auto">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500 inline-block"></span>
                <span className="text-slate-200">Playoffs (Top 4)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700 inline-block"></span>
                <span className="text-slate-400">Eliminated</span>
              </div>
            </div>
          </div>
        </div>

        {seasonInfo?.sampleData && (
          <p className="mb-3 text-xs font-semibold text-amber-300">Sample {seasonInfo.edition} records — replace with official data when available.</p>
        )}

        {/* Responsive Table Container */}
        <div className="glass-panel-card rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-4 sm:px-6 text-center w-12 sm:w-16">POS</th>
                  <th className="py-4 px-4 sm:px-6">TEAM</th>
                  <th className="py-4 px-3 text-center">P</th>
                  <th className="py-4 px-3 text-center text-emerald-400 font-bold">W</th>
                  <th className="py-4 px-3 text-center text-rose-400 font-bold">L</th>
                  <th className="py-4 px-3 text-center">NR</th>
                  <th className="py-4 px-3 text-center">NRR</th>
                  <th className="py-4 px-4 text-center text-amber-400 font-black">PTS</th>
                  <th className="py-4 px-4 text-center hidden md:table-cell">RECENT FORM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm font-medium">
                {visiblePointsTable.map((row, index) => {
                  const isTopFour = index < 4;
                  const teamObj = teams.find(t => t.id === row.teamId);

                  return (
                    <tr
                      key={row.teamId}
                      className={`transition-colors duration-200 hover:bg-slate-800/40 ${
                        isTopFour ? "bg-emerald-950/5" : ""
                      }`}
                    >
                      {/* POS with green indicator bar for top 4 */}
                      <td className="py-4 px-4 sm:px-6 text-center relative">
                        {isTopFour && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                        )}
                        <span className={`font-sports text-lg sm:text-xl ${isTopFour ? "text-amber-400 font-bold" : "text-slate-400"}`}>
                          {row.pos}
                        </span>
                      </td>

                      {/* TEAM NAME & BADGE */}
                      <td className="py-4 px-4 sm:px-6">
                        <div
                          onClick={() => teamObj && openModal('team-details', teamObj)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <TeamBadge team={teamObj || row} size="sm" />
                          <div>
                            <div className="font-heading font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                              <span>{row.team}</span>
                              {isTopFour && (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-600/30">
                                  Q
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 hidden sm:inline">
                              {teamObj?.home || "Bengal"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* PLAYED */}
                      <td className="py-4 px-3 text-center text-slate-300 font-semibold font-mono">
                        {row.p}
                      </td>

                      {/* WON */}
                      <td className="py-4 px-3 text-center text-emerald-400 font-bold font-mono">
                        {row.w}
                      </td>

                      {/* LOST */}
                      <td className="py-4 px-3 text-center text-rose-400 font-bold font-mono">
                        {row.l}
                      </td>

                      {/* NO RESULT */}
                      <td className="py-4 px-3 text-center text-slate-400 font-mono">
                        {row.nr}
                      </td>

                      {/* NET RUN RATE */}
                      <td className="py-4 px-3 text-center font-mono text-xs font-semibold text-slate-300">
                        <span className={row.nrr.startsWith('+') ? "text-emerald-400" : "text-rose-400"}>
                          {row.nrr}
                        </span>
                      </td>

                      {/* POINTS */}
                      <td className="py-4 px-4 text-center">
                        <span className="font-sports text-2xl text-amber-400 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 font-bold">
                          {row.pts}
                        </span>
                      </td>

                      {/* FORM GUIDE */}
                      <td className="py-4 px-4 text-center hidden md:table-cell">
                        <div className="flex items-center justify-center gap-1.5">
                          {row.form?.map((result, i) => (
                            <span
                              key={i}
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                                result === 'W'
                                  ? "bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                  : "bg-rose-600"
                              }`}
                            >
                              {result}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Criteria info */}
          <div className="bg-slate-950/90 px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400" />
              <span>Tie-breaker priority: 1. Points, 2. Wins, 3. Net Run Rate (NRR), 4. Head-to-Head</span>
            </div>
            <span className="text-slate-400 font-medium">
              Top 4 Advance to Qualifier 1 & Eliminator
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
