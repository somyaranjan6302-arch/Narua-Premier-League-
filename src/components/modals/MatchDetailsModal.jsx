import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useNpl } from '../../context/NplContext';
import { TeamBadge } from '../TeamBadge';
import { ArrowLeft, Award, BarChart3, Share2, MoreVertical, Trophy } from 'lucide-react';

export const MatchDetailsModal = ({ match: initialMatch, onClose }) => {
  const { teams, openModal, adminUser, syncScoredMatch } = useNpl();
  const [match, setMatch] = useState(initialMatch);
  const [scorecard, setScorecard] = useState(null);
  const [activeTab, setActiveTab] = useState('scorecard'); // 'scorecard' | 'commentary' | 'squads'
  const [mobileTab, setMobileTab] = useState(initialMatch?.status === 'COMPLETED' ? 'info' : 'live');
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  useEffect(() => {
    if (!initialMatch?.id) return;

    let active = true;
    let socket;
    let fallbackStream;
    let reconnectTimeout;
    let reconnectDelay = 1000;
    let hasConnected = false;
    let socketOpened = false;
    let fallbackStarted = false;
    let lastUpdatedAt = '';
    let previousScorecard = null;
    const season = initialMatch.season || 'Season 6';
    const applyScorecard = (data) => {
      if (!active || !data?.match) return;
      const updatedAt = data.match.updatedAt || '';
      if (lastUpdatedAt && updatedAt && updatedAt < lastUpdatedAt) return;
      lastUpdatedAt = updatedAt;

      const currentInningsIndex = Math.max((data.currentInningsNumber || 1) - 1, 0);
      const currentDeliveries = data.innings?.[currentInningsIndex]?.deliveries || [];
      const previousInningsIndex = Math.max((previousScorecard?.currentInningsNumber || 1) - 1, 0);
      const previousDeliveries = previousScorecard?.innings?.[previousInningsIndex]?.deliveries || [];
      const latestDelivery = currentDeliveries[currentDeliveries.length - 1];
      const previousLatestDelivery = previousDeliveries[previousDeliveries.length - 1];
      const isNewDelivery = currentDeliveries.length > previousDeliveries.length ||
        (latestDelivery && previousLatestDelivery &&
          latestDelivery.sequenceNumber !== previousLatestDelivery.sequenceNumber);

      if (previousScorecard && isNewDelivery && latestDelivery &&
        (latestDelivery.isWicket || latestDelivery.batRuns === 4 || latestDelivery.batRuns === 6) &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const isWicket = Boolean(latestDelivery.isWicket);
        const isSix = latestDelivery.batRuns === 6;
        confetti({
          particleCount: isWicket ? 110 : isSix ? 90 : 55,
          spread: isWicket ? 85 : isSix ? 75 : 60,
          startVelocity: isWicket ? 42 : 34,
          origin: { y: 0.6 },
          colors: isWicket
            ? ['#ef233c', '#ff8a00', '#ffffff']
            : isSix
              ? ['#ffdb19', '#ff8a00', '#e52bd1', '#ffffff']
              : ['#3b5bff', '#e52bd1', '#ffdb19', '#ffffff']
        });
      }

      previousScorecard = data;
      setScorecard(data);
      setMatch(data.match);
      syncScoredMatch(data.match, data);
    };
    const refreshScorecard = async () => {
      try {
        const response = await fetch(`/api/matches/${initialMatch.id}/scorecard`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Scorecard request returned HTTP ${response.status}.`);
        applyScorecard(await response.json());
      } catch (error) {
        console.error('Could not refresh the live match scorecard:', error);
      }
    };
    const connectFallbackStream = () => {
      if (!active || fallbackStarted) return;
      fallbackStarted = true;
      fallbackStream = new EventSource(`/api/matches/${initialMatch.id}/stream`);
      fallbackStream.onopen = () => setIsLiveConnected(true);
      fallbackStream.addEventListener('score:initial', (event) => {
        try {
          applyScorecard(JSON.parse(event.data));
        } catch (error) {
          console.error('Could not read the fallback scoring update:', error);
        }
      });
      ['score:updated', 'delivery:undone', 'innings:started', 'match:updated', 'match:completed']
        .forEach((eventName) => fallbackStream.addEventListener(eventName, refreshScorecard));
      fallbackStream.onerror = () => setIsLiveConnected(false);
    };
    refreshScorecard();

    const connect = () => {
      if (!active) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(
        `${protocol}//${window.location.host}/api/matches/live/ws?matchId=${encodeURIComponent(initialMatch.id)}&season=${encodeURIComponent(season)}`
      );
      socket.onopen = () => {
        socketOpened = true;
        reconnectDelay = 1000;
      };
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'scoring-connected') {
            setIsLiveConnected(true);
            if (hasConnected) refreshScorecard();
            hasConnected = true;
          } else if (message.type === 'scoring-update' && message.match?.id === initialMatch.id) {
            applyScorecard(message.scorecard);
          }
        } catch (error) {
          console.error('Could not read live scoring update:', error);
        }
      };
      socket.onerror = () => {
        setIsLiveConnected(false);
        socket.close();
      };
      socket.onclose = () => {
        if (!active) return;
        setIsLiveConnected(false);
        if (!socketOpened && !fallbackStarted) {
          connectFallbackStream();
          return;
        }
        reconnectTimeout = window.setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 15000);
      };
    };
    connect();

    return () => {
      active = false;
      window.clearTimeout(reconnectTimeout);
      fallbackStream?.close();
      socket?.close();
    };
  }, [initialMatch?.id, initialMatch?.season, syncScoredMatch]);

  if (!match) return null;

  const team1Obj = teams.find(t => t.id === match.team1?.id || t.id === match.teamAId) || match.team1 || { name: match.teamAName, shortName: match.teamAShort };
  const team2Obj = teams.find(t => t.id === match.team2?.id || t.id === match.teamBId) || match.team2 || { name: match.teamBName, shortName: match.teamBShort };

  const scorecardInnings = scorecard?.innings || match.innings || [];

  const liveSummary = scorecard?.liveSummary || null;
  const liveInningsIndex = Math.min(
    Math.max((liveSummary?.currentInningsNumber || scorecard?.currentInningsNumber || match.currentInningsNumber || 1) - 1, 0),
    Math.max(scorecardInnings.length - 1, 0)
  );
  const mobileInnings = scorecardInnings[liveInningsIndex];
  const currentStriker = liveSummary?.currentStriker;
  const currentBowler = liveSummary?.currentBowler;
  const isCurrentStriker = (batter) => match.status === 'LIVE' && Boolean(currentStriker) && (
    (currentStriker.id && batter.id === currentStriker.id) ||
    (currentStriker.name && batter.name === currentStriker.name)
  );
  const isCurrentBowler = (bowler) => match.status === 'LIVE' && Boolean(currentBowler) && (
    (currentBowler.id && bowler.id === currentBowler.id) ||
    (currentBowler.name && bowler.name === currentBowler.name)
  );
  const firstTeamId = match.teamAId || team1Obj.id;
  const mobileBattingTeam = mobileInnings?.teamId
    ? (mobileInnings.teamId === firstTeamId ? team1Obj : team2Obj)
    : (liveInningsIndex === 0 ? team1Obj : team2Obj);
  const mobileScore = liveSummary?.score || (
    mobileInnings?.totalRuns !== undefined
      ? `${mobileInnings.totalRuns}/${mobileInnings.wickets}`
      : (liveInningsIndex === 0 ? match.team1?.score : match.team2?.score) || '0/0'
  );
  const mobileOvers = liveSummary?.overs || mobileInnings?.overs ||
    (liveInningsIndex === 0 ? match.team1?.overs : match.team2?.overs) || '0.0';
  const liveDeliveries = mobileInnings?.deliveries || [];
  const lastWicketIndex = liveDeliveries.reduce(
    (lastIndex, delivery, index) => delivery.isWicket ? index : lastIndex,
    -1
  );
  const currentPartnershipDeliveries = liveDeliveries.slice(lastWicketIndex + 1);
  const mobilePartnershipRuns = currentPartnershipDeliveries.reduce(
    (total, delivery) => total + (delivery.totalRuns || 0),
    0
  );
  const mobilePartnershipBalls = currentPartnershipDeliveries.filter(
    (delivery) => delivery.isLegal !== false && delivery.extraType !== 'WIDE' && delivery.extraType !== 'NO_BALL'
  ).length;
  const currentOverDeliveries = liveSummary?.currentOverDeliveries || mobileInnings?.currentOverDeliveries || [];
  const selectedMobileTab = match.status === 'COMPLETED' && mobileTab === 'live'
    ? 'info'
    : match.status !== 'COMPLETED' && mobileTab === 'summary'
      ? 'live'
      : mobileTab;
  const mobileTabs = match.status === 'COMPLETED'
    ? [['info', 'Info'], ['summary', 'Summary'], ['scorecard', 'Scorecard'], ['insights', 'Insights']]
    : [['info', 'Info'], ['live', 'Live'], ['scorecard', 'Scorecard'], ['insights', 'Insights']];
  const completedInnings = scorecardInnings.map((innings, index) => {
    const battingTeam = innings.teamId
      ? (innings.teamId === firstTeamId ? team1Obj : team2Obj)
      : (index === 0 ? team1Obj : team2Obj);
    const boundaries = (innings.batting || []).reduce(
      (total, batter) => total + (batter.fours || 0) + (batter.sixes || 0),
      0
    );
    return { innings, battingTeam, boundaries };
  });
  const topScorer = scorecardInnings.flatMap((innings, inningsIndex) =>
    (innings.batting || []).map((batter) => ({
      ...batter,
      teamName: innings.teamName || (inningsIndex === 0 ? team1Obj.name : team2Obj.name)
    }))
  ).sort((first, second) => (second.runs || 0) - (first.runs || 0))[0];
  const tossWinnerName = match.tossWinnerId === match.teamAId
    ? team1Obj.name
    : match.tossWinnerId === match.teamBId
      ? team2Obj.name
      : null;

  const shareMatch = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `${team1Obj.name} vs ${team2Obj.name}`, url: window.location.href });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch (error) {
      if (error.name !== 'AbortError') console.error('Could not share the match:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1c1c1e] text-white sm:bg-[#04102a]">
      <div className="min-h-full">
        {/* Header */}
        <div className="hidden sticky top-0 z-30 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-[#0C1630] to-slate-950 shadow-lg sm:block">
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

        <header className="sticky top-0 z-30 flex h-[82px] items-center gap-3 border-b border-[#303033] bg-[#1c1c1e] px-4 sm:hidden">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back from match center"
            className="flex h-11 w-10 shrink-0 items-center justify-start text-white"
          >
            <ArrowLeft className="h-7 w-7" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-[23px] font-medium tracking-tight">
            {(match.tournamentPhase || match.matchNumber || 'Individual match')
              .toLowerCase()
              .replace(/\b\w/g, (letter) => letter.toUpperCase())}
          </h1>
          <button
            type="button"
            onClick={shareMatch}
            aria-label="Share match"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#29292b] text-white"
          >
            <Share2 className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('info')}
            aria-label="Match info"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#29292b] text-white"
          >
            <MoreVertical className="h-6 w-6" />
          </button>
        </header>

        <nav aria-label="Match details" className="sticky top-[82px] z-20 grid min-h-[58px] grid-cols-4 items-stretch border-b border-[#303033] bg-[#090909] sm:hidden">
          {mobileTabs.map(([tab, label]) => (
            <button
              type="button"
              key={tab}
              onClick={() => setMobileTab(tab)}
              aria-current={selectedMobileTab === tab ? 'page' : undefined}
              className={`relative flex min-w-0 items-center justify-center px-1 py-2 text-center text-sm font-medium leading-tight transition-colors ${
                selectedMobileTab === tab ? 'text-[#ed1c2b]' : 'text-[#929296]'
              }`}
            >
              {label}
              {selectedMobileTab === tab && <span className="absolute inset-x-1 bottom-0 h-1 rounded-t-full bg-[#ed1c2b]" />}
            </button>
          ))}
        </nav>

        <main className="space-y-5 px-4 py-5 sm:hidden">
          {selectedMobileTab === 'live' && (
            <>
              <section aria-label="Current innings" className="rounded-[26px] border border-[#303033] bg-[#1d1d1f] p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="truncate text-[20px] font-normal">{mobileBattingTeam?.name || 'Match score'}</h2>
                  <span className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${
                    match.status === 'LIVE' ? 'bg-[#ed1c2b] text-white' : 'bg-[#333336] text-[#dedee0]'
                  }`}>
                    {match.status === 'LIVE' ? 'Live' : match.status === 'COMPLETED' ? 'Completed' : match.status.replaceAll('_', ' ')}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-baseline gap-x-3">
                  <span className="text-[48px] font-normal leading-none tracking-tight">{mobileScore}</span>
                  <span className="text-[21px] text-[#929296]">({mobileOvers} Ov)</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-2 gap-y-1 text-[17px] text-[#a3a3a6]">
                  <span>CRR: <strong className="text-white">{liveSummary?.crr || mobileInnings?.currentRunRate || '0.00'}</strong></span>
                  {liveSummary?.rrr && <span> | RRR: <strong className="text-white">{liveSummary.rrr}</strong></span>}
                  {liveSummary?.target && <span> Target: <strong className="text-white">{liveSummary.target}</strong></span>}
                </div>
                <p className="mt-4 pr-9 text-[18px] leading-7 text-white">
                  {match.result || (liveSummary?.target
                    ? `Need ${liveSummary.remainingRuns} runs in ${liveSummary.remainingBalls} balls`
                    : match.status === 'UPCOMING' ? (match.preview || 'Match upcoming') : 'Match in progress')}
                </p>
              </section>

              {match.status === 'LIVE' && (
                <section aria-label="Current over" className="rounded-[26px] border border-[#303033] bg-[#1d1d1f] px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[17px] font-semibold">This over</h2>
                    <span className="text-xs text-[#929296]">{currentOverDeliveries.length} {currentOverDeliveries.length === 1 ? 'delivery' : 'deliveries'}</span>
                  </div>
                  {currentOverDeliveries.length ? (
                    <div className="mt-4 flex flex-wrap gap-2" aria-label="Current over deliveries">
                      {currentOverDeliveries.map((delivery, index) => {
                        const display = delivery.display || (
                          delivery.isWicket ? 'W' :
                          delivery.extraType === 'WIDE' ? 'Wd' :
                          delivery.extraType === 'NO_BALL' ? `Nb${delivery.batRuns ? `+${delivery.batRuns}` : ''}` :
                          delivery.extraType === 'BYE' ? `${delivery.extraRuns}B` :
                          delivery.extraType === 'LEG_BYE' ? `${delivery.extraRuns}Lb` :
                          String(delivery.batRuns || 0)
                        );
                        const tone = delivery.isWicket
                          ? 'bg-[#ed1c2b] text-white'
                          : delivery.batRuns === 6
                            ? 'bg-[#b8c91c] text-[#111]'
                            : delivery.batRuns === 4
                              ? 'bg-[#189b96] text-white'
                              : delivery.extraType
                                ? 'bg-[#424446] text-white'
                                : 'bg-[#353537] text-white';
                        return (
                          <span
                            key={delivery.id || `${delivery.sequenceNumber || index}-${index}`}
                            className={`flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-bold ${tone}`}
                          >
                            {display}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[#929296]">Waiting for the first delivery.</p>
                  )}
                </section>
              )}

              <section aria-label="Batting and bowling figures" className="rounded-[26px] border border-[#303033] bg-[#1d1d1f] px-4 py-5">
                <h2 className="sr-only">Batters</h2>
                <div className="grid grid-cols-[minmax(0,1fr)_repeat(5,minmax(25px,auto))] items-center gap-x-2 border-b border-[#363639] pb-3 text-[13px] font-bold text-[#929296]">
                  <span className="text-[17px]">Batters</span>
                  <span className="text-right">R</span>
                  <span className="text-right">B</span>
                  <span className="text-right">4s</span>
                  <span className="text-right">6s</span>
                  <span className="text-right">SR</span>
                </div>
                {(mobileInnings?.batting || []).map((batter, index) => (
                  <div key={batter.id || batter.name || index} className="grid grid-cols-[minmax(0,1fr)_repeat(5,minmax(25px,auto))] items-center gap-x-2 border-b border-[#303033] py-3 text-[15px]">
                    <span className={`truncate ${isCurrentStriker(batter) ? 'font-semibold text-[#75c6c1]' : 'text-[#75c6c1]'}`}>
                      {isCurrentStriker(batter) && <span aria-label="Currently facing" className="mr-1">*</span>}
                      {batter.name}{!batter.isOut && !isCurrentStriker(batter) && '*'}
                    </span>
                    <span className="text-right">{batter.runs || 0}</span>
                    <span className="text-right">{batter.balls || 0}</span>
                    <span className="text-right">{batter.fours || 0}</span>
                    <span className="text-right">{batter.sixes || 0}</span>
                    <span className="text-right">{batter.sr || batter.strikeRate || '0.0'}</span>
                  </div>
                ))}
                {!mobileInnings?.batting?.length && (
                  <p className="py-4 text-sm text-[#929296]">Batting figures will appear when scoring begins.</p>
                )}

                {match.status === 'LIVE' && (
                  <p className="pt-4 text-[16px] text-[#929296]">
                    Partnership <strong className="text-white">{mobilePartnershipRuns} ({mobilePartnershipBalls})</strong>
                  </p>
                )}

                <h3 className="mt-6 border-b border-[#363639] pb-3 text-[17px] font-bold text-[#929296]">Bowlers</h3>
                <div className="grid grid-cols-[minmax(0,1fr)_repeat(5,minmax(25px,auto))] items-center gap-x-2 py-2 text-[12px] font-bold text-[#929296]">
                  <span />
                  <span className="text-right">O</span>
                  <span className="text-right">M</span>
                  <span className="text-right">R</span>
                  <span className="text-right">W</span>
                  <span className="text-right">Eco</span>
                </div>
                {(mobileInnings?.bowling || []).map((bowler, index) => (
                  <div key={bowler.id || bowler.name || index} className="grid grid-cols-[minmax(0,1fr)_repeat(5,minmax(25px,auto))] items-center gap-x-2 border-t border-[#303033] py-3 text-[15px]">
                    <span className={`truncate ${isCurrentBowler(bowler) ? 'font-semibold text-[#75c6c1]' : 'text-[#75c6c1]'}`}>
                      {isCurrentBowler(bowler) && <span aria-label="Currently bowling" className="mr-1">*</span>}
                      {bowler.name}
                    </span>
                    <span className="text-right">{bowler.overs || '0.0'}</span>
                    <span className="text-right">{bowler.maidens || 0}</span>
                    <span className="text-right">{bowler.runs ?? bowler.runsConceded ?? 0}</span>
                    <span className="text-right">{bowler.wickets || 0}</span>
                    <span className="text-right">{bowler.econ || bowler.economy || '0.00'}</span>
                  </div>
                ))}
                {!mobileInnings?.bowling?.length && (
                  <p className="py-3 text-sm text-[#929296]">Bowling figures will appear when available.</p>
                )}
              </section>
            </>
          )}

          {selectedMobileTab === 'info' && (
            <>
              <section aria-label="Match information" className="rounded-[26px] border border-[#303033] bg-[#1d1d1f] px-5 py-2">
                {[
                  ['Venue', [match.venue || match.ground, match.city].filter(Boolean).join(', ') || 'Not available'],
                  ['Toss', tossWinnerName ? `${tossWinnerName} won the toss and elected to ${match.tossDecision === 'BAT' ? 'bat' : 'field'}` : 'Not available'],
                  ['Ball type', match.ballType || 'Not available'],
                  ['Match ID', match.id?.replace(/^match_/, '') || 'Not available']
                ].map(([label, value], index, rows) => (
                  <div key={label} className={`grid grid-cols-[minmax(105px,0.8fr)_minmax(0,1.2fr)] items-center gap-3 py-5 text-[17px] ${
                    index < rows.length - 1 ? 'border-b border-[#303033]' : ''
                  }`}>
                    <span className="text-[#dedee0]">{label}</span>
                    <span className="break-words text-[#75c6c1]">{value}</span>
                  </div>
                ))}
                <div className="border-t border-[#303033] py-5">
                  <p className="text-sm text-[#929296]">{match.matchNumber} · {match.tournamentPhase}</p>
                  {(match.matchDate || match.date || match.matchTime || match.time) && (
                    <p className="mt-2 text-sm text-[#a3a3a6]">
                      {[match.matchDate || match.date, match.matchTime || match.time].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </section>
              {match.status === 'COMPLETED' && (
                <section aria-label="Match notes" className="space-y-3">
                  <h2 className="px-1 text-[25px] font-medium">Match notes</h2>
                  <div className="rounded-[26px] border border-[#303033] bg-[#1d1d1f] px-5">
                    {match.result && <p className="border-b border-[#303033] py-5 text-[19px] font-semibold text-white">{match.result}</p>}
                    {scorecardInnings.map((innings, index) => {
                      const battingTeam = innings.teamId
                        ? (innings.teamId === firstTeamId ? team1Obj : team2Obj)
                        : (index === 0 ? team1Obj : team2Obj);
                      return (
                        <p key={`note-${innings.inningsNumber || index}`} className="border-b border-[#303033] py-5 text-[17px] text-[#dedee0]">
                          {battingTeam.name}: {innings.totalRuns}/{innings.wickets} in {innings.overs || '0.0'} overs
                        </p>
                      );
                    })}
                    {match.playerOfMatch?.name && (
                      <p className="py-5 text-[17px] text-[#dedee0]">Player of the match: {match.playerOfMatch.name}</p>
                    )}
                  </div>
                </section>
              )}
            </>
          )}

          {selectedMobileTab === 'summary' && match.status === 'COMPLETED' && (
            <section aria-label="Completed match summary" className="space-y-5">
              {completedInnings.length > 1 && (
                <section aria-label="Boundary comparison" className="flex items-center gap-5 rounded-[26px] border border-[#303033] bg-[#1d1d1f] p-5">
                  <BarChart3 className="h-10 w-10 shrink-0 text-[#75c6c1]" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[17px] leading-6 text-white">Boundaries scored</h2>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#a3a3a6]">
                      {completedInnings.map(({ battingTeam, boundaries }, index) => (
                        <span key={`boundary-${index}`}>
                          <strong className="text-[#75c6c1]">{battingTeam.name}</strong> {boundaries}
                        </span>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              <section aria-label="Match result" className="rounded-[26px] border border-[#303033] bg-[#1d1d1f] p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="min-w-0 truncate text-[20px] font-normal">
                    {completedInnings[0]?.battingTeam.name || team1Obj.name}
                  </h2>
                  <span className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-black">Result</span>
                </div>
                {completedInnings.map(({ innings, battingTeam }, index) => (
                  <div key={`result-${innings.inningsNumber || index}`} className={index === 0 ? 'mt-4' : 'mt-5'}>
                    {index > 0 && <p className="mb-2 text-[18px] font-normal">{battingTeam.name}</p>}
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <strong className="text-[40px] font-normal leading-none tracking-tight">
                        {innings.totalRuns}/{innings.wickets}
                      </strong>
                      <span className="text-[19px] text-[#929296]">({innings.overs || '0.0'} Ov)</span>
                    </div>
                  </div>
                ))}
                <p className="mt-5 text-[19px] leading-7 text-white">{match.result || 'Match completed'}</p>
              </section>

              <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMobileTab('scorecard')}
                  className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-full border border-[#303033] bg-[#242426] px-3 text-center text-sm font-semibold leading-tight text-white active:bg-[#343436] min-[400px]:px-4"
                >
                  <BarChart3 className="h-5 w-5 shrink-0" />
                  Detailed scorecard
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('insights')}
                  className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-full border border-[#303033] bg-[#242426] px-3 text-center text-sm font-semibold leading-tight text-white active:bg-[#343436] min-[400px]:px-4"
                >
                  <Trophy className="h-5 w-5 shrink-0" />
                  Match insights
                </button>
              </div>

              {topScorer && (
                <section aria-label="Match milestones" className="space-y-4 pt-3">
                  <h2 className="text-[26px] font-normal">Milestones</h2>
                  <div className="rounded-[26px] border border-[#303033] bg-[#1d1d1f] p-5">
                    <div className="flex items-start gap-4">
                      <Trophy className="mt-1 h-10 w-10 shrink-0 text-[#75c6c1]" />
                      <div className="min-w-0">
                        <h3 className="text-[22px] font-semibold leading-7">
                          {match.playerOfMatch?.name ? 'Player of the Match' : 'Top scorer'}
                        </h3>
                        <p className="mt-3 text-[18px] font-medium text-[#75c6c1]">
                          {match.playerOfMatch?.name || topScorer.name}
                        </p>
                        <p className="mt-2 text-[16px] leading-6 text-[#dedee0]">
                          {match.playerOfMatch?.performance ||
                            `${topScorer.teamName}: ${topScorer.runs || 0} runs from ${topScorer.balls || 0} balls`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMobileTab('scorecard')}
                      className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full border border-[#159b91] bg-[#164b49] px-4 text-base font-semibold text-white active:bg-[#1d625f]"
                    >
                      View player scorecard
                    </button>
                  </div>
                </section>
              )}
            </section>
          )}

          {selectedMobileTab === 'scorecard' && (
            <section className="space-y-4">
              {!scorecardInnings.length && (
                <p className="rounded-2xl border border-[#303033] bg-[#1d1d1f] p-5 text-center text-[#a3a3a6]">No scorecard has been recorded yet.</p>
              )}
              {scorecardInnings.map((innings, inningsIndex) => {
                const battingTeam = inningsIndex === 0 ? team1Obj : team2Obj;
                const bowlingTeam = inningsIndex === 0 ? team2Obj : team1Obj;
                return (
                  <div key={`${match.id}-mobile-innings-${inningsIndex}`} className="overflow-hidden rounded-[24px] border border-[#303033] bg-[#1d1d1f] p-4">
                    <div className="mb-3 flex items-baseline justify-between gap-2 border-b border-[#363639] pb-3">
                      <h2 className="text-lg font-semibold">{innings.teamName || battingTeam?.name}</h2>
                      <span className="text-lg font-bold text-[#ed1c2b]">{innings.totalRuns}/{innings.wickets}<span className="ml-1 text-xs text-[#a3a3a6]">({innings.overs || '0.0'} Ov)</span></span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[520px] text-left text-xs">
                        <thead className="text-[10px] uppercase text-[#929296]">
                          <tr className="border-b border-[#363639]">
                            <th className="py-2">Batter</th><th>Dismissal</th><th className="text-right">R</th><th className="text-right">B</th><th className="text-right">4s</th><th className="text-right">6s</th><th className="text-right">SR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#303033]">
                          {(innings.batting || []).map((batter, index) => (
                            <tr key={batter.id || batter.name || index}>
                              <td className="py-3 font-semibold text-[#75c6c1]">{batter.name}{!batter.isOut && '*'}</td>
                              <td className="text-[#a3a3a6]">{batter.dismissal}</td>
                              <td className="text-right">{batter.runs}</td><td className="text-right">{batter.balls}</td><td className="text-right">{batter.fours}</td><td className="text-right">{batter.sixes}</td><td className="text-right">{batter.sr || batter.strikeRate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 border-t border-[#363639] pt-4">
                      <h3 className="mb-2 text-sm font-semibold text-[#a3a3a6]">{bowlingTeam?.name} Bowling</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[420px] text-left text-xs">
                          <thead className="text-[10px] uppercase text-[#929296]">
                            <tr className="border-b border-[#363639]">
                              <th className="py-2">Bowler</th><th className="text-right">O</th><th className="text-right">M</th><th className="text-right">R</th><th className="text-right">W</th><th className="text-right">Eco</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#303033]">
                            {(innings.bowling || []).map((bowler, index) => (
                              <tr key={bowler.id || bowler.name || index}>
                                <td className="py-3 font-semibold text-[#75c6c1]">{bowler.name}</td><td className="text-right">{bowler.overs}</td><td className="text-right">{bowler.maidens}</td><td className="text-right">{bowler.runs ?? bowler.runsConceded}</td><td className="text-right">{bowler.wickets}</td><td className="text-right">{bowler.econ || bowler.economy}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {selectedMobileTab === 'insights' && (
            <section className="rounded-[26px] border border-[#303033] bg-[#1d1d1f] p-5">
              <h2 className="text-2xl font-semibold">Match insights</h2>
              <p className="mt-2 text-[#a3a3a6]">Current match figures</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ['Current run rate', liveSummary?.crr || mobileInnings?.currentRunRate || '0.00'],
                  ['Required run rate', liveSummary?.rrr || '—'],
                  ['Target', liveSummary?.target || '—'],
                  ['Overs', `${mobileOvers} / ${match.oversLimit || '—'}`]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-[#363639] bg-[#242426] p-4">
                    <p className="text-sm text-[#a3a3a6]">{label}</p>
                    <p className="mt-2 text-xl font-semibold">{value}</p>
                  </div>
                ))}
              </div>
              {match.result && <p className="mt-5 border-t border-[#363639] pt-4 font-semibold text-white">{match.result}</p>}
            </section>
          )}
        </main>

        {/* Scorecard Hero Strip */}
        <div className="mx-auto hidden max-w-6xl grid-cols-2 items-stretch gap-3 border-b border-slate-800 bg-slate-950 p-3 sm:grid sm:gap-6 sm:p-6">
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
              {match.result || (scorecard?.currentInningsNumber === 2 && liveSummary?.target
                ? `Need ${liveSummary.remainingRuns} runs from ${liveSummary.remainingBalls} balls • RRR: ${liveSummary.rrr} | Target: ${liveSummary.target}`
                : (match.status === 'UPCOMING' ? (match.preview || 'Match upcoming') : 'Match in progress'))}
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
        <div className="hidden border-b border-slate-800 bg-[#070D1D] px-2 sm:flex sm:px-6">
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
        <div className="mx-auto hidden w-full max-w-6xl space-y-4 p-3 sm:block sm:space-y-6 sm:p-6">
          {activeTab === 'scorecard' ? (
            <div className="space-y-6">
              {!scorecardInnings.length && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 text-center text-sm text-slate-400">
                  No scorecard has been recorded for this match yet.
                </div>
              )}
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
