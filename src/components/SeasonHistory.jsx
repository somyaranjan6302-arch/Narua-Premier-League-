import React, { useState } from 'react';
import { useNpl } from '../context/NplContext';
import { Calendar, Trophy, Award, Users, Flame, ChevronRight } from 'lucide-react';

export const SeasonHistory = () => {
  const { seasons } = useNpl();
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]?.season || "2026");

  const currentSeasonData = seasons.find(s => s.season === selectedSeason) || seasons[0];

  return (
    <section id="history" className="py-20 bg-[#060D1E] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-600/40 text-blue-400 text-xs font-bold tracking-widest uppercase mb-3">
            <Calendar className="w-3.5 h-3.5" />
            <span>SEASON ARCHIVE</span>
          </div>
          <h2 className="font-sports text-4xl sm:text-5xl lg:text-6xl text-white tracking-wide uppercase leading-none">
            TOURNAMENT <span className="text-gold-gradient">HISTORY</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-2">
            Every season documented with champion rosters, cap winners, and milestone tournament statistics.
          </p>
        </div>

        {/* Season Selector Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-900 border border-slate-800 gap-2">
            {seasons.map((s) => (
              <button
                key={s.season}
                onClick={() => setSelectedSeason(s.season)}
                className={`px-5 py-2.5 rounded-xl font-sports text-lg sm:text-xl tracking-wider transition-all duration-200 ${
                  selectedSeason === s.season
                    ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                NPL {s.season}
              </button>
            ))}
          </div>
        </div>

        {/* Season Information Board */}
        {currentSeasonData && (
          <div className="glass-panel-card rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl">
            {/* Top header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
              <div>
                <span className="text-xs font-bold text-amber-400 tracking-widest uppercase block">
                  {currentSeasonData.edition}
                </span>
                <h3 className="font-sports text-4xl sm:text-5xl text-white tracking-wider mt-1">
                  NPL {currentSeasonData.season} SEASON SUMMARY
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Teams</span>
                  <span className="font-sports text-2xl text-amber-400">{currentSeasonData.teamsCount}</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Matches</span>
                  <span className="font-sports text-2xl text-white">{currentSeasonData.matchesCount}</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-blue-950/60 border border-blue-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-300 block">Status</span>
                  <span className="text-xs font-bold text-blue-400 block mt-1">{currentSeasonData.status}</span>
                </div>
              </div>
            </div>

            {/* Grid of Season Honors & Awards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
              {/* Champion Card */}
              <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 p-5 rounded-2xl border border-amber-500/30 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
                    TOURNAMENT CHAMPION
                  </span>
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>
                <h4 className="font-sports text-3xl text-white tracking-wide">
                  {currentSeasonData.champion}
                </h4>
                <p className="text-xs text-slate-400 mt-2">
                  Lifting the championship trophy and claiming regional supremacy.
                </p>
              </div>

              {/* Runner-up Card */}
              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                    RUNNER-UP
                  </span>
                  <Award className="w-5 h-5 text-slate-400" />
                </div>
                <h4 className="font-sports text-3xl text-slate-200 tracking-wide">
                  {currentSeasonData.runnerUp}
                </h4>
                <p className="text-xs text-slate-400 mt-2">
                  Grand finalists after a grueling tournament campaign.
                </p>
              </div>

              {/* Player of the Tournament */}
              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold tracking-widest text-purple-400 uppercase">
                    PLAYER OF TOURNAMENT
                  </span>
                  <Award className="w-5 h-5 text-purple-400" />
                </div>
                <h4 className="font-sports text-2xl text-white tracking-wide">
                  {currentSeasonData.playerOfTournament}
                </h4>
                <p className="text-xs text-slate-400 mt-2">
                  Most impactful all-round player of the edition.
                </p>
              </div>

              {/* Orange Cap (Top Run Scorer) */}
              <div className="bg-gradient-to-r from-orange-950/40 to-slate-900 p-5 rounded-2xl border border-orange-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold tracking-widest text-orange-400 uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    TOP RUN SCORER (ORANGE CAP)
                  </span>
                </div>
                <h4 className="font-sports text-2xl text-white tracking-wide">
                  {currentSeasonData.topScorer}
                </h4>
              </div>

              {/* Purple Cap (Top Wicket Taker) */}
              <div className="bg-gradient-to-r from-purple-950/40 to-slate-900 p-5 rounded-2xl border border-purple-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold tracking-widest text-purple-400 uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    TOP WICKET TAKER (PURPLE CAP)
                  </span>
                </div>
                <h4 className="font-sports text-2xl text-white tracking-wide">
                  {currentSeasonData.topWicketTaker}
                </h4>
              </div>

              {/* Season Narrative */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-center">
                <span className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1">
                  EDITION HIGHLIGHT
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "{currentSeasonData.description}"
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
