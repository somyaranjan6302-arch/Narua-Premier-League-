import React from 'react';
import { useNpl } from '../context/NplContext';
import { SessionSelector } from './SessionSelector';
import { Flame, Calendar, Clock, MapPin, AlertCircle, Sparkles, Gavel, ShieldCheck } from 'lucide-react';

export const AuctionSection = () => {
  const { tournamentInfo, auctionRegistrations, openModal, seasons, selectedSeason, setSelectedSeason } = useNpl();

  const sessionRegistrations = auctionRegistrations.filter((registration) => registration.season === selectedSeason);
  const totalRegistered = sessionRegistrations.length;
  const verifiedCount = sessionRegistrations.filter(r => r.status === 'VERIFIED' || r.status === 'SHORTLISTED' || r.status === 'AUCTIONED').length;

  return (
    <section id="auction" className="py-24 relative bg-gradient-to-b from-[#080F24] via-[#0D1836] to-[#070D1F] border-t border-b border-amber-500/30 overflow-hidden">
      {/* Background fiery golden glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[500px] bg-gradient-to-r from-amber-600/15 via-orange-600/15 to-yellow-500/15 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="glass-panel-gold rounded-3xl p-8 sm:p-12 lg:p-16 border-2 border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.2)] relative overflow-hidden">
          {/* Subtle watermark in background */}
          <div className="absolute right-0 bottom-0 text-[180px] font-sports text-amber-500/5 select-none pointer-events-none leading-none pr-8">
            AUCTION
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 text-amber-300 text-xs font-sports tracking-widest uppercase">
                <Flame className="w-4 h-4 text-amber-400 fill-current animate-bounce" />
                <span>NPL MEGA AUCTION • {selectedSeason.toUpperCase()}</span>
              </div>

              <h2 className="font-sports text-4xl sm:text-6xl lg:text-7xl text-white tracking-wide uppercase leading-none">
                THE ROAD TO THE NEXT SEASON <span className="text-gold-gradient">STARTS HERE.</span>
              </h2>

              <p className="text-base sm:text-lg text-slate-200 font-normal leading-relaxed max-w-xl">
                "Register yourself for the upcoming NPL Auction. Showcase your skills in front of franchise owners, scouts, and thousands of fans across Bengal."
              </p>

              {/* Auction Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AUCTION DATE</span>
                    <span className="font-heading font-bold text-white text-sm">{tournamentInfo.auctionDate}</span>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-start gap-3">
                  <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">REPORTING TIME</span>
                    <span className="font-heading font-bold text-white text-sm">{tournamentInfo.auctionTime}</span>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">OFFICIAL VENUE</span>
                    <span className="font-heading font-bold text-white text-sm">{tournamentInfo.auctionVenue}</span>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">REGISTRATION DEADLINE</span>
                    <span className="font-heading font-bold text-white text-sm">{tournamentInfo.registrationDeadline}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-end gap-4">
                <SessionSelector seasons={seasons} selectedSeason={selectedSeason} setSelectedSeason={setSelectedSeason} />
                {/* Register Button */}
                <button
                  onClick={() => openModal('auction-register')}
                  className="px-8 py-4 rounded-2xl font-sports text-xl tracking-wider uppercase bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-black shadow-[0_0_25px_rgba(245,158,11,0.6)] hover:shadow-[0_0_35px_rgba(245,158,11,0.9)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5"
                >
                  <Flame className="w-5 h-5 text-slate-950 fill-current animate-pulse" />
                  <span>REGISTER FOR AUCTION</span>
                </button>

                {/* Enter Live Auction Arena Simulator */}
                <button
                  onClick={() => openModal('live-auction-arena')}
                  className="px-6 py-4 rounded-2xl font-sports text-xl tracking-wider uppercase bg-slate-900/90 text-white border-2 border-amber-500/60 hover:bg-slate-800 hover:border-amber-400 transition-all flex items-center gap-2.5 shadow-lg group"
                >
                  <Gavel className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform" />
                  <span>ENTER LIVE AUCTION SIMULATOR</span>
                </button>
              </div>
            </div>

            {/* Right Card / Player Registration Pulse (5 cols) */}
            <div className="lg:col-span-5">
              <div className="glass-panel-card p-6 sm:p-8 rounded-3xl border border-amber-500/40 shadow-2xl relative space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-sports text-lg text-white tracking-wider">
                      AUCTION POOL STATUS
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                    PORTAL OPEN
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center">
                    <span className="font-sports text-4xl text-amber-400 block leading-none">
                      {totalRegistered}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1 block">
                      PLAYERS APPLIED
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center">
                    <span className="font-sports text-4xl text-emerald-400 block leading-none">
                      {verifiedCount}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1 block">
                      VERIFIED & SHORTLISTED
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center">
                    <span className="font-sports text-3xl text-white block leading-none">
                      {tournamentInfo.auctionPursePerTeam}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1 block">
                      PURSE PER FRANCHISE
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center">
                    <span className="font-sports text-3xl text-white block leading-none">
                      120+
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1 block">
                      SLOTS AVAILABLE
                    </span>
                  </div>
                </div>

                {/* Eligibility criteria note */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>ELIGIBILITY CRITERIA</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Open to grassroots, district club, and regional cricketers aged 16+. Valid photo ID and cricket profile required during registration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
