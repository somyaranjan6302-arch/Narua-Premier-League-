import React from 'react';
import { useNpl } from '../context/NplContext';
import { SessionSelector } from './SessionSelector';
import { Award, Zap, Flame, Shield, Target, Sparkles } from 'lucide-react';
import { getSiteMedia } from '../utils/siteMedia';

export const TopPerformers = () => {
  const { topPerformers, openModal, siteMedia, seasons, selectedSeason, setSelectedSeason } = useNpl();

  const performerList = [
    { key: 'orangeCap', data: topPerformers.orangeCap, icon: Award, label: "ORANGE CAP" },
    { key: 'purpleCap', data: topPerformers.purpleCap, icon: Shield, label: "PURPLE CAP" },
    { key: 'mostSixes', data: topPerformers.mostSixes, icon: Flame, label: "MAX SIXES" },
    { key: 'bestEconomy', data: topPerformers.bestEconomy, icon: Target, label: "BEST ECONOMY" },
    { key: 'highestScore', data: topPerformers.highestScore, icon: Zap, label: "HIGHEST SCORE" },
    { key: 'bestBowling', data: topPerformers.bestBowling, icon: Sparkles, label: "BEST BOWLING" },
  ];
  const sessionPerformers = selectedSeason === 'Season 3' ? performerList : [];

  return (
    <section id="performers" className="py-20 bg-[#060D1E] border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-widest uppercase mb-3">
            <Award className="w-3.5 h-3.5" />
            <span>{selectedSeason.toUpperCase()} LEADERBOARD</span>
          </div>
          <h2 className="font-sports text-4xl sm:text-5xl lg:text-6xl text-white tracking-wide uppercase leading-none">
            TOP <span className="text-gold-gradient">PERFORMERS</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-2">
            Celebrating the top run-machines, lethal wicket-takers, and explosive boundary hitters of Narua Premier League.
          </p>
        </div>

        <div className="mb-8 flex justify-center">
          <SessionSelector seasons={seasons} selectedSeason={selectedSeason} setSelectedSeason={setSelectedSeason} />
        </div>

        {/* Performer Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessionPerformers.map(({ key, data, icon: Icon, label }) => {
            if (!data) return null;
            return (
              <div
                key={key}
                onClick={() => openModal('player-profile', {
                  name: data.player,
                  team: data.team,
                  role: data.category,
                  runs: data.stat,
                      photo: getSiteMedia(siteMedia, `performer:${key}`, selectedSeason, data.photo),
                  details: data.details
                })}
                className="glass-panel-card rounded-3xl p-6 border border-slate-800 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer relative overflow-hidden group shadow-xl"
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-amber-400 flex items-center gap-1.5">
                    <Icon className="w-3 h-3" />
                    <span>{label}</span>
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {data.teamShort}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Player Photo with Glow Border */}
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-amber-500/40 shadow-lg group-hover:scale-105 transition-transform">
                    <img
                      src={getSiteMedia(siteMedia, `performer:${key}`, selectedSeason, data.photo)}
                      alt={data.player}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Player Info and Big Stat */}
                  <div className="flex-grow">
                    <h3 className="font-heading font-bold text-lg text-white group-hover:text-amber-400 transition-colors">
                      {data.player}
                    </h3>
                    <span className="text-xs text-slate-400 block">
                      {data.team}
                    </span>
                    <div className="font-sports text-3xl text-amber-400 leading-none mt-1">
                      {data.stat}
                    </div>
                  </div>
                </div>

                {/* Subtext description / averages */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
                  {data.details}
                </div>
              </div>
            );
          })}
          {sessionPerformers.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center text-slate-400">No performer records are available for {selectedSeason} yet.</p>
          )}
        </div>
      </div>
    </section>
  );
};
