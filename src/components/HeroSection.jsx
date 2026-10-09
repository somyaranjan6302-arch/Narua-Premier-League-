import React, { useState, useEffect } from 'react';
import { useNpl } from '../context/NplContext';
import { Flame, Trophy, Play, ChevronRight, Award, Shield, Sparkles } from 'lucide-react';

export const HeroSection = ({ scrollToSection }) => {
  const { tournamentInfo, openModal, siteMedia } = useNpl();

  // Animated counter simulation
  const [counts, setCounts] = useState({
    teams: 0,
    seasons: 0,
    champions: 0,
    matches: 0,
    runs: 0
  });

  useEffect(() => {
    const duration = 1200;
    const steps = 30;
    const intervalTime = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setCounts({
        teams: Math.min(tournamentInfo.totalTeams, Math.round(tournamentInfo.totalTeams * progress)),
        seasons: Math.min(tournamentInfo.totalSeasons, Math.round(tournamentInfo.totalSeasons * progress)),
        champions: Math.min(2, Math.round(2 * progress)),
        matches: Math.min(tournamentInfo.totalMatches, Math.round(tournamentInfo.totalMatches * progress)),
        runs: Math.min(tournamentInfo.totalRuns, Math.round(tournamentInfo.totalRuns * progress))
      });

      if (step >= steps) clearInterval(timer);
    }, intervalTime);

    return () => clearInterval(timer);
  }, [tournamentInfo]);

  return (
    <section id="home" className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 overflow-hidden">
      {/* Background Stadium Photo with multi-layered broadcast overlays */}
      <div className="absolute inset-0 z-0">
        <img
          src={siteMedia.stadium || "/assets/stadium.jpg"}
          alt="Narua Premier League Night Stadium"
          className="w-full h-full object-cover object-center scale-105 filter brightness-75 contrast-110"
        />
        {/* Navy gradient overlays for deep sports vibe and readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-npl-navy)] via-[color-mix(in_srgb,var(--color-npl-navy)_80%,transparent)] to-[color-mix(in_srgb,var(--color-npl-blue)_85%,transparent)]" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[color-mix(in_srgb,var(--color-npl-navy)_60%,transparent)] to-[var(--color-npl-navy)]" />
        
        {/* Laser beam light accent */}
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-[100px] pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        {/* League Established Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 mt-3 rounded-full bg-slate-900/80 border border-amber-500/40 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.25)] mb-6 animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
          <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-amber-300">
            OFFICIAL T20 LEAGUE • SINCE 2024
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span className="text-xs font-semibold text-slate-300 hidden sm:inline">
            SEASON 6 READY
          </span>
        </div>

        {/* Main League Title */}
        <h1 className="font-sports text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-white tracking-wider uppercase leading-none drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)] mb-3">
          NARUA <span className="text-gold-gradient">PREMIER LEAGUE</span>
        </h1>

        {/* Tagline */}
        <p className="font-heading text-lg sm:text-2xl md:text-3xl text-slate-200 font-light tracking-wide max-w-3xl mb-8 drop-shadow">
          "{tournamentInfo.tagline}"
        </p>

        {/* Call to Action Buttons */}
        <div className="hero-actions flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-14">
          {/* Explore NPL Button */}
          <button
            onClick={() => scrollToSection('matches')}
            className="hero-button hero-button-secondary group"
          >
            <Trophy className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>EXPLORE NPL</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Register for Auction CTA */}
          <button
            onClick={() => openModal('auction-register')}
            className="hero-button hero-button-primary group"
          >
            <Flame className="w-5 h-5 text-slate-950 fill-current transition-transform duration-300 group-hover:rotate-[-12deg] group-hover:scale-110" />
            <span>REGISTER FOR AUCTION</span>
          </button>

          {/* Live Action Video Highlights */}
          <button
            onClick={() => scrollToSection('highlights')}
            className="hero-button hero-button-tertiary group"
          >
            <Play className="w-4 h-4 text-blue-400 fill-current" />
            <span>WATCH HIGHLIGHTS</span>
          </button>
        </div>

        {/* Tournament Statistics Banner (Animated Counters) */}
        <div className="w-full max-w-5xl glass-panel-card rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-700/60 backdrop-blur-xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80">
            {/* Stat 1: Established */}
            <div className="pt-2 sm:pt-0 sm:px-4 text-center">
              <span className="block font-sports text-3xl sm:text-4xl lg:text-5xl text-amber-400 leading-none">
                2024
              </span>
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1 block">
                ESTABLISHED
              </span>
            </div>

            {/* Stat 2: Teams */}
            <div className="pt-2 sm:pt-0 sm:px-4 text-center">
              <span className="block font-sports text-3xl sm:text-4xl lg:text-5xl text-white leading-none">
                {counts.teams}
              </span>
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1 block">
                FRANCHISE TEAMS
              </span>
            </div>

            {/* Stat 3: Seasons */}
            <div className="pt-2 sm:pt-0 sm:px-4 text-center">
              <span className="block font-sports text-3xl sm:text-4xl lg:text-5xl text-white leading-none">
                0{counts.seasons}
              </span>
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1 block">
                EDITIONS / SEASONS
              </span>
            </div>

            {/* Stat 4: Champions */}
            <div className="pt-2 sm:pt-0 sm:px-4 text-center">
              <span className="block font-sports text-3xl sm:text-4xl lg:text-5xl text-amber-400 leading-none">
                0{counts.champions}
              </span>
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1 block">
                CHAMPIONS CROWNED
              </span>
            </div>

            {/* Stat 5: Matches */}
            <div className="col-span-2 sm:col-span-1 pt-2 sm:pt-0 sm:px-4 text-center">
              <span className="block font-sports text-3xl sm:text-4xl lg:text-5xl text-white leading-none">
                {counts.matches}+
              </span>
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1 block">
                T20 MATCHES PLAYED
              </span>
            </div>
          </div>
        </div>

        {/* Small venue and floodlight tagline */}
        <div className="mt-5 text-xs text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Official Home: {tournamentInfo.venue}</span>
        </div>
      </div>
    </section>
  );
};
