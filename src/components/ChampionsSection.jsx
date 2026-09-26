import React, { useState } from 'react';
import { useNpl } from '../context/NplContext';
import { TeamBadge } from './TeamBadge';
import { Trophy, Award, ChevronLeft, ChevronRight, Sparkles, Eye, Medal } from 'lucide-react';

export const ChampionsSection = () => {
  const { champions, teams, openModal, siteMedia } = useNpl();
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevChampion = () => {
    setCurrentIndex(prev => (prev === 0 ? champions.length - 1 : prev - 1));
  };

  const nextChampion = () => {
    setCurrentIndex(prev => (prev === champions.length - 1 ? 0 : prev + 1));
  };

  const activeChampion = champions[currentIndex] || champions[0];
  const championTeamObj = teams.find(t => t.shortName === activeChampion.championShort);

  return (
    <section id="champions" className="py-20 relative bg-gradient-to-b from-[#050B17] via-[#091329] to-[#050B17] overflow-hidden">
      {/* Background radial gold glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-widest uppercase mb-3">
              <Trophy className="w-3.5 h-3.5" />
              <span>HALL OF GLORY</span>
            </div>
            <h2 className="font-sports text-4xl sm:text-5xl lg:text-6xl text-white tracking-wide uppercase leading-none">
              NPL <span className="text-gold-gradient">CHAMPIONS</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-xl">
              Honoring the legendary teams who conquered the pressure, conquered the arena, and lifted the coveted Narua Premier League Trophy.
            </p>
          </div>

          {/* Carousel Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevChampion}
              className="p-3 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-500/50 transition-colors shadow-lg"
              aria-label="Previous Champion"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-sports tracking-wider px-3 text-amber-400">
              {currentIndex + 1} / {champions.length}
            </span>
            <button
              onClick={nextChampion}
              className="p-3 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-500/50 transition-colors shadow-lg"
              aria-label="Next Champion"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Featured Champion Highlight Card */}
        {activeChampion && (
          <div className="glass-panel-gold rounded-3xl p-6 sm:p-10 border border-amber-500/40 shadow-2xl relative overflow-hidden group">
            {/* Ambient gold glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/15 rounded-full blur-[100px] pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Team Photograph & Trophy Badge */}
              <div className="lg:col-span-6 relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-500/30">
                  <img
                    src={siteMedia[`champion:${currentIndex}`] || activeChampion.teamPhoto}
                    alt={`${activeChampion.championTeam} Champions`}
                    className="w-full h-[320px] sm:h-[400px] object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/stadium.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  {/* Season Badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-950/90 border border-amber-500/60 px-3.5 py-1.5 rounded-full shadow-xl">
                    <Medal className="w-4 h-4 text-amber-400" />
                    <span className="font-sports text-lg text-amber-300 tracking-wider">
                      NPL {activeChampion.season} • {activeChampion.edition}
                    </span>
                  </div>

                  {/* Trophy floating badge */}
                  <div className="absolute bottom-4 right-4 flex items-center gap-3 bg-slate-950/90 border border-amber-500/50 p-2.5 rounded-2xl shadow-xl backdrop-blur-md">
                    <img
                      src={siteMedia.trophy || "/assets/trophy.jpg"}
                      alt="NPL Trophy"
                      className="w-12 h-14 object-cover rounded-lg border border-amber-500/40"
                    />
                    <div>
                      <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold block">
                        PRIZE
                      </span>
                      <span className="font-sports text-base text-white">
                        NPL TROPHY
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Champion Details & Stats */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <TeamBadge team={championTeamObj} size="lg" />
                    <div>
                      <span className="text-xs font-bold text-amber-400 tracking-widest uppercase block">
                        CROWNED CHAMPIONS
                      </span>
                      <h3 className="font-sports text-4xl sm:text-5xl text-white tracking-wide leading-none">
                        {activeChampion.championTeam}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed mt-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                    "{activeChampion.description}"
                  </p>
                </div>

                {/* Match Final Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Winning Captain
                    </span>
                    <span className="font-heading font-bold text-white text-base mt-0.5 block">
                      {activeChampion.captain}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Final Opponent
                    </span>
                    <span className="font-heading font-bold text-slate-200 text-base mt-0.5 block">
                      {activeChampion.runnerUp}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                      Winning Margin
                    </span>
                    <span className="font-heading font-bold text-amber-300 text-base mt-0.5 block">
                      {activeChampion.winningMargin}
                    </span>
                  </div>
                </div>

                {/* Player of the Final & Final Scoreline */}
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                      PLAYER OF THE FINAL
                    </span>
                    <span className="font-sports text-xl text-white tracking-wider">
                      {activeChampion.playerOfFinal}
                    </span>
                  </div>

                  <div className="text-right sm:border-l sm:border-amber-500/30 sm:pl-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      FINAL VENUE
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      {activeChampion.venue}
                    </span>
                  </div>
                </div>

                {/* View Season Button */}
                <div className="pt-2 flex items-center gap-4">
                  <button
                    onClick={() => openModal('match-details', {
                      status: 'COMPLETED',
                      matchNumber: `NPL ${activeChampion.season} Grand Final`,
                      tournamentPhase: "Championship Final",
                      venue: activeChampion.venue,
                      date: `${activeChampion.season} Final`,
                      team1: { name: activeChampion.championTeam, shortName: activeChampion.championShort, score: activeChampion.finalScores.split('|')[0] || "" },
                      team2: { name: activeChampion.runnerUp, shortName: activeChampion.runnerUpShort, score: activeChampion.finalScores.split('|')[1] || "" },
                      result: `${activeChampion.championTeam} ${activeChampion.winningMargin}`,
                      playerOfMatch: { name: activeChampion.playerOfFinal, performance: "Match Winning Knock", photo: activeChampion.teamPhoto }
                    })}
                    className="px-6 py-3 rounded-xl font-sports text-base tracking-wider uppercase bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-amber-500/30"
                  >
                    <Eye className="w-4 h-4 text-slate-950" />
                    <span>VIEW FINAL SCORECARD</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Small Carousel Selector Cards Below */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {champions.map((champ, idx) => (
            <div
              key={champ.season}
              onClick={() => setCurrentIndex(idx)}
              className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between border ${
                currentIndex === idx
                  ? "bg-slate-900 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="font-sports text-3xl text-amber-400">
                  {champ.season}
                </div>
                <div>
                  <h4 className="font-sports text-lg text-white leading-none">
                    {champ.championTeam}
                  </h4>
                  <span className="text-xs text-slate-400 mt-1 block">
                    Defeated {champ.runnerUp}
                  </span>
                </div>
              </div>

              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                currentIndex === idx ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400"
              }`}>
                {currentIndex === idx ? "VIEWING" : "SELECT"}
              </span>
            </div>
          ))}

          {/* Season 2026 In-progress card */}
          <div className="p-4 rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="font-sports text-3xl text-slate-500">
                2026
              </div>
              <div>
                <h4 className="font-sports text-lg text-slate-300 leading-none">
                  NPL SEASON 3
                </h4>
                <span className="text-xs text-amber-400/90 mt-1 block font-semibold">
                  Auction & Championship Ahead
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              NEXT UP
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
