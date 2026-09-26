import React from 'react';
import { X, Award, Shield, Zap, Target } from 'lucide-react';

export const PlayerProfileModal = ({ player, onClose }) => {
  if (!player) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#091124] border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-[#0C1630] to-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              NPL PLAYER CARD
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
            <span className="text-xs text-slate-300 font-semibold">{player.team || player.teamName || "Franchise Athlete"}</span>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Body */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-500/50 flex-shrink-0 bg-slate-950 shadow-xl">
              <img
                src={player.photo || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80"}
                alt={player.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {player.role || "Cricketer"}
              </span>
              <h3 className="font-sports text-3xl text-white tracking-wide leading-none mt-1.5">
                {player.name || player.fullName}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {player.style || `${player.battingStyle || 'Right Hand'} • ${player.bowlingStyle || 'Bowler'}`}
              </p>
              <span className="text-xs text-slate-400 font-medium block mt-0.5">
                {player.teamShort ? `Plays for ${player.teamShort}` : player.location || "Bengal"}
              </span>
            </div>
          </div>

          {/* Stats Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Runs</span>
              <span className="font-sports text-2xl text-amber-400 leading-none">{player.runs || 0}</span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Wickets</span>
              <span className="font-sports text-2xl text-purple-400 leading-none">{player.wickets || 0}</span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Strike Rate</span>
              <span className="font-mono text-sm font-semibold text-slate-200">{player.strikeRate || "154.2"}</span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Economy</span>
              <span className="font-mono text-sm font-semibold text-slate-200">{player.economy || "6.75"}</span>
            </div>
          </div>

          {/* Highlights & Best Performance */}
          <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-850">
              <span className="text-slate-400">Best Batting Performance</span>
              <span className="font-sports text-lg text-amber-300">{player.bestScore || "84* (42 balls)"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Best Bowling Figures</span>
              <span className="font-sports text-lg text-purple-300">{player.bestBowling || "4/18 (4.0 ov)"}</span>
            </div>
          </div>

          {player.details && (
            <p className="text-xs text-slate-300 italic bg-amber-500/5 p-3 rounded-xl border border-amber-500/20">
              "{player.details}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
