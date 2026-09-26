import React, { useState } from 'react';
import { useNpl } from '../../context/NplContext';
import { TeamBadge } from '../TeamBadge';
import { X, Gavel, Flame, Trophy, Award, Shield, CheckCircle, ArrowRight, RotateCcw } from 'lucide-react';

export const LiveAuctionArenaModal = ({ onClose }) => {
  const {
    teams,
    auctionRegistrations,
    auctionLiveState,
    placeLiveBid,
    sellLivePlayer,
    updateRegistrationStatus
  } = useNpl();

  // Players eligible for auction (Shortlisted or Verified or Pending)
  const eligiblePlayers = auctionRegistrations.filter(r => r.status !== 'REJECTED');
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);
  const currentPlayer = eligiblePlayers[selectedPlayerIndex] || eligiblePlayers[0];

  const currentBid = auctionLiveState.currentBid || 50000;
  const currentBiddingTeamId = auctionLiveState.currentBiddingTeam;
  const currentBiddingTeam = teams.find(t => t.id === currentBiddingTeamId);

  // Raise bid by increment
  const handleRaiseBid = (teamId, increment) => {
    const nextAmount = currentBid + increment;
    placeLiveBid(teamId, nextAmount);
  };

  // Hammer: Sell player
  const handleSell = () => {
    if (!currentBiddingTeamId) {
      alert("No team has placed a bid yet!");
      return;
    }
    sellLivePlayer(currentPlayer, currentBiddingTeamId, currentBid);
    // Advance to next player
    if (selectedPlayerIndex < eligiblePlayers.length - 1) {
      setSelectedPlayerIndex(prev => prev + 1);
    }
  };

  // Mark Unsold
  const handleUnsold = () => {
    if (currentPlayer) {
      updateRegistrationStatus(currentPlayer.id, 'SHORTLISTED', { unsold: true });
      if (selectedPlayerIndex < eligiblePlayers.length - 1) {
        setSelectedPlayerIndex(prev => prev + 1);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-lg overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-[#070E20] border-2 border-amber-500/50 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.25)] overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-[#0C1733] to-slate-950 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-bold shadow-lg">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                INTERACTIVE SIMULATOR
              </span>
              <h3 className="font-sports text-2xl sm:text-3xl text-white tracking-wide leading-none">
                NPL MEGA AUCTION ARENA 2026
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Grid: Left Hammer Stage (7 cols) + Right Teams Purse & History (5 cols) */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Player on the Hammer */}
          <div className="lg:col-span-7 space-y-6">
            {/* Player Selector Strip */}
            <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-xs">
              <span className="font-bold text-slate-400">
                PLAYER {selectedPlayerIndex + 1} OF {eligiblePlayers.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={selectedPlayerIndex === 0}
                  onClick={() => setSelectedPlayerIndex(prev => prev - 1)}
                  className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 disabled:opacity-40 text-slate-300"
                >
                  ← Prev
                </button>
                <button
                  disabled={selectedPlayerIndex >= eligiblePlayers.length - 1}
                  onClick={() => setSelectedPlayerIndex(prev => prev + 1)}
                  className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 disabled:opacity-40 text-slate-300"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Main Stage Spotlight Card */}
            {currentPlayer ? (
              <div className="glass-panel-gold rounded-3xl p-6 border-2 border-amber-500/50 shadow-2xl relative overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  {/* Photo */}
                  <div className="sm:col-span-5 relative">
                    <div className="w-full h-56 rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-2xl bg-slate-950">
                      <img
                        src={currentPlayer.photo}
                        alt={currentPlayer.fullName || currentPlayer.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-md bg-black/85 text-[10px] font-mono text-amber-300 border border-amber-500/40">
                      {currentPlayer.registrationId}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="sm:col-span-7 space-y-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-amber-400 uppercase tracking-widest">
                      {currentPlayer.role}
                    </span>
                    <h3 className="font-sports text-3xl sm:text-4xl text-white tracking-wide leading-none">
                      {currentPlayer.fullName || currentPlayer.name}
                    </h3>
                    <p className="text-xs text-slate-300">
                      {currentPlayer.battingStyle} • {currentPlayer.bowlingStyle}
                    </p>
                    <p className="text-xs text-slate-400 italic line-clamp-2">
                      "{currentPlayer.bestPerformance || 'Consistent district all-rounder'}"
                    </p>

                    <div className="pt-2 flex items-center gap-4 text-xs font-semibold">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Base Price</span>
                        <span className="font-sports text-xl text-slate-200">
                          {currentPlayer.basePrice || "₹30,000"}
                        </span>
                      </div>
                      <div className="border-l border-slate-800 pl-4">
                        <span className="text-[10px] text-slate-500 block uppercase">Status</span>
                        <span className="text-amber-400 font-bold">
                          {currentPlayer.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Current Bid Box */}
                <div className="mt-6 p-4 rounded-2xl bg-slate-950 border-2 border-amber-500/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      CURRENT HIGHEST BID
                    </span>
                    <div className="font-sports text-4xl sm:text-5xl text-amber-400 leading-none mt-1">
                      ₹{currentBid.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      BIDDING FRANCHISE
                    </span>
                    {currentBiddingTeam ? (
                      <div className="flex items-center gap-2 mt-1 justify-end">
                        <TeamBadge team={currentBiddingTeam} size="sm" />
                        <span className="font-sports text-xl text-white">
                          {currentBiddingTeam.shortName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic mt-1 block">
                        Waiting for opening bid...
                      </span>
                    )}
                  </div>
                </div>

                {/* Team Bidding Paddles */}
                <div className="mt-6 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Raise Paddle for Franchise:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {teams.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleRaiseBid(t.id, 25000)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-left transition-all flex items-center gap-2 group"
                      >
                        <TeamBadge team={t} size="xs" />
                        <div className="truncate">
                          <span className="text-xs font-bold text-white block group-hover:text-amber-400">
                            {t.shortName}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            +₹25k
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auctioneer Gavel Decision Controls */}
                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-3">
                  <button
                    onClick={handleSell}
                    className="flex-1 py-3.5 rounded-xl font-sports text-xl tracking-wider uppercase bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black hover:opacity-95 transition-opacity shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                  >
                    <Gavel className="w-5 h-5" />
                    <span>HAMMER: SOLD!</span>
                  </button>

                  <button
                    onClick={handleUnsold}
                    className="px-6 py-3.5 rounded-xl font-sports text-lg tracking-wider uppercase bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800 transition-colors"
                  >
                    MARK UNSOLD
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center p-12 text-slate-400">No players in this pool.</div>
            )}
          </div>

          {/* Right Column: Franchise Purse & Sold Players Live Ledger */}
          <div className="lg:col-span-5 space-y-6">
            {/* Franchise Purses Table */}
            <div className="glass-panel-card p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="font-sports text-lg text-white tracking-wider">
                  FRANCHISE REMAINING PURSES
                </h4>
                <span className="text-[10px] text-slate-400 font-bold">CAP: ₹50 LAKHS</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {teams.map(t => {
                  const purse = auctionLiveState.teamPurses[t.id] ?? 5000000;
                  return (
                    <div key={t.id} className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <TeamBadge team={t} size="xs" />
                        <span className="font-bold text-slate-200">{t.shortName}</span>
                      </div>
                      <span className="font-mono text-amber-400 font-bold">
                        ₹{(purse / 100000).toFixed(1)}L
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sold Players Table */}
            <div className="glass-panel-card p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="font-sports text-lg text-white tracking-wider">
                  SOLD PLAYERS LEDGER
                </h4>
                <span className="text-xs font-bold text-emerald-400">
                  {auctionLiveState.soldPlayers?.length || 0} SOLD
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {auctionLiveState.soldPlayers && auctionLiveState.soldPlayers.length > 0 ? (
                  auctionLiveState.soldPlayers.map((sp, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white block">
                          {sp.playerName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {sp.role} • Base {sp.basePrice}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-sports text-base text-amber-400 block leading-tight">
                          {sp.soldPrice}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300">
                          Sold to {sp.teamShort || sp.team}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No players sold yet in this session.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
