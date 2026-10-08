import React, { useState, useEffect } from 'react';
import { useNpl } from '../context/NplContext';
import { Flame, Trophy, Play, ChevronRight, Award, Shield, Sparkles, Zap, Target, RotateCcw } from 'lucide-react';
import { CricketScene } from './3d/CricketScene';
import { Card3DTilt } from './3d/Card3DTilt';
import confetti from 'canvas-confetti';

const MODES = [
  { id: 'ball', label: 'MATCH BALL', icon: Target, color: '#ef4444' },
  { id: 'wickets', label: 'STUMP CAM', icon: Zap, color: '#fbbf24' },
  { id: 'trophy', label: 'TROPHY', icon: Trophy, color: '#d4a017' },
];

export const HeroSection = ({ scrollToSection }) => {
  const { tournamentInfo, openModal, siteMedia } = useNpl();
  const [activeMode, setActiveMode] = useState('ball');

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

  const handleSmash = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.7, y: 0.4 },
      colors: ['#fbbf24', '#ef4444', '#f59e0b', '#ffffff'],
    });
  };

  return (
    <section id="home" className="relative min-h-[100vh] flex items-center pt-24 pb-16 overflow-hidden">
      {/* Background Stadium Photo with multi-layered broadcast overlays */}
      <div className="absolute inset-0 z-0">
        <img
          src={siteMedia.stadium || "/assets/stadium.jpg"}
          alt="Narua Premier League Night Stadium"
          className="w-full h-full object-cover object-center scale-105 filter brightness-[0.55] contrast-110"
        />
        {/* Navy gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-npl-navy)] via-[color-mix(in_srgb,var(--color-npl-navy)_80%,transparent)] to-[color-mix(in_srgb,var(--color-npl-blue)_85%,transparent)]" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[color-mix(in_srgb,var(--color-npl-navy)_60%,transparent)] to-[var(--color-npl-navy)]" />

        {/* Laser beam light accents */}
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* LEFT COLUMN — Text Content */}
          <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
            {/* League Established Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/80 border border-amber-500/40 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.25)] mb-6 hero-badge-animate">
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
            <h1 className="font-sports text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-white tracking-wider uppercase leading-none drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)] mb-3 hero-title-animate">
              NARUA <span className="text-gold-gradient">PREMIER LEAGUE</span>
            </h1>

            {/* Tagline */}
            <p className="font-heading text-lg sm:text-xl md:text-2xl text-slate-200 font-light tracking-wide max-w-xl mb-8 drop-shadow hero-subtitle-animate">
              "{tournamentInfo.tagline}"
            </p>

            {/* Call to Action Buttons */}
            <div className="hero-actions flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-8">
              <button
                onClick={() => scrollToSection('matches')}
                className="hero-button hero-button-secondary group"
              >
                <Trophy className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>EXPLORE NPL</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => openModal('auction-register')}
                className="hero-button hero-button-primary group"
              >
                <Flame className="w-5 h-5 text-slate-950 fill-current transition-transform duration-300 group-hover:rotate-[-12deg] group-hover:scale-110" />
                <span>REGISTER FOR AUCTION</span>
              </button>

              <button
                onClick={() => scrollToSection('highlights')}
                className="hero-button hero-button-tertiary group"
              >
                <Play className="w-4 h-4 text-blue-400 fill-current" />
                <span>WATCH HIGHLIGHTS</span>
              </button>
            </div>

            {/* Small venue tag */}
            <div className="text-xs text-slate-400 flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Official Home: {tournamentInfo.venue}</span>
            </div>
          </div>

          {/* RIGHT COLUMN — 3D Cricket Arena */}
          <div className="relative">
            {/* 3D Mode Switcher */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {MODES.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveMode(m.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
                      activeMode === m.id
                        ? 'border-amber-500/60 bg-amber-500/15 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : 'border-slate-700/60 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 3D Canvas Container */}
            <Card3DTilt maxTilt={6} glare={false}>
              <div
                className="relative rounded-2xl overflow-hidden border border-slate-700/50 bg-gradient-to-b from-slate-900/30 to-slate-950/50 backdrop-blur-sm shadow-2xl"
                style={{ height: 'clamp(320px, 45vh, 500px)' }}
              >
                {/* Mode label overlay */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/70 border border-slate-700/60 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: MODES.find(m => m.id === activeMode)?.color }}></span>
                  <span className="text-[10px] font-bold tracking-wider text-slate-300 uppercase">
                    {MODES.find(m => m.id === activeMode)?.label} • 3D VIEW
                  </span>
                </div>

                {/* Interaction hint */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-slate-950/60 border border-slate-700/40 backdrop-blur-sm">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {activeMode === 'wickets' ? '🏏 Click to smash wickets!' : '🖱️ Drag to rotate'}
                  </span>
                </div>

                {/* The 3D Scene */}
                <CricketScene mode={activeMode} onSmash={handleSmash} />
              </div>
            </Card3DTilt>
          </div>
        </div>

        {/* Tournament Statistics Banner (Animated Counters) — Full width below */}
        <div className="mt-10 w-full max-w-5xl mx-auto">
          <div className="glass-panel-card rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-700/60 backdrop-blur-xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80">
              {[
                { value: '2024', label: 'ESTABLISHED', highlight: true },
                { value: counts.teams, label: 'FRANCHISE TEAMS' },
                { value: `0${counts.seasons}`, label: 'EDITIONS / SEASONS' },
                { value: `0${counts.champions}`, label: 'CHAMPIONS CROWNED', highlight: true },
                { value: `${counts.matches}+`, label: 'T20 MATCHES PLAYED', colSpan: true },
              ].map((stat, i) => (
                <Card3DTilt key={i} maxTilt={8} className={stat.colSpan ? 'col-span-2 sm:col-span-1' : ''}>
                  <div className="pt-2 sm:pt-0 sm:px-4 text-center">
                    <span className={`block font-sports text-3xl sm:text-4xl lg:text-5xl leading-none ${stat.highlight ? 'text-amber-400' : 'text-white'}`}>
                      {stat.value}
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1 block">
                      {stat.label}
                    </span>
                  </div>
                </Card3DTilt>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
