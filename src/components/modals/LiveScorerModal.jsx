import React, { useState, useEffect, useRef } from 'react';
import { useNpl } from '../../context/NplContext';
import {
  X,
  RotateCcw,
  RefreshCw,
  Trophy,
  Users,
  Shield,
  Clock,
  ArrowRightLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Radio,
  Flame,
  Check,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../../utils/audio';

const EXTRA_TYPES = {
  WIDE: 'WIDE',
  NO_BALL: 'NO_BALL',
  BYE: 'BYE',
  LEG_BYE: 'LEG_BYE'
};

const WICKET_TYPES = [
  { id: 'BOWLED', label: 'Bowled', bowlerCredited: true },
  { id: 'CAUGHT', label: 'Caught', bowlerCredited: true, requiresFielder: true },
  { id: 'CAUGHT_AND_BOWLED', label: 'Caught & Bowled', bowlerCredited: true },
  { id: 'LBW', label: 'LBW', bowlerCredited: true },
  { id: 'RUN_OUT', label: 'Run Out', bowlerCredited: false, requiresFielder: true, allowsRuns: true },
  { id: 'STUMPED', label: 'Stumped', bowlerCredited: true, requiresFielder: true },
  { id: 'HIT_WICKET', label: 'Hit Wicket', bowlerCredited: true },
  { id: 'RETIRED_HURT', label: 'Retired Hurt', bowlerCredited: false }
];

export const LiveScorerModal = ({ match: initialMatch, onClose }) => {
  const { teams, adminUser, showToast, refreshSiteMedia } = useNpl();
  const [match, setMatch] = useState(initialMatch);
  const [scorecard, setScorecard] = useState(null);
  const [squads, setSquads] = useState({ teamA: [], teamB: [] });
  const [activeTab, setActiveTab] = useState('console'); // 'console' | 'scorecard' | 'commentary' | 'squads'
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState('connecting'); // 'connecting' | 'live' | 'offline'

  // Modals inside scorer
  const [isTossModalOpen, setIsTossModalOpen] = useState(false);
  const [isWicketModalOpen, setIsWicketModalOpen] = useState(false);
  const [isBowlerModalOpen, setIsBowlerModalOpen] = useState(false);
  const [isBatsmanModalOpen, setIsBatsmanModalOpen] = useState(false);
  const [isExtrasModalOpen, setIsExtrasModalOpen] = useState(false);
  const [isEndInningsConfirmOpen, setIsEndInningsConfirmOpen] = useState(false);
  const [isEndMatchConfirmOpen, setIsEndMatchConfirmOpen] = useState(false);

  // Wicket Form State
  const [wicketForm, setWicketForm] = useState({
    wicketType: 'BOWLED',
    dismissedPlayerId: '',
    fielderName: '',
    runsBeforeRunOut: 0,
    nextBatsmanId: ''
  });

  // Extras Form State
  const [extrasForm, setExtrasForm] = useState({
    type: 'WIDE',
    extraRuns: 1,
    batRuns: 0
  });

  // Bowler Select State
  const [selectedBowlerId, setSelectedBowlerId] = useState('');

  // Batsman Select State
  const [selectedNextBatterId, setSelectedNextBatterId] = useState('');

  // Toss Form State
  const [tossForm, setTossForm] = useState({
    tossWinnerId: initialMatch?.teamAId || '',
    tossDecision: 'BAT',
    strikerId: '',
    nonStrikerId: '',
    bowlerId: ''
  });

  const eventSourceRef = useRef(null);

  // Fetch full scorecard and squads on mount
  const refreshMatchData = async () => {
    try {
      const [scRes, sqRes, mRes] = await Promise.all([
        fetch(`/api/matches/${initialMatch.id}/scorecard`),
        fetch(`/api/matches/${initialMatch.id}/squad`),
        fetch(`/api/matches/${initialMatch.id}`)
      ]);

      if (scRes.ok) {
        const scData = await scRes.json();
        setScorecard(scData);
        if (scData.match) setMatch(scData.match);
      }
      if (sqRes.ok) {
        const sqData = await sqRes.json();
        setSquads(sqData.squads || { teamA: [], teamB: [] });
      }
      if (mRes.ok) {
        const mData = await mRes.json();
        setMatch(mData.match);
      }
      setSyncStatus('live');
    } catch (err) {
      console.error('Error loading match data:', err);
      setSyncStatus('offline');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshMatchData();

    // Setup Real-time SSE Stream
    const es = new EventSource(`/api/matches/${initialMatch.id}/stream`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setSyncStatus('live');
    };

    es.addEventListener('score:initial', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data) {
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
        if (data && data.scoreState) {
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

          // Check if over ended (6 legal balls in over)
          if (data.scoreState.currentOverDeliveries?.length === 0 && data.delivery?.isLegal) {
            setIsBowlerModalOpen(true);
            sound.playBidBeep();
          }

          // Check for celebration on 4, 6 or wicket
          if (data.delivery?.batRuns === 6) {
            confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
            sound.playCheer();
          } else if (data.delivery?.batRuns === 4) {
            sound.playCheer();
          }

          if (data.matchStatus === 'COMPLETED') {
            confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
            sound.playCheer();
          }
        }
      } catch (e) {
        console.error(e);
      }
    });

    es.addEventListener('delivery:undone', (event) => {
      refreshMatchData();
    });

    es.addEventListener('innings:started', () => {
      refreshMatchData();
    });

    es.addEventListener('match:updated', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data) setMatch(data);
      } catch (e) {
        console.error(e);
      }
    });

    es.onerror = () => {
      setSyncStatus('offline');
    };

    return () => {
      es.close();
    };
  }, [initialMatch.id]);

  // Current Batting & Bowling Teams
  const teamAObj = teams.find((t) => t.id === match.teamAId) || { name: match.teamAName, shortName: match.teamAShort || 'TMA' };
  const teamBObj = teams.find((t) => t.id === match.teamBId) || { name: match.teamBName, shortName: match.teamBShort || 'TMB' };

  const currentInningsNum = match.currentInningsNumber || 1;
  const currentInningsData = scorecard?.innings?.[currentInningsNum - 1] || null;
  const liveSummary = scorecard?.liveSummary || null;

  const currentBattingTeamId = match.currentBattingTeamId || match.teamAId;
  const currentBowlingTeamId = match.currentBowlingTeamId || match.teamBId;

  const battingTeamName = currentBattingTeamId === match.teamAId ? match.teamAName : match.teamBName;
  const bowlingTeamName = currentBowlingTeamId === match.teamAId ? match.teamAName : match.teamBName;

  const battingSquad = currentBattingTeamId === match.teamAId ? squads.teamA : squads.teamB;
  const bowlingSquad = currentBowlingTeamId === match.teamAId ? squads.teamA : squads.teamB;

  // Active Striker, Non-Striker, Bowler
  const striker = liveSummary?.currentStriker || null;
  const nonStriker = liveSummary?.currentNonStriker || null;
  const bowler = liveSummary?.currentBowler || null;

  // Record a standard run ball (0, 1, 2, 3, 4, 6)
  const handleScoreBall = async (batRuns) => {
    if (!striker || !nonStriker || !bowler) {
      showToast('Select striker, non-striker, and bowler to begin scoring.', 'error');
      return;
    }
    if (match.status === 'COMPLETED') {
      showToast('Match is already completed.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        strikerId: striker.id,
        strikerName: striker.name,
        nonStrikerId: nonStriker.id,
        nonStrikerName: nonStriker.name,
        bowlerId: bowler.id,
        bowlerName: bowler.name,
        batRuns,
        extraRuns: 0,
        extraType: null,
        totalRuns: batRuns,
        isLegal: true,
        isWicket: false
      };

      const res = await fetch(`/api/matches/${match.id}/ball`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record ball');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Record an extra (Wide, No Ball, Bye, Leg Bye)
  const handleScoreExtra = async () => {
    if (!striker || !nonStriker || !bowler) return;
    setIsSubmitting(true);

    try {
      const { type, extraRuns, batRuns } = extrasForm;
      const isLegal = type === EXTRA_TYPES.BYE || type === EXTRA_TYPES.LEG_BYE;
      const totalRuns = Number(extraRuns || 0) + Number(batRuns || 0);

      const payload = {
        strikerId: striker.id,
        strikerName: striker.name,
        nonStrikerId: nonStriker.id,
        nonStrikerName: nonStriker.name,
        bowlerId: bowler.id,
        bowlerName: bowler.name,
        batRuns: Number(batRuns || 0),
        extraRuns: Number(extraRuns || 0),
        extraType: type,
        totalRuns,
        isLegal,
        isWicket: false
      };

      const res = await fetch(`/api/matches/${match.id}/ball`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record extra');
      }

      setIsExtrasModalOpen(false);
      setExtrasForm({ type: 'WIDE', extraRuns: 1, batRuns: 0 });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Wicket
  const handleScoreWicket = async () => {
    if (!striker || !nonStriker || !bowler) return;
    setIsSubmitting(true);

    try {
      const { wicketType, dismissedPlayerId, fielderName, runsBeforeRunOut, nextBatsmanId } = wicketForm;
      const isOutStriker = dismissedPlayerId === striker.id;
      const dismissedPlayerName = isOutStriker ? striker.name : nonStriker.name;
      const incomingBatter = battingSquad.find((person) => person.id === nextBatsmanId);

      const batRuns = Number(runsBeforeRunOut || 0);
      const isLegal = wicketType !== 'WIDE_RUN_OUT';

      const payload = {
        strikerId: striker.id,
        strikerName: striker.name,
        nonStrikerId: nonStriker.id,
        nonStrikerName: nonStriker.name,
        bowlerId: bowler.id,
        bowlerName: bowler.name,
        batRuns,
        extraRuns: 0,
        extraType: null,
        totalRuns: batRuns,
        isLegal,
        isWicket: true,
        wicketType,
        dismissedPlayerId: dismissedPlayerId || striker.id,
        dismissedPlayerName,
        fielderName: fielderName || null,
        nextBatsmanId: nextBatsmanId || null,
        incomingPlayerId: incomingBatter?.id || null,
        incomingPlayerName: incomingBatter?.name || null
      };

      const res = await fetch(`/api/matches/${match.id}/ball`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record wicket');
      }

      showToast(`WICKET! ${dismissedPlayerName} out (${wicketType})`, 'error');
      setIsWicketModalOpen(false);
      setWicketForm({
        wicketType: 'BOWLED',
        dismissedPlayerId: '',
        fielderName: '',
        runsBeforeRunOut: 0,
        nextBatsmanId: ''
      });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Undo Last Delivery
  const handleUndoBall = async () => {
    if (!confirm('Undo the last recorded delivery? All statistics will be accurately restored.')) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/matches/${match.id}/undo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to undo delivery');
      }

      showToast('Delivery undone successfully.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Swap Strike manually
  const handleSwapStrike = async () => {
    if (!striker || !nonStriker) return;
    // We swap the opening references in memory or send strike rotation update
    setScorecard((prev) => {
      if (!prev || !prev.liveSummary) return prev;
      return {
        ...prev,
        liveSummary: {
          ...prev.liveSummary,
          currentStriker: nonStriker,
          currentNonStriker: striker
        }
      };
    });
    showToast('Strike swapped between batters.');
  };

  // Change Bowler
  const handleChangeBowler = async () => {
    if (!selectedBowlerId) {
      showToast('Select a bowler from the squad', 'error');
      return;
    }
    const candidate = bowlingSquad.find((p) => p.id === selectedBowlerId);
    if (!candidate) return;

    if (bowler && candidate.id === bowler.id) {
      showToast('The same bowler cannot bowl consecutive overs as per official cricket rules.', 'error');
      return;
    }

    setScorecard((prev) => {
      if (!prev || !prev.liveSummary) return prev;
      return {
        ...prev,
        liveSummary: {
          ...prev.liveSummary,
          currentBowler: {
            id: candidate.id,
            name: candidate.name,
            overs: '0.0',
            maidens: 0,
            runsConceded: 0,
            wickets: 0,
            economy: '0.00'
          }
        }
      };
    });

    setIsBowlerModalOpen(false);
    setSelectedBowlerId('');
    showToast(`New bowler: ${candidate.name}`);
  };

  // Start Innings / Toss Submission
  const handleStartMatchAndToss = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Record Toss
      const tossRes = await fetch(`/api/matches/${match.id}/toss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tossWinnerId: tossForm.tossWinnerId,
          tossDecision: tossForm.tossDecision
        })
      });
      if (!tossRes.ok) throw new Error('Failed to record toss');
      const tossData = await tossRes.json();

      // 2. Determine who bats first
      const firstBattingId = tossForm.tossDecision === 'BAT'
        ? tossForm.tossWinnerId
        : (tossForm.tossWinnerId === match.teamAId ? match.teamBId : match.teamAId);
      const firstBattingSquad = firstBattingId === match.teamAId ? squads.teamA : squads.teamB;
      const firstBowlingSquad = firstBattingId === match.teamAId ? squads.teamB : squads.teamA;

      const strikerObj = firstBattingSquad.find((p) => p.id === tossForm.strikerId) || firstBattingSquad[0];
      const nonStrikerObj = firstBattingSquad.find((p) => p.id === tossForm.nonStrikerId) || firstBattingSquad[1];
      const bowlerObj = firstBowlingSquad.find((p) => p.id === tossForm.bowlerId) || firstBowlingSquad[0];

      if (!strikerObj || !nonStrikerObj || !bowlerObj) {
        throw new Error('Please select both opening batsmen and the opening bowler.');
      }
      if (strikerObj.id === nonStrikerObj.id) {
        throw new Error('Striker and Non-striker must be different players.');
      }

      // 3. Start Innings 1
      const startRes = await fetch(`/api/matches/${match.id}/start-innings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inningsNumber: 1,
          striker: { id: strikerObj.id, name: strikerObj.name },
          nonStriker: { id: nonStrikerObj.id, name: nonStrikerObj.name },
          bowler: { id: bowlerObj.id, name: bowlerObj.name }
        })
      });
      if (!startRes.ok) throw new Error('Failed to start innings');

      setIsTossModalOpen(false);
      await refreshMatchData();
      showToast('Match started! Ready for live ball-by-ball scoring.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start Innings 2
  const handleStartInnings2 = async () => {
    setIsSubmitting(true);
    try {
      const inn2BattingSquad = currentBattingTeamId === match.teamAId ? squads.teamB : squads.teamA;
      const inn2BowlingSquad = currentBattingTeamId === match.teamAId ? squads.teamA : squads.teamB;

      const str = inn2BattingSquad[0];
      const nonStr = inn2BattingSquad[1];
      const bwl = inn2BowlingSquad[0];

      if (!str || !nonStr || !bwl) {
        throw new Error('Squads must have players to start second innings.');
      }

      const res = await fetch(`/api/matches/${match.id}/start-innings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inningsNumber: 2,
          striker: { id: str.id, name: str.name },
          nonStriker: { id: nonStr.id, name: nonStr.name },
          bowler: { id: bwl.id, name: bwl.name }
        })
      });

      if (!res.ok) throw new Error('Failed to start 2nd innings');
      setIsEndInningsConfirmOpen(false);
      await refreshMatchData();
      showToast('2nd Innings started! Target chase underway.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // End Match
  const handleEndMatch = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/matches/${match.id}/end-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Failed to complete match');
      setIsEndMatchConfirmOpen(false);
      await refreshMatchData();
      showToast('Match marked as COMPLETED! Points table updated.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#060D1E] text-white overflow-hidden select-none">
      {/* 1. Header Bar */}
      <header className="flex h-14 sm:h-16 items-center justify-between border-b border-slate-800 bg-slate-950/90 px-3 sm:px-6 shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-amber-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Exit Scorer</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sports text-sm sm:text-base text-amber-400 tracking-wider">
                {match.matchNumber}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest hidden md:inline">
                • {match.tournamentPhase}
              </span>
              <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                match.status === 'LIVE' ? 'bg-red-600 text-white animate-pulse' :
                match.status === 'COMPLETED' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}>
                {match.status}
              </span>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-none">
              {teamAObj.shortName || teamAObj.name} vs {teamBObj.shortName || teamBObj.name}
            </div>
          </div>
        </div>

        {/* Sync Status & Action Header */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            <span className={`h-2 w-2 rounded-full ${syncStatus === 'live' ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
            <span className="hidden sm:inline">{syncStatus === 'live' ? 'Live Stream Active' : 'Connecting...'}</span>
          </div>

          {match.status === 'UPCOMING' && (
            <button
              onClick={() => setIsTossModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md"
            >
              <Award className="h-4 w-4" />
              <span>Conduct Toss</span>
            </button>
          )}

          {match.status === 'INNINGS_BREAK' && (
            <button
              onClick={() => setIsEndInningsConfirmOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-md animate-pulse"
            >
              <ArrowRightLeft className="h-4 w-4" />
              <span>Start 2nd Innings</span>
            </button>
          )}

          {match.status === 'LIVE' && currentInningsNum === 1 && (
            <button
              onClick={() => setIsEndInningsConfirmOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-950/30 px-2.5 py-1 text-xs font-bold text-amber-300 hover:bg-amber-900/50"
            >
              End 1st Innings
            </button>
          )}

          {match.status === 'LIVE' && currentInningsNum === 2 && (
            <button
              onClick={() => setIsEndMatchConfirmOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/50 bg-rose-950/30 px-2.5 py-1 text-xs font-bold text-rose-300 hover:bg-rose-900/50"
            >
              End Match
            </button>
          )}
        </div>
      </header>

      {/* 2. Top Tabs */}
      <div className="flex border-b border-slate-800 bg-[#081226] px-3 sm:px-6 shrink-0">
        {[
          { id: 'console', label: 'CricHeroes Scorer Pad' },
          { id: 'scorecard', label: 'Full Scorecard' },
          { id: 'commentary', label: 'Ball-by-Ball' },
          { id: 'squads', label: 'Squads & Teams' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-3 py-2 sm:px-5 sm:py-3 font-sports text-xs sm:text-sm tracking-wider transition-colors ${
              activeTab === tab.id ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Main Area */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-2 sm:p-4 md:p-6 bg-[#040A18]">
        {activeTab === 'console' && (
          <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
            {/* If Match is UPCOMING, prompt for Toss */}
            {match.status === 'UPCOMING' && (
              <div className="rounded-3xl border border-dashed border-amber-500/40 bg-amber-950/20 p-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
                  <Award className="h-8 w-8 text-amber-400" />
                </div>
                <h3 className="font-sports text-2xl text-white">MATCH SETUP & TOSS REQUIRED</h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Before live ball-by-ball scoring begins, conduct the official toss and select opening batsmen and bowler.
                </p>
                <button
                  onClick={() => setIsTossModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-sports text-base tracking-wider text-slate-950 hover:bg-amber-400 shadow-xl"
                >
                  <Award className="h-5 w-5" />
                  <span>RECORD TOSS & START MATCH</span>
                </button>
              </div>
            )}

            {/* Live Scorecard Header Strip */}
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0C152E] via-[#0E1A38] to-[#0C152E] p-3 sm:p-5 shadow-xl relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    {battingTeamName} Innings ({currentInningsNum === 1 ? '1st' : '2nd'} Innings)
                  </span>
                  <span className="text-xs text-slate-500">• Max {match.oversLimit} Overs</span>
                </div>
                {liveSummary?.target && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                    Target: {liveSummary.target}
                  </span>
                )}
              </div>

              {/* Main Score & Overs Display */}
              <div className="flex flex-wrap items-baseline justify-between pt-3 gap-4">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-sports text-4xl sm:text-6xl text-white tracking-tight">
                      {liveSummary?.score || '0/0'}
                    </span>
                    <span className="font-sports text-xl sm:text-3xl text-amber-400">
                      ({liveSummary?.overs || '0.0'} / {match.oversLimit} ov)
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 mt-1">
                    <span>CRR: <strong className="text-white">{liveSummary?.crr || '0.00'}</strong></span>
                    {liveSummary?.rrr && (
                      <span>RRR: <strong className="text-amber-400">{liveSummary.rrr}</strong></span>
                    )}
                  </div>
                </div>

                {/* Equation strip if chasing */}
                {currentInningsNum === 2 && liveSummary?.remainingRuns !== null && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-right">
                    <div className="text-[10px] uppercase font-bold text-amber-400">Target Equation</div>
                    <div className="text-sm sm:text-base font-sports text-white tracking-wide">
                      Need {liveSummary.remainingRuns} runs from {liveSummary.remainingBalls} balls
                    </div>
                  </div>
                )}
              </div>

              {/* Match Result if Completed */}
              {match.status === 'COMPLETED' && (
                <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-center">
                  <span className="font-sports text-lg sm:text-xl text-emerald-300 tracking-wider">
                    {match.result || 'Match Completed'}
                  </span>
                </div>
              )}
            </div>

            {/* Active Batters & Bowler Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
              {/* Striker Card */}
              <div className={`rounded-2xl border p-3.5 transition-all relative ${
                striker ? 'border-amber-500 bg-amber-950/20 shadow-lg shadow-amber-500/5' : 'border-slate-800 bg-slate-900/60'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    Striker *
                  </span>
                  <button
                    onClick={handleSwapStrike}
                    title="Swap Strike"
                    className="p-1 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition text-[10px] flex items-center gap-1 font-bold"
                  >
                    <ArrowRightLeft className="h-3 w-3" />
                    <span>Swap</span>
                  </button>
                </div>
                <div className="font-sports text-lg sm:text-xl text-white truncate">
                  {striker?.name || 'Select Striker'}
                </div>
                {striker && (
                  <div className="flex items-center justify-between text-xs text-slate-300 mt-2 pt-2 border-t border-slate-800">
                    <span className="font-bold text-amber-300 text-base">{striker.runs || 0} <span className="text-[10px] text-slate-400">({striker.balls || 0}b)</span></span>
                    <span className="text-slate-400">4s: <strong className="text-white">{striker.fours || 0}</strong></span>
                    <span className="text-slate-400">6s: <strong className="text-white">{striker.sixes || 0}</strong></span>
                    <span className="text-slate-400">SR: <strong className="text-white">{striker.strikeRate || '0.0'}</strong></span>
                  </div>
                )}
              </div>

              {/* Non-Striker Card */}
              <div className="rounded-2xl border border-slate-800 bg-[#091124] p-3.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Non-Striker
                </div>
                <div className="font-sports text-lg sm:text-xl text-slate-200 truncate">
                  {nonStriker?.name || 'Select Non-Striker'}
                </div>
                {nonStriker && (
                  <div className="flex items-center justify-between text-xs text-slate-300 mt-2 pt-2 border-t border-slate-800">
                    <span className="font-bold text-slate-200 text-base">{nonStriker.runs || 0} <span className="text-[10px] text-slate-400">({nonStriker.balls || 0}b)</span></span>
                    <span className="text-slate-400">4s: <strong className="text-white">{nonStriker.fours || 0}</strong></span>
                    <span className="text-slate-400">6s: <strong className="text-white">{nonStriker.sixes || 0}</strong></span>
                    <span className="text-slate-400">SR: <strong className="text-white">{nonStriker.strikeRate || '0.0'}</strong></span>
                  </div>
                )}
              </div>

              {/* Bowler Card */}
              <div className="rounded-2xl border border-slate-800 bg-[#091124] p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                    Bowler
                  </span>
                  <button
                    onClick={() => setIsBowlerModalOpen(true)}
                    className="p-1 rounded-md bg-purple-950/80 border border-purple-800/80 text-purple-300 hover:text-white transition text-[10px] font-bold"
                  >
                    Change
                  </button>
                </div>
                <div className="font-sports text-lg sm:text-xl text-white truncate">
                  {bowler?.name || 'Select Bowler'}
                </div>
                {bowler && (
                  <div className="flex items-center justify-between text-xs text-slate-300 mt-2 pt-2 border-t border-slate-800">
                    <span>O: <strong className="text-white">{bowler.overs || '0.0'}</strong></span>
                    <span>M: <strong className="text-white">{bowler.maidens || 0}</strong></span>
                    <span>R: <strong className="text-white">{bowler.runsConceded || 0}</strong></span>
                    <span>W: <strong className="text-purple-400 font-bold text-sm">{bowler.wickets || 0}</strong></span>
                    <span>Econ: <strong className="text-white">{bowler.economy || '0.00'}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* This Over Strip (Delivery Pills) */}
            <div className="rounded-2xl border border-slate-800 bg-[#070D1D] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  This Over Deliveries:
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {liveSummary?.currentOverDeliveries?.length || 0} balls bowled
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 min-h-10">
                {(!liveSummary?.currentOverDeliveries || liveSummary.currentOverDeliveries.length === 0) ? (
                  <span className="text-xs text-slate-500 italic">Start of over — waiting for delivery</span>
                ) : (
                  liveSummary.currentOverDeliveries.map((d, idx) => {
                    let badgeClass = 'bg-slate-800 text-white border-slate-700';
                    let text = `${d.totalRuns}`;

                    if (d.isWicket) {
                      badgeClass = 'bg-rose-600 text-white border-rose-500 font-bold';
                      text = 'W';
                    } else if (d.extraType === 'WIDE') {
                      badgeClass = 'bg-purple-900/80 text-purple-200 border-purple-700';
                      text = d.extraRuns > 1 ? `Wd+${d.extraRuns - 1}` : 'Wd';
                    } else if (d.extraType === 'NO_BALL') {
                      badgeClass = 'bg-amber-900/80 text-amber-200 border-amber-700';
                      text = d.batRuns > 0 ? `Nb+${d.batRuns}` : 'Nb';
                    } else if (d.batRuns === 6) {
                      badgeClass = 'bg-amber-500 text-slate-950 font-sports font-bold border-amber-300 text-base';
                      text = '6';
                    } else if (d.batRuns === 4) {
                      badgeClass = 'bg-emerald-600 text-white font-sports font-bold border-emerald-400 text-base';
                      text = '4';
                    } else if (d.batRuns === 0 && d.isLegal) {
                      badgeClass = 'bg-slate-900 text-slate-400 border-slate-800';
                      text = '•';
                    }

                    return (
                      <div
                        key={idx}
                        className={`h-9 w-9 rounded-full border flex items-center justify-center text-xs shadow-sm font-semibold ${badgeClass}`}
                      >
                        {text}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 4. CricHeroes Touch-First Scoring Keypad */}
            <div className="rounded-3xl border border-slate-800 bg-[#070D1D] p-3 sm:p-5 space-y-3">
              {/* Main Runs Row */}
              <div className="grid grid-cols-6 gap-2">
                {[
                  { runs: 0, label: '0', sub: 'Dot', color: 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800' },
                  { runs: 1, label: '1', sub: 'Single', color: 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800' },
                  { runs: 2, label: '2', sub: 'Double', color: 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800' },
                  { runs: 3, label: '3', sub: 'Three', color: 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800' },
                  { runs: 4, label: '4', sub: 'FOUR!', color: 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border-emerald-600 shadow-md font-bold' },
                  { runs: 6, label: '6', sub: 'SIX!', color: 'bg-amber-950/80 hover:bg-amber-900 text-amber-400 border-amber-500 shadow-md font-bold' }
                ].map((btn) => (
                  <button
                    key={btn.runs}
                    disabled={isSubmitting || match.status !== 'LIVE'}
                    onClick={() => handleScoreBall(btn.runs)}
                    className={`h-16 sm:h-20 rounded-2xl border flex flex-col items-center justify-center transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${btn.color}`}
                  >
                    <span className="font-sports text-2xl sm:text-3xl leading-none">{btn.label}</span>
                    <span className="text-[10px] opacity-75">{btn.sub}</span>
                  </button>
                ))}
              </div>

              {/* Extras & Actions Row */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                <button
                  disabled={isSubmitting || match.status !== 'LIVE'}
                  onClick={() => {
                    setExtrasForm({ type: 'WIDE', extraRuns: 1, batRuns: 0 });
                    setIsExtrasModalOpen(true);
                  }}
                  className="h-12 sm:h-14 rounded-xl border border-purple-800/80 bg-purple-950/40 text-purple-300 hover:bg-purple-900/60 font-sports text-sm sm:text-base flex items-center justify-center tracking-wide active:scale-95 disabled:opacity-40"
                >
                  WIDE
                </button>

                <button
                  disabled={isSubmitting || match.status !== 'LIVE'}
                  onClick={() => {
                    setExtrasForm({ type: 'NO_BALL', extraRuns: 1, batRuns: 0 });
                    setIsExtrasModalOpen(true);
                  }}
                  className="h-12 sm:h-14 rounded-xl border border-amber-800/80 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 font-sports text-sm sm:text-base flex items-center justify-center tracking-wide active:scale-95 disabled:opacity-40"
                >
                  NO BALL
                </button>

                <button
                  disabled={isSubmitting || match.status !== 'LIVE'}
                  onClick={() => {
                    setExtrasForm({ type: 'BYE', extraRuns: 1, batRuns: 0 });
                    setIsExtrasModalOpen(true);
                  }}
                  className="h-12 sm:h-14 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 font-sports text-sm sm:text-base flex items-center justify-center tracking-wide active:scale-95 disabled:opacity-40"
                >
                  BYE
                </button>

                <button
                  disabled={isSubmitting || match.status !== 'LIVE'}
                  onClick={() => {
                    setExtrasForm({ type: 'LEG_BYE', extraRuns: 1, batRuns: 0 });
                    setIsExtrasModalOpen(true);
                  }}
                  className="h-12 sm:h-14 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 font-sports text-sm sm:text-base flex items-center justify-center tracking-wide active:scale-95 disabled:opacity-40"
                >
                  LEG BYE
                </button>

                {/* Big WICKET button */}
                <button
                  disabled={isSubmitting || match.status !== 'LIVE'}
                  onClick={() => {
                    setWicketForm({
                      wicketType: 'BOWLED',
                      dismissedPlayerId: striker?.id || '',
                      fielderName: '',
                      runsBeforeRunOut: 0,
                      nextBatsmanId: ''
                    });
                    setIsWicketModalOpen(true);
                  }}
                  className="col-span-4 sm:col-span-1 h-12 sm:h-14 rounded-xl border border-rose-600 bg-gradient-to-r from-rose-700 to-rose-600 text-white font-sports text-base sm:text-lg flex items-center justify-center tracking-wider hover:brightness-110 shadow-lg shadow-rose-900/40 active:scale-95 disabled:opacity-40"
                >
                  ⚡ WICKET
                </button>
              </div>

              {/* Utility Tools Row (Undo, Change Bowler, End Innings) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <button
                  disabled={isSubmitting || !liveSummary?.recentDeliveries?.length}
                  onClick={handleUndoBall}
                  className="flex items-center gap-2 rounded-xl border border-amber-600/50 bg-amber-950/40 px-4 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-900/60 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Undo Last Ball</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    disabled={isSubmitting || match.status !== 'LIVE'}
                    onClick={() => setIsBowlerModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:border-slate-500 transition"
                  >
                    <span>Change Bowler</span>
                  </button>

                  <button
                    onClick={refreshMatchData}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition"
                    title="Manual Refresh"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Full Scorecard Tab */}
        {activeTab === 'scorecard' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {(!scorecard?.innings || scorecard.innings.length === 0) ? (
              <div className="text-center p-8 text-slate-400 border border-slate-800 rounded-2xl bg-slate-950/50">
                Scorecard will populate once balls are bowled.
              </div>
            ) : (
              scorecard.innings.map((inn) => (
                <div key={inn.inningsNumber} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="font-sports text-xl text-white tracking-wide">
                      {inn.teamName} Innings
                    </h4>
                    <span className="font-sports text-2xl text-amber-400">
                      {inn.totalRuns}/{inn.wickets} <span className="text-sm text-slate-400 font-sans">({inn.overs} ov)</span>
                    </span>
                  </div>

                  {/* Batting Table */}
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
                        {(inn.batting || []).map((b) => (
                          <tr key={b.id} className="hover:bg-slate-900/40">
                            <td className="py-2.5 font-bold text-white flex items-center gap-1.5">
                              {b.name}
                              {!b.isOut && <span className="text-amber-400 text-[10px]">*</span>}
                            </td>
                            <td className="py-2.5 text-slate-400 text-[11px]">{b.dismissal}</td>
                            <td className="py-2.5 text-right font-sports text-base text-amber-400">{b.runs}</td>
                            <td className="py-2.5 text-right text-slate-300">{b.balls}</td>
                            <td className="py-2.5 text-right text-slate-300">{b.fours}</td>
                            <td className="py-2.5 text-right text-slate-300">{b.sixes}</td>
                            <td className="py-2.5 text-right font-mono text-slate-400">{b.strikeRate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Extras & Fall of Wickets summary */}
                  <div className="border-t border-slate-800/80 pt-3 flex flex-wrap justify-between items-center text-xs text-slate-400 gap-2">
                    <div>
                      Extras: <strong className="text-white">{inn.extras?.total || 0}</strong> (wd {inn.extras?.wides || 0}, nb {inn.extras?.noBalls || 0}, b {inn.extras?.byes || 0}, lb {inn.extras?.legByes || 0})
                    </div>
                    <div>
                      Run Rate: <strong className="text-white">{inn.currentRunRate || '0.00'}</strong>
                    </div>
                  </div>

                  {/* Bowling Table */}
                  <div className="overflow-x-auto pt-3 border-t border-slate-800">
                    <h5 className="font-sports text-sm text-slate-300 tracking-wider mb-2">Bowling Figures</h5>
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
                        {(inn.bowling || []).map((bw) => (
                          <tr key={bw.id} className="hover:bg-slate-900/40">
                            <td className="py-2.5 font-bold text-white">{bw.name}</td>
                            <td className="py-2.5 text-center font-mono text-slate-300">{bw.overs}</td>
                            <td className="py-2.5 text-center text-slate-400">{bw.maidens}</td>
                            <td className="py-2.5 text-center font-mono text-slate-300">{bw.runsConceded}</td>
                            <td className="py-2.5 text-center font-sports text-base text-purple-400">{bw.wickets}</td>
                            <td className="py-2.5 text-right font-mono text-slate-400">{bw.economy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 6. Commentary Tab */}
        {activeTab === 'commentary' && (
          <div className="max-w-3xl mx-auto space-y-3">
            {(!scorecard?.innings?.[currentInningsNum - 1]?.deliveries?.length) ? (
              <div className="text-center p-8 text-slate-400 border border-slate-800 rounded-2xl bg-slate-950/50">
                No deliveries recorded in this innings yet.
              </div>
            ) : (
              [...(scorecard.innings[currentInningsNum - 1].deliveries || [])].reverse().map((d, i) => (
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
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-amber-400 font-bold">
                        {d.overNumber}.{d.ballNumber}
                      </span>
                      <span className="text-slate-300 font-semibold truncate">
                        {d.bowlerName} to {d.strikerName}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-0.5">
                      {d.commentary || `${d.batRuns} run(s) scored.`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 7. Squads Tab */}
        {activeTab === 'squads' && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <h4 className="font-sports text-lg text-amber-400 tracking-wider mb-3">
                {match.teamAName} Squad
              </h4>
              <div className="space-y-1.5 divide-y divide-slate-850">
                {squads.teamA.map((p, idx) => (
                  <div key={p.id || idx} className="pt-1.5 flex items-center justify-between text-xs">
                    <span className="text-white font-semibold flex items-center gap-1.5">
                      {p.name}
                      {p.isCaptain && <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1 rounded">C</span>}
                      {p.isWicketkeeper && <span className="text-[10px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1 rounded">WK</span>}
                    </span>
                    <span className="text-slate-500 text-[10px]">Playing XI</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <h4 className="font-sports text-lg text-amber-400 tracking-wider mb-3">
                {match.teamBName} Squad
              </h4>
              <div className="space-y-1.5 divide-y divide-slate-850">
                {squads.teamB.map((p, idx) => (
                  <div key={p.id || idx} className="pt-1.5 flex items-center justify-between text-xs">
                    <span className="text-white font-semibold flex items-center gap-1.5">
                      {p.name}
                      {p.isCaptain && <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1 rounded">C</span>}
                      {p.isWicketkeeper && <span className="text-[10px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1 rounded">WK</span>}
                    </span>
                    <span className="text-slate-500 text-[10px]">Playing XI</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Toss & Match Setup Modal */}
      {isTossModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-amber-500/40 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-sports text-xl text-white">OFFICIAL TOSS & INNINGS 1 OPENERS</h3>
              <button onClick={() => setIsTossModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleStartMatchAndToss} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold uppercase text-slate-400">
                  Toss Winner
                  <select
                    value={tossForm.tossWinnerId}
                    onChange={(e) => setTossForm({ ...tossForm, tossWinnerId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  >
                    <option value={match.teamAId}>{match.teamAName}</option>
                    <option value={match.teamBId}>{match.teamBName}</option>
                  </select>
                </label>

                <label className="text-xs font-bold uppercase text-slate-400">
                  Decision
                  <select
                    value={tossForm.tossDecision}
                    onChange={(e) => setTossForm({ ...tossForm, tossDecision: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  >
                    <option value="BAT">Bat First</option>
                    <option value="BOWL">Bowl First</option>
                  </select>
                </label>
              </div>

              {/* Batting first preview */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                Batting First: <strong className="text-amber-400">
                  {tossForm.tossDecision === 'BAT'
                    ? (tossForm.tossWinnerId === match.teamAId ? match.teamAName : match.teamBName)
                    : (tossForm.tossWinnerId === match.teamAId ? match.teamBName : match.teamAName)}
                </strong>
              </div>

              {/* Select Openers */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold uppercase text-slate-400">
                  Opening Striker (Takes first ball)
                  <select
                    required
                    value={tossForm.strikerId}
                    onChange={(e) => setTossForm({ ...tossForm, strikerId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  >
                    <option value="">Select Opening Striker</option>
                    {(tossForm.tossDecision === 'BAT' ? (tossForm.tossWinnerId === match.teamAId ? squads.teamA : squads.teamB) : (tossForm.tossWinnerId === match.teamAId ? squads.teamB : squads.teamA)).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-bold uppercase text-slate-400">
                  Opening Non-Striker
                  <select
                    required
                    value={tossForm.nonStrikerId}
                    onChange={(e) => setTossForm({ ...tossForm, nonStrikerId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  >
                    <option value="">Select Opening Non-Striker</option>
                    {(tossForm.tossDecision === 'BAT' ? (tossForm.tossWinnerId === match.teamAId ? squads.teamA : squads.teamB) : (tossForm.tossWinnerId === match.teamAId ? squads.teamB : squads.teamA)).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-bold uppercase text-slate-400">
                  Opening Bowler
                  <select
                    required
                    value={tossForm.bowlerId}
                    onChange={(e) => setTossForm({ ...tossForm, bowlerId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  >
                    <option value="">Select Opening Bowler</option>
                    {(tossForm.tossDecision === 'BAT' ? (tossForm.tossWinnerId === match.teamAId ? squads.teamB : squads.teamA) : (tossForm.tossWinnerId === match.teamAId ? squads.teamA : squads.teamB)).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsTossModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400 shadow-md"
                >
                  Start 1st Innings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Wicket Dismissal Modal */}
      {isWicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-rose-600/50 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-sports text-xl text-rose-400">⚡ RECORD WICKET DISMISSAL</h3>
              <button onClick={() => setIsWicketModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Dismissal Method */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Dismissal Type
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {WICKET_TYPES.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setWicketForm({ ...wicketForm, wicketType: w.id })}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                        wicketForm.wicketType === w.id
                          ? 'border-rose-500 bg-rose-950/80 text-rose-300 shadow-sm'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Who was out? */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Batter Dismissed
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWicketForm({ ...wicketForm, dismissedPlayerId: striker?.id || '' })}
                    className={`p-2.5 rounded-xl border text-xs font-bold ${
                      (wicketForm.dismissedPlayerId === striker?.id || !wicketForm.dismissedPlayerId)
                        ? 'border-amber-400 bg-amber-950/40 text-amber-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    {striker?.name} (Striker)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWicketForm({ ...wicketForm, dismissedPlayerId: nonStriker?.id || '' })}
                    className={`p-2.5 rounded-xl border text-xs font-bold ${
                      wicketForm.dismissedPlayerId === nonStriker?.id
                        ? 'border-amber-400 bg-amber-950/40 text-amber-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    {nonStriker?.name} (Non-Striker)
                  </button>
                </div>
              </div>

              {/* Fielder name for catch / runout */}
              {['CAUGHT', 'RUN_OUT', 'STUMPED'].includes(wicketForm.wicketType) && (
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Fielder Involved
                  </label>
                  <select
                    value={wicketForm.fielderName}
                    onChange={(e) => setWicketForm({ ...wicketForm, fielderName: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                  >
                    <option value="">Select Fielder (Fielding XI)</option>
                    {bowlingSquad.map((f) => (
                      <option key={f.id} value={f.name}>{f.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Next Batsman to come in */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Next Batter Walking In
                </label>
                <select
                  value={wicketForm.nextBatsmanId}
                  onChange={(e) => setWicketForm({ ...wicketForm, nextBatsmanId: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  <option value="">Select Next Batter from Squad</option>
                  {battingSquad
                    .filter((p) => p.id !== striker?.id && p.id !== nonStriker?.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsWicketModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleScoreWicket}
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-md"
                >
                  Confirm Wicket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Change Bowler Modal */}
      {isBowlerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-purple-600/50 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-sports text-xl text-purple-400">SELECT NEXT BOWLER</h3>
              <button onClick={() => setIsBowlerModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Note: The bowler from the previous over ({bowler?.name}) cannot bowl consecutive overs.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {bowlingSquad
                .filter((p) => p.id !== bowler?.id)
                .map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBowlerId(b.id)}
                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                      selectedBowlerId === b.id
                        ? 'border-purple-500 bg-purple-950/60 text-white font-bold'
                        : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{b.name}</span>
                    {selectedBowlerId === b.id && <Check className="h-4 w-4 text-purple-400" />}
                  </button>
                ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsBowlerModalOpen(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedBowlerId}
                onClick={handleChangeBowler}
                className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-500 shadow-md disabled:opacity-40"
              >
                Confirm Bowler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Extras Detail Modal */}
      {isExtrasModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-sports text-xl text-amber-400">RECORD {extrasForm.type}</h3>
              <button onClick={() => setIsExtrasModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Extra Penalty Runs
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={extrasForm.extraRuns}
                  onChange={(e) => setExtrasForm({ ...extrasForm, extraRuns: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                />
              </div>

              {extrasForm.type === 'NO_BALL' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Runs scored off the bat (Free Hit)
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[0, 1, 2, 4, 6].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setExtrasForm({ ...extrasForm, batRuns: r })}
                        className={`p-2 rounded-xl border text-xs font-bold ${
                          extrasForm.batRuns === r
                            ? 'border-amber-400 bg-amber-950 text-amber-300'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        }`}
                      >
                        +{r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExtrasModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleScoreExtra}
                  className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md"
                >
                  Record Extra
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: End Innings Confirmation */}
      {isEndInningsConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-amber-500/50 bg-slate-950 p-6 shadow-2xl space-y-4 text-center">
            <h3 className="font-sports text-2xl text-white">TRANSITION TO 2ND INNINGS?</h3>
            <p className="text-xs text-slate-300">
              Innings 1 will be sealed. The target will be locked as <strong>{(currentInningsData?.totalRuns || 0) + 1} runs</strong>.
            </p>
            <div className="flex justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsEndInningsConfirmOpen(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleStartInnings2}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg"
              >
                Confirm & Start 2nd Innings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: End Match Confirmation */}
      {isEndMatchConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-rose-500/50 bg-slate-950 p-6 shadow-2xl space-y-4 text-center">
            <h3 className="font-sports text-2xl text-white">CONCLUDE THIS MATCH?</h3>
            <p className="text-xs text-slate-300">
              The match will be finalized, the official scorecard published, and the points table updated with the resulting Net Run Rate.
            </p>
            <div className="flex justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsEndMatchConfirmOpen(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleEndMatch}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-lg"
              >
                Finalize Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
