import React, { useState, useEffect } from 'react';
import { useNpl } from '../../context/NplContext';
import { TeamBadge } from '../TeamBadge';
import { ArrowLeft, Award, MapPin, Calendar, Clock, Activity, Shield, Radio } from 'lucide-react';

export const MatchDetailsModal = ({ match: initialMatch, onClose }) => {
  const { teams, openModal, adminUser } = useNpl();
  const [match, setMatch] = useState(initialMatch);
  const [scorecard, setScorecard] = useState(null);
  const [activeTab, setActiveTab] = useState('scorecard'); // 'scorecard' | 'commentary' | 'squads'
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  useEffect(() => {
    if (!initialMatch?.id) return;

    let isSubscribed = true;

    // Fetch initial backend scorecard if available
    fetch(`/api/matches/${initialMatch.id}/scorecard`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (isSubscribed && data) {
          setScorecard(data);
          if (data.match) setMatch(data.match);
        }
      })
      .catch((err) => console.log('No backend live match scorecard, using local data'));

    // Connect SSE stream for live updates
    const es = new EventSource(`/api/matches/${initialMatch.id}/stream`);

    es.onopen = () => {
      if (isSubscribed) setIsLiveConnected(true);
    };

    es.addEventListener('score:initial', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (isSubscribed && data) {
          setScorecard(data);
          if (data.match) setMatch(data.match);
        }
      } catch (e) {
        console.error(e);
      }
    });

    es.addEventListener('score:updated', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (isSubscribed && data && data.scoreState) {
          setScorecard((prev) => {
            if (!prev) return prev;
            const innIdx = (data.inningsNumber || 1) - 1;
            const updatedInnings = [...(prev.innings || [])];
            if (updatedInnings[innIdx]) {
              updatedInnings[innIdx] = {
                ...updatedInnings[innIdx],
                ...data.scoreState,
                deliveries: [...(updatedInnings[innIdx].deliveries || []), data.delivery]
              };
            }
            return {
              ...prev,
              liveSummary: {
                ...prev.liveSummary,
                score: `${data.scoreState.totalRuns}/${data.scoreState.wickets}`,
                overs: data.scoreState.overs,
                crr: data.scoreState.currentRunRate,
                rrr: data.scoreState.requiredRunRate,
                target: data.scoreState.target,
                remainingRuns: data.scoreState.remainingRuns,
                remainingBalls: data.scoreState.remainingBalls,
                currentStriker: data.scoreState.currentStriker,
                currentNonStriker: data.scoreState.currentNonStriker,
                currentBowler: data.scoreState.currentBowler,
                recentDeliveries: data.scoreState.recentDeliveries,
                currentOverDeliveries: data.scoreState.currentOverDeliveries
              },
              innings: updatedInnings
            };
          });
        }
      } catch (e) {
        console.error(e);
      }
    });

    es.addEventListener('match:updated', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (isSubscribed && data) setMatch(data);
      } catch (e) {
        console.error(e);
      }
    });

    es.onerror = () => {
      if (isSubscribed) setIsLiveConnected(false);
    };

    return () => {
      isSubscribed = false;
      es.close();
    };
  }, [initialMatch?.id]);

  if (!match) return null;

  const team1Obj = teams.find(t => t.id === match.team1?.id || t.id === match.teamAId) || match.team1 || { name: match.teamAName, shortName: match.teamAShort };
  const team2Obj = teams.find(t => t.id === match.team2?.id || t.id === match.teamBId) || match.team2 || { name: match.teamBName, shortName: match.teamBShort };

  // Fallback scorecard data for legacy sessions without ball-by-ball records
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

  // Dynamic scorecard innings from backend live scoring or fallback
  const scorecardInnings = scorecard?.innings?.length
    ? scorecard.innings
    : (match.innings?.length ? match.innings : [{ batting: fallbackBatting, bowling: fallbackBowling }]);

  const liveSummary = scorecard?.liveSummary || null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#04102a]">
      <div className="min-h-full">
        {/* Header */}
        <div className="sticky top-0 z-30 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-[#0C1630] to-slate-950 shadow-lg">
          <div className="mx-auto flex min-h-[68px] max-w-[1600px] items-center justify-between gap-3 px-3 py-2 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                aria-label="Back from match center"
                className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-slate-200 transition hover:border-amber-400/60 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                    {match.matchNumber} • {match.tournamentPhase}
                  </span>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    match.status === 'LIVE' ? 'bg-red-600 text-white animate-pulse' :
                    match.status === 'COMPLETED' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {match.status}
                  </span>
                  {isLiveConnected && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 border border-emerald-700 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Live Stream
                    </span>
                  )}
                </div>
                <h3 className="mt-0.5 break-words font-sports text-lg leading-tight tracking-wide text-white sm:text-2xl">
                  {team1Obj.name || match.teamAName} vs {team2Obj.name || match.teamBName}
                </h3>
              </div>
            </div>

            {/* Launch Scorer Button for Admin / Scorer */}
            {adminUser && (
              <button
                onClick={() => {
                  onClose();
                  openModal('scorer-console', {
                    id: match.id,
                    season: match.season,
                    matchNumber: match.matchNumber,
                    tournamentPhase: match.tournamentPhase,
                    teamAId: match.teamAId || match.team1?.id,
                    teamBId: match.teamBId || match.team2?.id,
                    teamAName: match.teamAName || match.team1?.name,
                    teamBName: match.teamBName || match.team2?.name,
                    teamAShort: match.teamAShort || match.team1?.shortName,
                    teamBShort: match.teamBShort || match.team2?.shortName,
                    oversLimit: match.oversLimit || 20,
                    status: match.status
                  });
                }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md shrink-0"
              >
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">Open Scorer Console</span>
                <span className="sm:hidden">Scorer</span>
              </button>
            )}
          </div>
        </div>

        {/* Scorecard Hero Strip */}
        <div className="mx-auto grid max-w-6xl grid-cols-2 items-stretch gap-3 border-b border-slate-800 bg-slate-950 p-3 sm:gap-6 sm:p-6">
          <div className="flex min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-[#091124] p-3 text-center sm:gap-3 sm:p-5">
            <TeamBadge team={team1Obj} size="sm" />
            <div className="min-w-0">
              <span className="block break-words font-heading text-sm font-bold leading-tight text-white sm:text-lg">
                {team1Obj?.name}
              </span>
              <div className="mt-2 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
                <span className="font-sports text-xl leading-none text-amber-400 sm:text-4xl">
                  {scorecard?.innings?.[0]?.totalRuns !== undefined
                    ? `${scorecard.innings[0].totalRuns}/${scorecard.innings[0].wickets}`
                    : (match.team1?.score || 'Yet to bat')}
                </span>
                <span className="text-xs text-slate-400">
                  ({scorecard?.innings?.[0]?.overs || match.team1?.overs || '0.0'} ov)
                </span>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-[#091124] p-3 text-center sm:gap-3 sm:p-5">
            <TeamBadge team={team2Obj} size="sm" />
            <div className="min-w-0">
              <span className="block break-words font-heading text-sm font-bold leading-tight text-white sm:text-lg">
                {team2Obj?.name}
              </span>
              <div className="mt-2 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
                <span className="font-sports text-xl leading-none text-white sm:text-4xl">
                  {scorecard?.innings?.[1]?.totalRuns !== undefined
                    ? `${scorecard.innings[1].totalRuns}/${scorecard.innings[1].wickets}`
                    : (match.team2?.score || 'Yet to bat')}
                </span>
                <span className="text-xs text-slate-400">
                  ({scorecard?.innings?.[1]?.overs || match.team2?.overs || '0.0'} ov)
                </span>
              </div>
            </div>
          </div>

          {/* Equation or Result */}
          <div className="col-span-2 rounded-xl border border-slate-800/80 bg-[#091124] px-3 py-2 text-center">
            <span className="text-xs sm:text-sm font-bold text-amber-300">
              {match.result || (liveSummary?.remainingRuns !== null && liveSummary?.target
                ? `Need ${liveSummary.remainingRuns} runs from ${liveSummary.remainingBalls} balls • RRR: ${liveSummary.rrr} | Target: ${liveSummary.target}`
                : (match.equation || match.preview || 'Match in progress'))}
            </span>
            {match.sourceNote && <p className="text-xs text-amber-200/80 mt-2">{match.sourceNote}</p>}
          </div>

          {/* Active Batsmen & Bowler On Crease (if Live) */}
          {liveSummary?.currentStriker && (
            <div className="col-span-2 rounded-2xl border border-amber-500/30 bg-[#070D1D] p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="text-xs">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Striker *</span>
                <span className="font-sports text-base text-white">{liveSummary.currentStriker.name}</span>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  <strong>{liveSummary.currentStriker.runs || 0}</strong> ({liveSummary.currentStriker.balls || 0}b) • 4s: {liveSummary.currentStriker.fours || 0} • 6s: {liveSummary.currentStriker.sixes || 0}
                </div>
              </div>

              {liveSummary.currentNonStriker && (
                <div className="text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Non-Striker</span>
                  <span className="font-sports text-base text-slate-200">{liveSummary.currentNonStriker.name}</span>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    <strong>{liveSummary.currentNonStriker.runs || 0}</strong> ({liveSummary.currentNonStriker.balls || 0}b) • 4s: {liveSummary.currentNonStriker.fours || 0} • 6s: {liveSummary.currentNonStriker.sixes || 0}
                  </div>
                </div>
              )}

              {liveSummary.currentBowler && (
                <div className="text-xs">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Bowler</span>
                  <span className="font-sports text-base text-white">{liveSummary.currentBowler.name}</span>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    <strong>{liveSummary.currentBowler.wickets || 0}/{liveSummary.currentBowler.runsConceded || 0}</strong> ({liveSummary.currentBowler.overs || '0.0'} ov) • Econ: {liveSummary.currentBowler.economy || '0.00'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 bg-[#070D1D] px-2 sm:px-6">
          <button
            onClick={() => setActiveTab('scorecard')}
            className={`min-w-0 flex-1 border-b-2 px-1 py-2 font-sports text-xs sm:text-base tracking-wider transition-colors ${
              activeTab === 'scorecard' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            DETAILED SCORECARD
          </button>
          <button
            onClick={() => setActiveTab('commentary')}
            className={`min-w-0 flex-1 border-b-2 px-1 py-2 font-sports text-xs sm:text-base tracking-wider transition-colors ${
              activeTab === 'commentary' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            BALL-BY-BALL COMMENTARY
          </button>
        </div>

        {/* Tab Content */}
        <div className="mx-auto w-full max-w-6xl space-y-4 p-3 sm:space-y-6 sm:p-6">
          {activeTab === 'scorecard' ? (
            <div className="space-y-6">
              {scorecardInnings.map((innings, inningsIndex) => {
                const battingTeam = inningsIndex === 0 ? team1Obj : team2Obj;
                const bowlingTeam = inningsIndex === 0 ? team2Obj : team1Obj;
                return (
                  <React.Fragment key={`${match.id}-innings-${inningsIndex}`}>
                    <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 shadow-xl">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                        <h4 className="font-sports text-xl text-white tracking-wider">
                          {innings.teamName || battingTeam?.name} Innings
                        </h4>
                        <span className="font-sports text-2xl text-amber-400">
                          {innings.totalRuns !== undefined ? `${innings.totalRuns}/${innings.wickets}` : (battingTeam?.score || '0/0')}
                          <span className="text-xs text-slate-400 font-sans ml-1">
                            ({innings.overs || battingTeam?.overs || '0.0'} ov)
                          </span>
                        </span>
                      </div>

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
                                <td className="py-2.5 font-bold text-white flex items-center gap-1.5">
                                  {b.name}
                                  {!b.isOut && <span className="text-amber-400 text-[10px]">*</span>}
                                </td>
                                <td className="py-2.5 text-slate-400 text-[11px]">{b.dismissal}</td>
                                <td className="py-2.5 text-right font-sports text-base text-amber-400">{b.runs}</td>
                                <td className="py-2.5 text-right text-slate-300">{b.balls}</td>
                                <td className="py-2.5 text-right text-slate-300">{b.fours}</td>
                                <td className="py-2.5 text-right text-slate-300">{b.sixes}</td>
                                <td className="py-2.5 text-right text-slate-400 font-mono">{b.sr || b.strikeRate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {innings.extras && (
                        <div className="border-t border-slate-800/80 pt-3 flex flex-wrap justify-between items-center text-xs text-slate-400 gap-2">
                          <div>
                            Extras: <strong className="text-white">{innings.extras.total}</strong> (wd {innings.extras.wides}, nb {innings.extras.noBalls}, b {innings.extras.byes}, lb {innings.extras.legByes})
                          </div>
                          <div>
                            Run Rate: <strong className="text-white">{innings.currentRunRate || '0.00'}</strong>
                          </div>
                        </div>
                      )}

                      {/* Bowling Table */}
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <h5 className="font-sports text-sm text-slate-300 tracking-wider mb-2">
                          {bowlingTeam?.name} Bowling Figures
                        </h5>
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
                                  <td className="py-2.5 text-center text-slate-300 font-mono">{bw.runs || bw.runsConceded}</td>
                                  <td className="py-2.5 text-center font-sports text-base text-purple-400">{bw.wickets}</td>
                                  <td className="py-2.5 text-right text-slate-400 font-mono">{bw.econ || bw.economy}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            /* Commentary View */
            <div className="space-y-3">
              {scorecard?.innings?.some(inn => inn.deliveries?.length) ? (
                scorecard.innings.map((inn, innIdx) => (
                  <div key={innIdx} className="space-y-3">
                    <h5 className="font-sports text-base text-amber-400 border-b border-slate-800 pb-2">
                      {inn.teamName} Innings Deliveries
                    </h5>
                    {[...(inn.deliveries || [])].reverse().map((d, i) => (
                      <div key={d.id || i} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 text-xs">
                        <span className={`w-9 h-9 rounded-full font-sports text-base flex items-center justify-center shrink-0 ${
                          d.isWicket ? 'bg-rose-600 text-white font-bold' :
                          d.batRuns === 6 ? 'bg-amber-500 text-slate-950 font-bold' :
                          d.batRuns === 4 ? 'bg-emerald-600 text-white font-bold' :
                          d.extraType ? 'bg-purple-900 text-purple-200' :
                          'bg-slate-800 text-slate-200'
                        }`}>
                          {d.isWicket ? 'W' : d.totalRuns}
                        </span>
                        <div>
                          <span className="font-mono text-amber-400 font-bold">
                            {d.overNumber}.{d.ballNumber} • {d.bowlerName} to {d.strikerName}
                          </span>
                          <p className="text-slate-300 mt-0.5">
                            {d.commentary || `${d.batRuns} run(s) scored.`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-sm text-slate-400">
                  Ball-by-ball commentary is recorded during live scoring sessions.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
