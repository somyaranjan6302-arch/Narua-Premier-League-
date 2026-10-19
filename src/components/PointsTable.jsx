import React, { useEffect, useState } from 'react';
import { useNpl } from '../context/NplContext';
import { TeamBadge } from './TeamBadge';
import { Trophy, Info } from 'lucide-react';

const previewTeamLogo = '/uploads/points-table-team-logo-preview.png';

export const PointsTable = () => {
  const { pointsTable, seasonStandings, seasons, selectedSeason, setSelectedSeason, teams } = useNpl();
  const [demoStandings, setDemoStandings] = useState(null);
  const [demoStandingsError, setDemoStandingsError] = useState('');
  const showDemoStandings = import.meta.env.DEV
    && new URLSearchParams(window.location.search).get('demoStandings') === '1';
  const seasonInfo = seasons.find((season) => season.edition === selectedSeason) || seasons[0];
  const visiblePointsTable = showDemoStandings
    ? demoStandings || []
    : seasonStandings[selectedSeason] || (selectedSeason === seasons[0]?.edition ? pointsTable : []);

  useEffect(() => {
    if (!showDemoStandings) return undefined;

    const controller = new AbortController();
    fetch('/local-demo-standings.json', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Demo standings request failed (${response.status}).`);
        return response.json();
      })
      .then((rows) => {
        if (!Array.isArray(rows)) throw new Error('Demo standings data must be a list of rows.');
        setDemoStandings(rows);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setDemoStandingsError(error.message);
      });

    return () => controller.abort();
  }, [showDemoStandings]);

  return (
    <section id="standings" className="npl-section-bg border-t border-slate-800 py-20">
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
        {showDemoStandings && (
          <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-center text-xs font-bold text-amber-200">
            Demo preview only — local sample standings are not saved and are never shown on the live site.
          </p>
        )}

        {demoStandingsError && showDemoStandings && (
          <p role="alert" className="mb-4 rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-center text-sm font-semibold text-rose-200">
            Could not load the local demo standings: {demoStandingsError}
          </p>
        )}

        <div className="glass-panel-card overflow-hidden rounded-[2rem] border border-amber-400/15 shadow-2xl shadow-slate-950/50 ring-1 ring-white/5">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left border-collapse md:table-auto md:min-w-[44rem]">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="w-[8%] py-4 px-1 text-center md:w-10 md:px-2">POS</th>
                  <th className="w-[42%] py-4 px-1 sm:px-2 md:w-auto md:px-6">TEAM</th>
                  <th className="w-[9%] py-4 px-1 text-center md:w-auto md:px-3">P</th>
                  <th className="hidden py-4 px-3 text-center text-emerald-400 font-bold md:table-cell">W</th>
                  <th className="hidden py-4 px-3 text-center text-rose-400 font-bold md:table-cell">L</th>
                  <th className="hidden py-4 px-3 text-center md:table-cell">NR</th>
                  <th className="w-[17%] py-4 px-1 text-center md:hidden">W-L-NR</th>
                  <th className="w-[14%] py-4 px-1 text-center md:w-auto md:px-3">NRR</th>
                  <th className="w-[10%] py-4 px-1 text-center text-amber-400 font-black md:w-auto md:px-4">PTS</th>
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
                      <td className="py-4 px-1 text-center relative md:px-2">
                        {isTopFour && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                        )}
                        <span className={`font-sports text-lg sm:text-xl ${isTopFour ? "text-amber-400 font-bold" : "text-slate-400"}`}>
                          {row.pos}
                        </span>
                      </td>

                      {/* TEAM NAME & BADGE */}
                      <td className="min-w-0 py-4 px-1 sm:px-2 md:min-w-48 md:px-6">
                        <a
                          href={teamObj ? `/?team=${encodeURIComponent(teamObj.id)}&season=${encodeURIComponent(selectedSeason)}` : undefined}
                          target={teamObj ? '_blank' : undefined}
                          rel={teamObj ? 'noopener noreferrer' : undefined}
                          className={`flex min-w-0 items-center gap-1 sm:gap-2 md:gap-3 group ${teamObj ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          <TeamBadge
                            team={teamObj || row}
                            size="sm"
                            sizeClassName="md:h-16 md:w-16 md:text-base"
                            logoSrcOverride={previewTeamLogo}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 font-heading text-[10px] font-bold leading-tight text-white transition-colors group-hover:text-amber-400 sm:text-sm md:gap-1.5">
                              <span className="whitespace-normal break-words" title={row.team}>{row.short || teamObj?.shortName || row.team}</span>
                              {isTopFour && (
                                <span className="shrink-0 rounded border border-emerald-600/30 bg-emerald-950/60 px-1 text-[9px] font-bold text-emerald-400 sm:px-1.5 sm:text-[10px]">
                                  Q
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 hidden sm:inline">
                              {teamObj?.home || "Bengal"}
                            </span>
                          </div>
                        </a>
                      </td>

                      {/* PLAYED */}
                      <td className="py-4 px-1 text-center text-slate-300 font-semibold font-mono md:px-3">
                        {row.p}
                      </td>

                      {/* WON */}
                      <td className="hidden py-4 px-3 text-center text-emerald-400 font-bold font-mono md:table-cell">
                        {row.w}
                      </td>

                      {/* LOST */}
                      <td className="hidden py-4 px-3 text-center text-rose-400 font-bold font-mono md:table-cell">
                        {row.l}
                      </td>

                      {/* NO RESULT */}
                      <td className="hidden py-4 px-3 text-center text-slate-400 font-mono md:table-cell">
                        {row.nr}
                      </td>

                      {/* Combined match record on mobile */}
                      <td className="py-4 px-1 text-center text-slate-200 font-bold font-mono whitespace-nowrap md:hidden">
                        {row.w}-{row.l}-{row.nr}
                      </td>

                      {/* NET RUN RATE */}
                      <td className="py-4 px-1 text-center font-mono text-[10px] sm:text-xs font-semibold text-slate-300 md:px-3">
                        <span className={row.nrr.startsWith('+') ? "text-emerald-400" : "text-rose-400"}>
                          {row.nrr}
                        </span>
                      </td>

                      {/* POINTS */}
                      <td className="py-4 px-1 text-center md:px-4">
                        <span className="font-sports text-xl md:text-2xl text-amber-400 px-1.5 md:px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 font-bold">
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
