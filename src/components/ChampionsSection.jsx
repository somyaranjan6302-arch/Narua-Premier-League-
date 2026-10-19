import React, { useState } from 'react';
import { useNpl } from '../context/NplContext';
import { SessionSelector } from './SessionSelector';
import { Trophy, ChevronLeft, ChevronRight, Eye, Medal, MapPin } from 'lucide-react';
import { getChampionFallbackMedia, getChampionMediaKey, getSiteMedia } from '../utils/siteMedia';

const getEditionKey = (edition) => String(edition || '').match(/Season\s*\d+/i)?.[0].replace(/\s+/g, ' ') || edition;

export const ChampionsSection = () => {
  const { champions, openModal, siteMedia, seasons, selectedSeason, setSelectedSeason } = useNpl();
  const [currentIndex, setCurrentIndex] = useState(0);
  const sessionChampions = champions.filter((champion) => getEditionKey(champion.edition) === selectedSeason);
  const sessionChampionIndex = Math.min(currentIndex, Math.max(0, sessionChampions.length - 1));

  const prevChampion = () => {
    setCurrentIndex(sessionChampionIndex === 0 ? sessionChampions.length - 1 : sessionChampionIndex - 1);
  };

  const nextChampion = () => {
    setCurrentIndex(sessionChampionIndex === sessionChampions.length - 1 ? 0 : sessionChampionIndex + 1);
  };

  const activeChampion = sessionChampions[sessionChampionIndex];
  const finalScoreEntries = activeChampion?.finalScores?.split('|').map((score) => score.trim()) || [];
  const hasFinalScores = finalScoreEntries.length === 2 && finalScoreEntries.every(Boolean);

  return (
    <section id="champions" className="npl-section-bg relative overflow-hidden py-20">
      {/* Background radial gold glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <SessionSelector seasons={seasons} selectedSeason={selectedSeason} setSelectedSeason={setSelectedSeason} />
            <div className="flex items-center gap-2">
            <button
              onClick={prevChampion}
              disabled={sessionChampions.length < 2}
              className="p-3 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-500/50 transition-colors shadow-lg"
              aria-label="Previous Champion"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-sports tracking-wider px-3 text-amber-400">
              {sessionChampions.length > 0 ? `${sessionChampionIndex + 1} / ${sessionChampions.length}` : '0 / 0'}
            </span>
            <button
              onClick={nextChampion}
              disabled={sessionChampions.length < 2}
              className="p-3 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-500/50 transition-colors shadow-lg"
              aria-label="Next Champion"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            </div>
          </div>
        </div>

        {/* Featured champion match report */}
        {activeChampion ? (
          <div className="grid overflow-hidden border border-slate-800 bg-[#061538] shadow-2xl lg:min-h-[440px] lg:grid-cols-2">
            <div className="flex flex-col items-start justify-center p-6 sm:p-10 lg:px-12">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-950/80 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-sky-300 ring-1 ring-sky-400/20">
                <Medal className="h-4 w-4 text-amber-400" />
                NPL {activeChampion.season} · {activeChampion.edition}
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
                Championship final · Match report
              </p>
              <h3 className="mt-2 font-heading text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">
                {activeChampion.championTeam} lift the NPL trophy
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-200 sm:text-base">
                {activeChampion.description}
              </p>
              <div className="mt-5 grid w-full grid-cols-1 gap-3 border-t border-slate-700 pt-4 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-950/50 p-3">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-sky-300">Final result</span>
                  <span className="mt-1 block text-sm font-bold leading-relaxed text-white">{activeChampion.finalScores || 'Final scores unavailable'}</span>
                </div>
                <div className="rounded-lg bg-slate-950/50 p-3">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-amber-300">Winning margin</span>
                  <span className="mt-1 block text-sm font-bold text-white">{activeChampion.winningMargin}</span>
                  <span className="mt-1 flex items-center gap-1 text-xs text-slate-300">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    {activeChampion.venue}
                  </span>
                </div>
              </div>
              {hasFinalScores ? (
                <button
                  type="button"
                  onClick={() => openModal('match-details', {
                    status: 'COMPLETED',
                    matchNumber: `NPL ${activeChampion.season} Grand Final`,
                    tournamentPhase: 'Championship Final',
                    venue: activeChampion.venue,
                    date: `${activeChampion.season} Final`,
                    team1: { name: activeChampion.championTeam, shortName: activeChampion.championShort, score: finalScoreEntries[0] },
                    team2: { name: activeChampion.runnerUp, shortName: activeChampion.runnerUpShort, score: finalScoreEntries[1] },
                    result: `${activeChampion.championTeam} ${activeChampion.winningMargin}`,
                    playerOfMatch: { name: activeChampion.playerOfFinal, performance: 'Match Winning Knock', photo: activeChampion.teamPhoto }
                  })}
                  className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-sky-400 px-6 text-sm font-extrabold text-[#061538] transition hover:bg-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  <Eye className="h-4 w-4" />
                  View Final Scorecard
                </button>
              ) : (
                <p className="mt-6 text-xs font-semibold text-slate-400">Final scorecard unavailable; final scores were not provided.</p>
              )}
            </div>
            <div className="relative min-h-64 overflow-hidden bg-slate-900 sm:min-h-80 lg:min-h-full">
              <img
                src={getSiteMedia(siteMedia, getChampionMediaKey(champions, activeChampion), activeChampion.edition, getChampionFallbackMedia(activeChampion))}
                alt={`${activeChampion.championTeam}, ${activeChampion.edition} champions`}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = '/assets/stadium.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 rounded-full border border-white/30 bg-slate-950/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                Champions · {activeChampion.season}
              </div>
            </div>
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center text-slate-400">No champion has been recorded for {selectedSeason} yet.</p>
        )}

        {/* Small Carousel Selector Cards Below */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {sessionChampions.map((champ, idx) => (
            <div
               key={champ.edition}
              onClick={() => setCurrentIndex(idx)}
              className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between border ${
                sessionChampionIndex === idx
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
                sessionChampionIndex === idx ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400"
              }`}>
                {sessionChampionIndex === idx ? "VIEWING" : "SELECT"}
              </span>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
};
