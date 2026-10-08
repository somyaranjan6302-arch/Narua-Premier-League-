import React, { useState } from 'react';
import { useNpl } from '../context/NplContext';
import { Trophy, Sparkles, Award, Shield, Eye, RotateCw } from 'lucide-react';
import { CricketScene } from './3d/CricketScene';
import { Card3DTilt } from './3d/Card3DTilt';

export const TrophySection = () => {
  const { siteMedia } = useNpl();
  const [show3D, setShow3D] = useState(true);

  return (
    <section id="trophy" className="py-24 relative bg-gradient-to-b from-[#050B17] via-[#0B152F] to-[#050B17] overflow-hidden border-t border-slate-800">
      {/* Dramatic central spotlight beam */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[600px] bg-gradient-to-b from-amber-400/20 via-blue-500/10 to-transparent blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Section Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-sports tracking-widest uppercase mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>THE ULTIMATE T10 HONOUR</span>
        </div>

        {/* Section Heading */}
        <h2 className="font-sports text-4xl sm:text-6xl lg:text-7xl text-white tracking-wide uppercase leading-none drop-shadow-2xl">
          THE PRIZE <span className="text-gold-gradient">EVERYONE WANTS</span>
        </h2>
        <p className="text-slate-300 text-sm sm:text-lg max-w-2xl mx-auto mt-3">
          Handcrafted in pure polished gold and silver alloy, engraved with the names of the conquering champions.
        </p>

        {/* Toggle 3D / Photo */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setShow3D(true)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
              show3D
                ? 'border-amber-500/60 bg-amber-500/15 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'border-slate-700/60 bg-slate-900/60 text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>3D TROPHY VIEW</span>
          </button>
          <button
            onClick={() => setShow3D(false)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
              !show3D
                ? 'border-amber-500/60 bg-amber-500/15 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'border-slate-700/60 bg-slate-900/60 text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>PHOTO VIEW</span>
          </button>
        </div>

        {/* Big Trophy Presentation Card */}
        <div className="mt-10 relative max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden glass-panel-gold p-6 sm:p-10 border-2 border-amber-500/40 shadow-[0_0_60px_rgba(245,158,11,0.25)] flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left: Trophy Stats */}
            <div className="space-y-5 text-left w-full md:w-1/3 order-2 md:order-1">
              <Card3DTilt maxTilt={10}>
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    CRAFTED FOR
                  </span>
                  <span className="font-sports text-2xl text-white block mt-0.5">
                    NARUA PREMIER LEAGUE
                  </span>
                  <span className="text-xs text-slate-400">
                    Perpetual Challenge Trophy
                  </span>
                </div>
              </Card3DTilt>

              <Card3DTilt maxTilt={10}>
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    ENGRAVED CHAMPIONS
                  </span>
                  <div className="mt-2 space-y-1.5 text-xs font-heading font-semibold text-slate-200">
                    <div className="flex items-center justify-between">
                      <span>2024 (Inaugural)</span>
                      <span className="text-amber-400">Bajrangi 11</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>2024 (Season 2)</span>
                      <span className="text-slate-400">No Compromise Kaina</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>2025 (Season 3)</span>
                      <span className="text-amber-400">No Compromise Kaina</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>2026 (Season 4)</span>
                      <span className="text-blue-400">Titan Strikers</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>2026 (Season 5)</span>
                      <span className="text-indigo-400">GCC Fighter</span>
                    </div>
                  </div>
                </div>
              </Card3DTilt>
            </div>

            {/* Center: Trophy — 3D or Photo */}
            <div className="relative w-64 h-80 sm:w-80 sm:h-96 flex-shrink-0 order-1 md:order-2">
              {show3D ? (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 to-transparent rounded-2xl blur-xl animate-pulse" />
                  <CricketScene mode="trophy" style={{ borderRadius: '1rem' }} />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-950/60 border border-amber-500/30 backdrop-blur-sm">
                    <span className="text-[10px] text-amber-300/80 font-medium">🖱️ Drag to rotate • Auto-spinning</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-500/30 to-transparent rounded-full blur-2xl animate-pulse" />
                  <img
                    src={siteMedia.trophy || "/assets/trophy.jpg"}
                    alt="Narua Premier League Championship Trophy"
                    className="w-full h-full object-contain relative z-10 drop-shadow-[0_15px_35px_rgba(245,158,11,0.5)] animate-float-trophy"
                  />
                </>
              )}
            </div>

            {/* Right: Trophy Specifications */}
            <div className="space-y-5 text-left w-full md:w-1/3 order-3">
              <Card3DTilt maxTilt={10}>
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    TROPHY WEIGHT & HEIGHT
                  </span>
                  <span className="font-sports text-2xl text-white block mt-0.5">
                    12.5 KG • 28 INCHES
                  </span>
                  <span className="text-xs text-slate-400">
                    Italian Marble Base & Pure Gold Finish
                  </span>
                </div>
              </Card3DTilt>

              <Card3DTilt maxTilt={10}>
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    PRIZE MONEY PURSE
                  </span>
                  <span className="font-sports text-2xl text-emerald-400 block mt-0.5">
                    ₹5,000 + Trophy
                  </span>
                  <span className="text-xs text-slate-400">
                    Awarded to the Winning Franchise Squad
                  </span>
                </div>
              </Card3DTilt>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
