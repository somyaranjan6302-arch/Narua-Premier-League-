import React, { useState } from 'react';
import { useNpl } from '../../context/NplContext';
import { TeamBadge } from '../TeamBadge';
import { X, Award, MapPin, Calendar, Clock, Activity, Shield } from 'lucide-react';

export const MatchDetailsModal = ({ match, onClose }) => {
  const { teams } = useNpl();
  const [activeTab, setActiveTab] = useState('scorecard'); // 'scorecard' | 'commentary' | 'info'

  if (!match) return null;

  const team1Obj = teams.find(t => t.id === match.team1?.id) || match.team1;
  const team2Obj = teams.find(t => t.id === match.team2?.id) || match.team2;

  // Older fixtures without innings data keep the legacy display; Session 4 uses the PDF scorecards.
  const fallbackBatting = [
    { name: "Sourav Das (c)", dismissal: "c Indrajit b Sen", runs: 68, balls: 38, fours: 7, sixes: 4, sr: "178.9" },
    { name: "Rohit Samanta", dismissal: "b Prasenjit Das", runs: 42, balls: 26, fours: 4, sixes: 2, sr: "161.5" },
    { name: "Sayantan Roy", dismissal: "run out (Bhowmik)", runs: 34, balls: 20, fours: 3, sixes: 1, sr: "170.0" },
    { name: "Dipayan Mitra (wk)", dismissal: "not out", runs: 28, balls: 14, fours: 2, sixes: 2, sr: "200.0" },
    { name: "Abhishek Mukherjee", dismissal: "not out", runs: 12, balls: 7, fours: 1, sixes: 1, sr: "171.4" },
  ];

  const fallbackBowling = [
    { name: "Amit Sen", overs: "4.0", maidens: 0, runs: 32, wickets: 2, econ: "8.00" },
    { name: "Prasenjit Das", overs: "4.0", maidens: 0, runs: 36, wickets: 1, econ: "9.00" },
    { name: "Surajit Bhowmik", overs: "3.0", maidens: 0, runs: 28, wickets: 0, econ: "9.33" },
    { name: "Indrajit Roy", overs: "4.0", maidens: 0, runs: 44, wickets: 0, econ: "11.00" },
  ];
  const scorecardInnings = match.innings?.length
    ? match.innings
    : [{ batting: fallbackBatting, bowling: fallbackBowling }];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#091124] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-[#0C1630] to-slate-950 p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-700 flex items-center justify-center text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                  {match.matchNumber} • {match.tournamentPhase}
                </span>
                <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${match.status === 'LIVE' ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-300'}`}>
                  {match.status}
                </span>
              </div>
              <h3 className="font-sports text-2xl sm:text-3xl text-white tracking-wide leading-none mt-0.5">
                {match.team1?.name} vs {match.team2?.name}
              </h3>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scorecard Hero Strip */}
        <div className="bg-slate-950 p-6 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="flex items-center justify-between sm:justify-start gap-4">
            <TeamBadge team={team1Obj} size="md" />
            <div>
              <span className="font-heading font-bold text-white text-lg block">{match.team1?.name}</span>
              <div className="font-sports text-3xl text-amber-400 leading-none mt-1">
                {match.team1?.score || "Yet to bat"}
                {match.team1?.overs && <span className="text-xs text-slate-400 font-sans ml-1">({match.team1.overs} ov)</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 sm:text-right">
            <div>
              <span className="font-heading font-bold text-white text-lg block">{match.team2?.name}</span>
              <div className="font-sports text-3xl text-white leading-none mt-1">
                {match.team2?.score || "Yet to bat"}
                {match.team2?.overs && <span className="text-xs text-slate-400 font-sans ml-1">({match.team2.overs} ov)</span>}
              </div>
            </div>
            <TeamBadge team={team2Obj} size="md" />
          </div>

          {/* Equation or Result */}
          <div className="sm:col-span-2 pt-2 text-center border-t border-slate-900">
            <span className="text-xs font-bold text-amber-300">
              {match.result || match.equation || match.preview}
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 px-6 bg-[#070D1D]">
          <button
            onClick={() => setActiveTab('scorecard')}
            className={`py-3 px-4 font-sports text-base tracking-wider transition-colors border-b-2 ${activeTab === 'scorecard' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            DETAILED SCORECARD
          </button>
          <button
            onClick={() => setActiveTab('commentary')}
            className={`py-3 px-4 font-sports text-base tracking-wider transition-colors border-b-2 ${activeTab === 'commentary' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            BALL-BY-BALL COMMENTARY
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow">
          {activeTab === 'scorecard' ? (
            <div className="space-y-6">
              {scorecardInnings.map((innings, inningsIndex) => {
                const battingTeam = inningsIndex === 0 ? match.team1 : match.team2;
                const bowlingTeam = inningsIndex === 0 ? match.team2 : match.team1;
                return <React.Fragment key={`${match.id}-innings-${inningsIndex}`}>
                <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4">
                  <h4 className="font-sports text-lg text-white tracking-wider mb-3">
                    {battingTeam?.name} Innings <span className="text-xs text-slate-500">{innings.total ?? battingTeam?.score} ({innings.overs ?? battingTeam?.overs} ov)</span>
                  </h4>
                  <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase font-bold">
                        <th className="py-2">Batter</th>
                        <th className="py-2">Dismissal</th>
                        <th className="py-2 text-right">R</th>
                        <th className="py-2 text-right">B</th>
                        <th className="py-2 text-right">4s</th>
                        <th className="py-2 text-right">6s</th>
                        <th className="py-2 text-right">SR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {(innings.batting || []).map((b, i) => (
                        <tr key={i} className="hover:bg-slate-900/40">
                          <td className="py-2.5 font-bold text-white">{b.name}</td>
                          <td className="py-2.5 text-slate-400">{b.dismissal}</td>
                          <td className="py-2.5 text-right font-sports text-base text-amber-400">{b.runs}</td>
                          <td className="py-2.5 text-right text-slate-300">{b.balls}</td>
                          <td className="py-2.5 text-right text-slate-300">{b.fours}</td>
                          <td className="py-2.5 text-right text-slate-300">{b.sixes}</td>
                          <td className="py-2.5 text-right text-slate-400 font-mono">{b.sr}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bowling Card */}
              <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4">
                <h4 className="font-sports text-lg text-white tracking-wider mb-3">
                  {bowlingTeam?.name} Bowling Figures
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase font-bold">
                        <th className="py-2">Bowler</th>
                        <th className="py-2 text-center">O</th>
                        <th className="py-2 text-center">M</th>
                        <th className="py-2 text-center">R</th>
                        <th className="py-2 text-center">W</th>
                        <th className="py-2 text-right">Econ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {(innings.bowling || []).map((bw, i) => (
                        <tr key={i} className="hover:bg-slate-900/40">
                          <td className="py-2.5 font-bold text-white">{bw.name}</td>
                          <td className="py-2.5 text-center text-slate-300 font-mono">{bw.overs}</td>
                          <td className="py-2.5 text-center text-slate-400">{bw.maidens}</td>
                          <td className="py-2.5 text-center text-slate-300 font-mono">{bw.runs}</td>
                          <td className="py-2.5 text-center font-sports text-base text-purple-400">{bw.wickets}</td>
                          <td className="py-2.5 text-right text-slate-400 font-mono">{bw.econ}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              </React.Fragment>;
              })}
            </div>
          ) : match.innings?.length ? (
            <p className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-center text-sm text-slate-400">
              Ball-by-ball commentary is not included in the Session 4 scorecards.
            </p>
          ) : (
            /* Commentary View */
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 text-xs">
                <span className="w-8 h-8 rounded-full bg-red-600 text-white font-sports text-base flex items-center justify-center flex-shrink-0">
                  W
                </span>
                <div>
                  <span className="font-mono text-slate-400 font-bold">19.4 • OUT! Clean bowled!</span>
                  <p className="text-slate-300 mt-0.5">
                    Full and straight, crashing into the leg stump! Great fightback from the bowler in the penultimate over.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 text-xs">
                <span className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-sports text-base flex items-center justify-center flex-shrink-0 font-bold">
                  6
                </span>
                <div>
                  <span className="font-mono text-amber-400 font-bold">19.2 • SIX! High and handsome!</span>
                  <p className="text-slate-300 mt-0.5">
                    Lofted straight back over long-on, clearing the 85-meter boundary into the roaring grandstand!
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 text-xs">
                <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-sports text-base flex items-center justify-center flex-shrink-0 font-bold">
                  4
                </span>
                <div>
                  <span className="font-mono text-emerald-400 font-bold">18.5 • FOUR! Pierces the gap!</span>
                  <p className="text-slate-300 mt-0.5">
                    Short and wide, crunched through extra cover for a scorching boundary!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
