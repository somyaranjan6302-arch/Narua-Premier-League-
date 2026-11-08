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
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Share2,
  Copy,
  Settings,
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
const TEAM_WICKET_TYPE_IDS = new Set(WICKET_TYPES
  .filter((wicket) => wicket.id !== 'RETIRED_HURT')
  .map((wicket) => wicket.id));

export const LiveScorerModal = ({ match: initialMatch, onClose }) => {
  const { teams, adminUser, showToast, refreshSiteMedia, syncScoredMatch, setSeasonStandings } = useNpl();
  const [match, setMatch] = useState(initialMatch);
  const [scorecard, setScorecard] = useState(null);
  const [squads, setSquads] = useState({ teamA: [], teamB: [] });
  const [activeTab, setActiveTab] = useState('console'); // 'console' | 'scorecard' | 'commentary' | 'squads'
  const [isShortcutsExpanded, setIsShortcutsExpanded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [expandedSettings, setExpandedSettings] = useState({
    match: true,
    players: false,
    scorer: false,
    other: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState('connecting'); // 'connecting' | 'live' | 'offline'

  // Modals inside scorer
  const [isTossModalOpen, setIsTossModalOpen] = useState(false);
  const [isWicketModalOpen, setIsWicketModalOpen] = useState(false);
  const [isBowlerModalOpen, setIsBowlerModalOpen] = useState(false);
  const [isNextBowlerRequired, setIsNextBowlerRequired] = useState(false);
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

  const scorecardRef = useRef(null);

  useEffect(() => {
    if (match) syncScoredMatch(match, scorecard);
  }, [match, scorecard, syncScoredMatch]);

  const applyScoringUpdate = (nextScorecard, nextMatch) => {
    const previousCard = scorecardRef.current;
    const inningsIndex = (nextScorecard.currentInningsNumber || 1) - 1;
    const innings = nextScorecard.innings?.[inningsIndex];
    const deliveries = innings?.deliveries || [];
    const previousDeliveries = previousCard?.innings?.[inningsIndex]?.deliveries || [];
    const latestDelivery = deliveries[deliveries.length - 1];
    const overComplete = innings?.legalBalls > 0 && innings.legalBalls % 6 === 0;
    const previousLegalBalls = previousCard?.innings?.[inningsIndex]?.legalBalls;
    const bowlerHasAlreadyBowledThisOver = overComplete && deliveries.some((delivery) =>
      delivery.overNumber === (innings.legalBalls / 6) - 1 &&
      delivery.bowlerId === nextScorecard.liveSummary?.currentBowler?.id
    );

    if (nextMatch.status === 'LIVE' && bowlerHasAlreadyBowledThisOver &&
      (!previousCard || previousLegalBalls !== innings.legalBalls)) {
      setSelectedBowlerId('');
      setIsNextBowlerRequired(true);
      setIsBowlerModalOpen(true);
      sound.playBidBeep();
    }

    if (deliveries.length > previousDeliveries.length && latestDelivery) {
      if (latestDelivery.batRuns === 6) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        sound.playCheer();
      } else if (latestDelivery.batRuns === 4) {
        sound.playCheer();
      }
      if (nextMatch.status === 'COMPLETED' && previousCard?.match?.status !== 'COMPLETED') {
        confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
        sound.playCheer();
      }
    }

    scorecardRef.current = nextScorecard;
    setScorecard(nextScorecard);
    setMatch(nextMatch);
  };

  // Fetch full scorecard and squads on mount
  const refreshMatchData = async () => {
    if (initialMatch?.id?.includes('demo')) {
      const demoCard = {
        currentInningsNumber: 1,
        liveSummary: {
          score: '20/0',
          overs: '0.5',
          crr: '24.00',
          currentStriker: { id: 'p-kohli', name: 'Kohli Barpada', runs: 10, balls: 2, fours: 1, sixes: 1, strikeRate: '500.0' },
          currentNonStriker: { id: 'p-barpada', name: 'Barpada', runs: 9, balls: 3, fours: 0, sixes: 1, strikeRate: '300.0' },
          currentBowler: { id: 'p-awes', name: 'Awes', overs: '0.5', maidens: 0, runsConceded: 20, wickets: 0, economy: '24.00' },
          currentOverDeliveries: [
            { batRuns: 2, totalRuns: 2, isLegal: true, display: '2' },
            { batRuns: 6, totalRuns: 6, isLegal: true, display: '6' },
            { batRuns: 1, totalRuns: 1, isLegal: true, display: '1' },
            { extraType: 'WIDE', extraRuns: 1, totalRuns: 1, batRuns: 0, isLegal: false, display: '0 wd' },
            { batRuns: 6, totalRuns: 6, isLegal: true, display: '6' },
            { batRuns: 4, totalRuns: 4, isLegal: true, display: '4' }
          ],
          recentDeliveries: [
            { batRuns: 2, totalRuns: 2, isLegal: true },
            { batRuns: 6, totalRuns: 6, isLegal: true },
            { batRuns: 1, totalRuns: 1, isLegal: true },
            { extraType: 'WIDE', extraRuns: 1, totalRuns: 1, batRuns: 0, isLegal: false },
            { batRuns: 6, totalRuns: 6, isLegal: true },
            { batRuns: 4, totalRuns: 4, isLegal: true }
          ]
        },
        innings: [{
          battingTeamName: initialMatch.teamAName || 'Barpada XI',
          bowlingTeamName: initialMatch.teamBName || 'GCC Fighter Binjharpur',
          runs: 20,
          wickets: 0,
          legalBalls: 5
        }]
      };
      applyScoringUpdate(demoCard, initialMatch);
      setSquads({
        teamA: [
          { id: 'p-kohli', name: 'Kohli Barpada', role: 'Batsman', isPlayingXi: true },
          { id: 'p-barpada', name: 'Barpada', role: 'Batsman', isPlayingXi: true },
          { id: 'p-subh', name: 'Subhankar', role: 'All-Rounder', isPlayingXi: true }
        ],
        teamB: [
          { id: 'p-awes', name: 'Awes', role: 'Bowler', isPlayingXi: true },
          { id: 'p-kabir', name: 'Kabir', role: 'Bowler', isPlayingXi: true }
        ]
      });
      setSyncStatus('live');
      setIsLoading(false);
      return;
    }

    try {
      const [scRes, sqRes, mRes] = await Promise.all([
        fetch(`/api/matches/${initialMatch.id}/scorecard`),
        fetch(`/api/matches/${initialMatch.id}/squad`),
        fetch(`/api/matches/${initialMatch.id}`)
      ]);
      const readResponse = async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || `Scoring API returned HTTP ${response.status}.`);
        return data;
      };
      const [scData, sqData, mData] = await Promise.all([
        readResponse(scRes),
        readResponse(sqRes),
        readResponse(mRes)
      ]);
      if (!scData?.match || !mData?.match || !sqData?.squads) {
        throw new Error('The server returned incomplete match scoring data.');
      }
      applyScoringUpdate(scData, mData.match);
      setSquads(sqData.squads);
    } catch (err) {
      console.error('Error loading match data:', err);
      setSyncStatus('offline');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshMatchData();

    let active = true;
    let socket;
    let fallbackStream;
    let reconnectTimeout;
    let reconnectDelay = 1000;
    let hasConnected = false;
    let socketOpened = false;
    let fallbackStarted = false;
    const season = initialMatch.season || match.season || 'Season 6';
    const connectFallbackStream = () => {
      if (!active || fallbackStarted) return;
      fallbackStarted = true;
      fallbackStream = new EventSource(`/api/matches/${initialMatch.id}/stream`);
      fallbackStream.onopen = () => setSyncStatus('live');
      fallbackStream.addEventListener('score:initial', (event) => {
        try {
          const card = JSON.parse(event.data);
          if (!card?.match) return;
          applyScoringUpdate(card, card.match);
        } catch (error) {
          console.error('Could not read the fallback scoring update:', error);
        }
      });
      ['score:updated', 'delivery:undone', 'innings:started', 'match:updated', 'match:completed']
        .forEach((eventName) => fallbackStream.addEventListener(eventName, refreshMatchData));
      fallbackStream.onerror = () => setSyncStatus('offline');
    };
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
            setSyncStatus('live');
            if (hasConnected) refreshMatchData();
            hasConnected = true;
            return;
          }
          if (message.type !== 'scoring-update' || message.match?.id !== initialMatch.id ||
            !message.scorecard) return;

          applyScoringUpdate(message.scorecard, message.match);
        } catch (error) {
          console.error('Could not read live scoring update:', error);
        }
      };
      socket.onerror = () => {
        setSyncStatus('offline');
        socket.close();
      };
      socket.onclose = () => {
        if (!active) return;
        setSyncStatus('offline');
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
  }, [initialMatch.id, initialMatch.season]);

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
  const maxWickets = currentInningsData?.maxWickets || 10;
  const wicketEndsInnings = TEAM_WICKET_TYPE_IDS.has(wicketForm.wicketType) &&
    (currentInningsData?.wickets || 0) + 1 >= maxWickets;
  const requiresNextBatter = wicketForm.wicketType === 'RETIRED_HURT' ||
    (TEAM_WICKET_TYPE_IDS.has(wicketForm.wicketType) && !wicketEndsInnings);
  const availableBatters = battingSquad.filter((person) =>
    person.isPlayingXi !== false &&
    person.id !== striker?.id &&
    person.id !== nonStriker?.id &&
    !currentInningsData?.batting?.some((batter) => batter.id === person.id && batter.isOut)
  );

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

    if (match.id?.includes('demo')) {
      const summary = { ...(scorecard?.liveSummary || {}) };
      const curStriker = { ...(summary.currentStriker || { runs: 10, balls: 2, fours: 1, sixes: 1 }) };
      const curBowler = { ...(summary.currentBowler || { overs: '0.5', maidens: 0, runsConceded: 20, wickets: 0 }) };

      curStriker.runs = (curStriker.runs || 0) + batRuns;
      curStriker.balls = (curStriker.balls || 0) + 1;
      if (batRuns === 4) curStriker.fours = (curStriker.fours || 0) + 1;
      if (batRuns === 6) curStriker.sixes = (curStriker.sixes || 0) + 1;
      curStriker.strikeRate = ((curStriker.runs / curStriker.balls) * 100).toFixed(1);

      curBowler.runsConceded = (curBowler.runsConceded || 0) + batRuns;

      const [r, w] = String(summary.score || '20/0').split('/').map(Number);
      summary.score = `${(r || 0) + batRuns}/${w || 0}`;

      const [ov, bl] = String(summary.overs || '0.5').split('.').map(Number);
      const nxtB = (bl || 0) + 1;
      if (nxtB >= 6) {
        summary.overs = `${(ov || 0) + 1}.0`;
        curBowler.overs = `${(ov || 0) + 1}.0`;
      } else {
        summary.overs = `${ov || 0}.${nxtB}`;
        curBowler.overs = `${ov || 0}.${nxtB}`;
      }

      const newD = { batRuns, totalRuns: batRuns, isLegal: true, display: String(batRuns) };
      summary.currentOverDeliveries = [...(summary.currentOverDeliveries || []), newD];
      summary.recentDeliveries = [...(summary.recentDeliveries || []), newD];
      summary.currentStriker = curStriker;
      summary.currentBowler = curBowler;

      if (batRuns % 2 === 1) {
        const temp = summary.currentStriker;
        summary.currentStriker = summary.currentNonStriker;
        summary.currentNonStriker = temp;
      }

      applyScoringUpdate({ ...scorecard, liveSummary: summary }, match);
      sound.playBidBeep();
      if (batRuns === 6) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        sound.playCheer();
      } else if (batRuns === 4) {
        sound.playCheer();
      }
      setIsSubmitting(false);
      return;
    }

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
      await refreshMatchData();
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

      await refreshMatchData();
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
      const isOutStriker = !dismissedPlayerId || dismissedPlayerId === striker.id;
      const dismissedPlayerName = isOutStriker ? striker.name : nonStriker.name;
      const incomingBatter = battingSquad.find((person) => person.id === nextBatsmanId);
      if (requiresNextBatter && !availableBatters.some((person) => person.id === nextBatsmanId)) {
        throw new Error('Select an eligible batter who has not already been dismissed.');
      }

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

      await refreshMatchData();
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

    if (match.id?.includes('demo')) {
      const summary = { ...(scorecard?.liveSummary || {}) };
      const curDeliveries = [...(summary.currentOverDeliveries || [])];
      if (curDeliveries.length > 0) {
        const last = curDeliveries.pop();
        summary.currentOverDeliveries = curDeliveries;
        summary.recentDeliveries = [...(summary.recentDeliveries || [])].slice(0, -1);
        const [r, w] = String(summary.score || '20/0').split('/').map(Number);
        summary.score = `${Math.max(0, (r || 0) - (last.totalRuns || 0))}/${w || 0}`;
        applyScoringUpdate({ ...scorecard, liveSummary: summary }, match);
        showToast('Delivery undone successfully.', 'success');
      }
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/matches/${match.id}/undo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to undo delivery');
      }

      await refreshMatchData();
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
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/matches/${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPlayers: {
            striker: { id: nonStriker.id, name: nonStriker.name },
            nonStriker: { id: striker.id, name: striker.name },
            bowler: bowler ? { id: bowler.id, name: bowler.name } : null
          }
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not save the strike change.');
      setMatch(result.match);
      setScorecard((prev) => prev?.liveSummary ? ({
        ...prev,
        liveSummary: { ...prev.liveSummary, currentStriker: nonStriker, currentNonStriker: striker }
      }) : prev);
      showToast('Strike swapped and saved.', 'success');
    } catch (error) {
      showToast(error.message || 'Could not save the strike change.', 'error');
    } finally {
      setIsSubmitting(false);
    }
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
    const bowlerStats = currentInningsData?.bowling?.find((figure) => figure.id === candidate.id);
    const bowlerQuota = Number(match.oversPerBowler || Math.ceil(match.oversLimit / 5));
    if (bowlerStats?.legalBalls >= bowlerQuota * 6) {
      showToast(`${candidate.name} has reached the ${bowlerQuota}-over bowling quota.`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/matches/${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPlayers: {
            striker: striker ? { id: striker.id, name: striker.name } : null,
            nonStriker: nonStriker ? { id: nonStriker.id, name: nonStriker.name } : null,
            bowler: { id: candidate.id, name: candidate.name }
          }
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not save the bowler change.');
      setMatch(result.match);
      setScorecard((prev) => prev?.liveSummary ? ({
        ...prev,
        liveSummary: {
          ...prev.liveSummary,
          currentBowler: {
            ...(bowlerStats || {
              overs: '0.0',
              maidens: 0,
              runsConceded: 0,
              wickets: 0,
              economy: '0.00'
            }),
            id: candidate.id,
            name: candidate.name
          }
        }
      }) : prev);
      setIsBowlerModalOpen(false);
      setIsNextBowlerRequired(false);
      setSelectedBowlerId('');
      showToast(`New bowler saved: ${candidate.name}`, 'success');
    } catch (error) {
      showToast(error.message || 'Could not save the bowler change.', 'error');
    } finally {
      setIsSubmitting(false);
    }
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

      try {
        const standingsResponse = await fetch(`/api/tournaments/${encodeURIComponent(match.season)}/points-table`);
        const standingsResult = await standingsResponse.json();
        if (!standingsResponse.ok) {
          throw new Error(standingsResult.error || 'Could not refresh the points table.');
        }
        const standings = Array.isArray(standingsResult.pointsTable) ? standingsResult.pointsTable : [];
        setSeasonStandings((previousStandings) => ({
          ...previousStandings,
          [match.season]: standings.map((row) => ({
            pos: row.rank,
            teamId: row.id,
            team: row.team,
            short: row.shortName,
            p: row.played,
            w: row.won,
            l: row.lost,
            nr: row.noResult,
            nrr: row.nrr,
            pts: row.points,
            form: row.form || [],
            qualified: row.rank <= 4,
            color: teams.find((team) => team.id === row.id)?.primaryColor || '#1d4ed8'
          }))
        }));
        showToast('Match completed and points table updated.', 'success');
      } catch (standingsError) {
        showToast(`Match completed, but the points table could not refresh: ${standingsError.message}`, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSettingsAction = (action) => {
    setIsSettingsOpen(false);

    switch (action) {
      case 'scorecard':
        setActiveTab('scorecard');
        break;
      case 'end-innings':
        if ((match.status === 'LIVE' || match.status === 'INNINGS_BREAK') && currentInningsNum === 1) {
          setIsEndInningsConfirmOpen(true);
        } else {
          showToast('Ending this innings is not available in the current match state.', 'error');
        }
        break;
      case 'end-match':
        if (match.status === 'LIVE') {
          setIsEndMatchConfirmOpen(true);
        } else {
          showToast('This match cannot be ended in its current state.', 'error');
        }
        break;
      case 'change-bowler':
        setIsBowlerModalOpen(true);
        break;
      case 'squads':
        setActiveTab('squads');
        break;
      case 'scoring-help':
        showToast('Use the scoring keypad to record runs, extras, wickets, and undo the last delivery.', 'success');
        break;
      default:
        showToast('This setting is not available in the web scorer yet.', 'error');
    }
  };

  const toggleSettingsSection = (section) => {
    setExpandedSettings((current) => ({ ...current, [section]: !current[section] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#121415] text-white overflow-hidden select-none sm:bg-[#060D1E]">
      {/* 1. Header Bar */}
      <header className="flex min-h-[44px] sm:h-16 items-center justify-between gap-2 bg-[#c52229] px-2 sm:border-b sm:border-slate-800 sm:bg-slate-950/95 sm:px-6 sm:py-1.5 shadow-md shrink-0">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Exit scorer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-black/15 transition sm:h-9 sm:w-auto sm:rounded-lg sm:border sm:border-slate-800 sm:bg-slate-900 sm:px-3 sm:py-1.5 sm:text-xs sm:font-bold sm:text-slate-300"
          >
            <ChevronLeft className="h-6 w-6 sm:hidden text-white" />
            <X className="hidden sm:inline h-4 w-4" />
            <span className="hidden sm:inline">Exit Scorer</span>
          </button>
          <div className="min-w-0 sm:hidden">
            <h2 className="max-w-[55vw] truncate text-2xl font-normal leading-tight text-white tracking-wide">
              {battingTeamName || 'Barpada XI'}
            </h2>
          </div>
          <div className="hidden min-w-0 sm:block">
            <div className="flex items-center gap-2">
              <span className="max-w-28 truncate font-sports text-xs sm:max-w-none sm:text-base text-[#5cc1bd] sm:text-amber-400 tracking-wider">
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
            <div className="max-w-[42vw] truncate text-[11px] sm:text-sm font-semibold text-slate-200 sm:max-w-none">
              {teamAObj.shortName || teamAObj.name} vs {teamBObj.shortName || teamBObj.name}
            </div>
          </div>
        </div>

        {/* Sync Status & Action Header */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Mobile Right Icons (Share & Settings) */}
          <div className="flex items-center gap-0.5 sm:hidden">
            <button
              type="button"
              aria-label="Share match"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: `Live Score - ${match.matchNumber}`, url: window.location.href });
                } else {
                  navigator.clipboard?.writeText(window.location.href);
                  showToast('Live match link copied to clipboard!', 'success');
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-black/15 transition"
            >
              <Share2 className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Open match settings"
              aria-expanded={isSettingsOpen}
              onClick={() => setIsSettingsOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-black/15 transition"
            >
              <Settings className="h-6 w-6" />
            </button>
          </div>

          {/* Desktop action buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex h-8 items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-2.5 text-xs font-semibold text-slate-300">
              <span className={`h-2 w-2 shrink-0 rounded-full ${
                syncStatus === 'live' ? 'bg-emerald-500 animate-ping' : syncStatus === 'offline' ? 'bg-rose-500' : 'bg-amber-500'
              }`} />
              <span>{syncStatus === 'live' ? 'Live Stream Active' : syncStatus === 'offline' ? 'Offline · Reconnecting' : 'Connecting...'}</span>
            </div>

            {match.status === 'UPCOMING' && (
              <button
                onClick={() => setIsTossModalOpen(true)}
                className="flex h-8 items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md"
              >
                <Award className="h-4 w-4" />
                <span>Conduct Toss</span>
              </button>
            )}

            {match.status === 'INNINGS_BREAK' && (
              <button
                onClick={() => setIsEndInningsConfirmOpen(true)}
                className="flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-md animate-pulse"
              >
                <ArrowRightLeft className="h-4 w-4" />
                <span>Start 2nd Innings</span>
              </button>
            )}

            {match.status === 'LIVE' && currentInningsNum === 1 && (
              <button
                onClick={() => setIsEndInningsConfirmOpen(true)}
                className="h-8 items-center gap-1.5 rounded-lg border border-[#555] bg-[#222] px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-[#333] flex"
              >
                End 1st Innings
              </button>
            )}

            {match.status === 'LIVE' && currentInningsNum === 2 && (
              <button
                onClick={() => setIsEndMatchConfirmOpen(true)}
                className="h-8 items-center gap-1.5 rounded-lg border border-rose-500/50 bg-rose-950/30 px-2.5 py-1 text-xs font-bold text-rose-300 hover:bg-rose-900/50 flex"
              >
                End Match
              </button>
            )}
          </div>
        </div>
      </header>

      {isSettingsOpen && (
        <>
          <button
            type="button"
            aria-label="Close match settings"
            onClick={() => setIsSettingsOpen(false)}
            className="fixed inset-0 z-[60] bg-black/65 sm:hidden"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Match settings"
            className="fixed inset-y-0 right-0 z-[61] flex w-[82vw] max-w-md flex-col overflow-y-auto border-l border-[#292929] bg-black text-white shadow-2xl sm:hidden"
          >
            {[
              {
                id: 'match',
                label: 'Match Settings',
                items: [
                  ['Edit Scorecard', 'scorecard'],
                  ['Change Match Overs', 'unavailable'],
                  ['Match Rules (WD, NB, WW)', 'unavailable'],
                  ['Revise Target (DLS/VJD)', 'unavailable'],
                  ['Add Bonus Runs', 'unavailable'],
                  ['Give Penalty Runs', 'unavailable'],
                  [
                    match.status === 'INNINGS_BREAK' && currentInningsNum === 1
                      ? 'Start 2nd Innings'
                      : 'End / Declare Innings',
                    'end-innings'
                  ],
                  ['End Match', 'end-match']
                ]
              },
              {
                id: 'players',
                label: 'Players Settings',
                items: [
                  ['Change Playing Squad', 'squads'],
                  ['Change Bowler', 'change-bowler'],
                  ['Replace Batters', 'unavailable'],
                  ['Retired Hurt (Batter)', 'unavailable']
                ]
              },
              {
                id: 'scorer',
                label: 'Scorer Settings',
                items: [
                  ['Change Scorer', 'unavailable'],
                  ['Add Match Officials/Stream', 'unavailable'],
                  ['Select Power Play Overs', 'unavailable']
                ]
              },
              {
                id: 'other',
                label: 'Other Options',
                items: [
                  ['Scoring Help', 'scoring-help'],
                  ['Share Sync File', 'unavailable'],
                  ['Share the App', 'unavailable']
                ]
              }
            ].map((section) => (
              <section key={section.id} className="shrink-0">
                <button
                  type="button"
                  aria-expanded={expandedSettings[section.id]}
                  onClick={() => toggleSettingsSection(section.id)}
                  className="flex min-h-[58px] w-full items-center justify-between bg-[#1c1c1c] px-4 text-left text-[20px] font-normal tracking-tight text-white active:bg-[#292929]"
                >
                  <span>{section.label}</span>
                  {expandedSettings[section.id]
                    ? <ChevronUp className="h-5 w-5 shrink-0" />
                    : <ChevronDown className="h-5 w-5 shrink-0" />}
                </button>
                {expandedSettings[section.id] && (
                  <div className="bg-black py-1">
                    {section.items.map(([label, action]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => handleSettingsAction(action)}
                        className="flex min-h-[50px] w-full items-center px-6 text-left text-[19px] font-normal leading-6 text-white transition active:bg-[#202020] focus-visible:outline-none focus-visible:bg-[#202020]"
                      >
                        {label}
                      </button>
                    ))}
                    {section.id === 'other' && (
                      <div className="px-6 pb-5 pt-1 text-center text-sm text-slate-400">
                        <div className="border-t border-[#242424] pt-3">Scorer support</div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            ))}
          </aside>
        </>
      )}

      {/* 2. Top Tabs */}
      <div className="hidden h-[34px] shrink-0 overflow-x-auto border-b border-[#333] bg-[#181a1b] px-1.5 sm:flex sm:h-auto sm:border-slate-800 sm:bg-[#081226] sm:px-6">
        {[
          { id: 'console', label: 'CricHeroes Scorer Pad' },
          { id: 'scorecard', label: 'Full Scorecard' },
          { id: 'commentary', label: 'Ball-by-Ball' },
          { id: 'squads', label: 'Squads & Teams' }
        ].map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex h-full shrink-0 items-center border-b-2 px-2.5 py-1 sm:min-h-10 sm:px-5 sm:py-3 font-sans text-[11px] sm:font-sports sm:text-sm tracking-wide sm:tracking-wider transition-colors ${
              activeTab === tab.id ? 'border-[#36aaa5] text-[#58c3be] sm:border-amber-400 sm:text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="sm:hidden">{tab.id === 'console' ? 'Score' : tab.id === 'scorecard' ? 'Card' : tab.id === 'commentary' ? 'Balls' : 'Squads'}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 3. Main Area */}
      <div className={`flex-1 overflow-y-auto overscroll-contain p-0 sm:p-4 md:p-6 bg-[#17191a] sm:bg-[#040A18] ${activeTab === 'console' ? 'pb-[300px]' : 'pb-16 sm:pb-4'}`}>
        {activeTab === 'console' && (
          <div className="mx-auto flex min-h-full max-w-4xl flex-col sm:space-y-4">
            {/* If Match is UPCOMING, prompt for Toss */}
            {match.status === 'UPCOMING' && (
              <div className="rounded-2xl border border-dashed border-amber-500/40 bg-amber-950/20 p-4 sm:rounded-3xl sm:p-6 text-center space-y-3 sm:space-y-4">
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
            <div className="relative min-h-[300px] overflow-hidden rounded-xl border border-[#303536] bg-[radial-gradient(ellipse_at_50%_22%,#292d2e_0%,#191b1c_43%,#090a0b_100%)] p-3 shadow-xl sm:min-h-0 sm:rounded-2xl sm:border-slate-800 sm:bg-gradient-to-r sm:from-[#0C152E] sm:via-[#0E1A38] sm:to-[#0C152E] sm:p-5">
              <div className="hidden flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-slate-800/80 pb-1.5 sm:flex sm:pb-3">
                <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                  <span className="truncate text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#58c3be] sm:text-amber-400">
                    {battingTeamName} Innings ({currentInningsNum === 1 ? '1st' : '2nd'} Innings)
                  </span>
                  <span className="hidden text-[10px] text-slate-500 sm:inline sm:text-xs">• Max {match.oversLimit} Overs</span>
                </div>
                {currentInningsNum === 2 && liveSummary?.target && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                    Target: {liveSummary.target}
                  </span>
                )}
              </div>

              {/* Main Score & Overs Display */}
              <div className="hidden flex-col items-center justify-center gap-y-1 pt-3 text-center sm:flex sm:flex-row sm:justify-between sm:gap-x-2 sm:gap-y-1 sm:pt-3 sm:text-left sm:gap-4">
                <div className="min-w-0">
                  <div className="flex items-baseline justify-center gap-2 sm:justify-start sm:gap-3">
                    <span className="font-sans text-[50px] font-normal text-white tracking-tight sm:font-sports sm:text-6xl">
                      {liveSummary?.score || '0/0'}
                    </span>
                    <span className="font-sans text-[22px] font-normal text-white sm:font-sports sm:text-3xl sm:text-amber-400">
                      ({liveSummary?.overs || '0.0'} / {match.oversLimit} ov)
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-center gap-3 text-[10px] font-semibold text-slate-400 sm:mt-1 sm:justify-start sm:gap-4 sm:text-xs">
                    <span>CRR: <strong className="text-white">{liveSummary?.crr || '0.00'}</strong></span>
                    {liveSummary?.rrr && (
                      <span>RRR: <strong className="text-amber-400">{liveSummary.rrr}</strong></span>
                    )}
                  </div>
                </div>

                {/* Equation strip if chasing */}
                {currentInningsNum === 2 && liveSummary?.remainingRuns !== null && (
                  <div className="ml-auto rounded-lg border border-amber-500/30 bg-amber-950/30 px-2 py-1 text-right sm:rounded-xl sm:px-3 sm:py-2">
                    <div className="text-[10px] uppercase font-bold text-amber-400">Target Equation</div>
                    <div className="text-xs sm:text-base font-sports text-white tracking-wide">
                      Need {liveSummary.remainingRuns} runs from {liveSummary.remainingBalls} balls
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute inset-x-2 top-[90px] flex flex-col items-center text-center sm:hidden">
                <div className="flex items-baseline justify-center gap-2 whitespace-nowrap">
                  <span className="font-sans text-[50px] font-normal leading-none tracking-tight text-white">
                    {liveSummary?.score || '0/0'}
                  </span>
                  <span className="font-sans text-[22px] font-normal leading-none text-white">
                    ({liveSummary?.overs || '0.0'}/{match.oversLimit})
                  </span>
                </div>
                {currentInningsNum === 2 && liveSummary?.target && (
                  <div className="mt-2 text-sm text-white">Target {liveSummary.target}</div>
                )}
                {match.tossWinnerId && (
                  <p className="mt-2 max-w-[360px] text-[18px] font-normal leading-[1.25] text-slate-100">
                    {(match.tossWinnerId === match.teamAId ? match.teamAName : match.teamBName)} won the toss and elected to {match.tossDecision === 'BAT' ? 'bat' : 'field'}
                  </p>
                )}
              </div>
              <div className="absolute inset-x-0 bottom-7 text-center text-[20px] font-normal text-white sm:hidden">
                <span title={match.id}>Match ID: {match.id.length > 12 ? match.id.slice(-8) : match.id}</span>
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

            {match.status === 'INNINGS_BREAK' && currentInningsNum === 1 && (
              <div className="mx-3 my-2 flex items-center justify-between gap-3 rounded-lg border border-emerald-700/70 bg-emerald-950/60 p-3 sm:hidden">
                <p className="text-sm text-emerald-100">First innings complete. Start the chase to enable scoring.</p>
                <button
                  type="button"
                  onClick={() => setIsEndInningsConfirmOpen(true)}
                  className="shrink-0 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white active:bg-emerald-700"
                >
                  Start 2nd Innings
                </button>
              </div>
            )}

            {/* Active Batters & Bowler Cards */}
            <div className="grid grid-cols-2 gap-0 sm:gap-3 md:grid-cols-3">
              {/* Striker Card */}
              <div className={`min-w-0 rounded-l-lg border p-1 transition-all relative sm:rounded-2xl sm:p-3.5 ${
                striker ? 'border-[#189b96] bg-[#111617] shadow-lg shadow-black/20 sm:border-amber-500 sm:bg-amber-950/20 sm:shadow-amber-500/5' : 'border-[#383b3c] bg-[#111617] sm:border-slate-800 sm:bg-slate-900/60'
              }`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-[10px] font-bold uppercase tracking-wider text-[#58c3be] sm:text-amber-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#58c3be] animate-ping sm:bg-amber-400" />
                    Striker *
                  </span>
                  <button
                    type="button"
                    disabled={isSubmitting || match.status !== 'LIVE'}
                    onClick={handleSwapStrike}
                    title="Swap Strike"
                    className="inline-flex min-h-6 items-center gap-1 rounded-md bg-[#292d2e] px-1.5 text-[10px] font-bold text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-40 sm:p-1 sm:text-[10px]"
                  >
                    <ArrowRightLeft className="h-3 w-3" />
                    <span>Swap</span>
                  </button>
                </div>
                <div className="truncate font-sans text-[20px] font-normal leading-6 text-white sm:font-sports sm:text-xl">
                  {striker?.name || 'Select Striker'}
                </div>
                {striker && (
                  <div className="mt-0 flex items-baseline gap-1 border-t border-[#303536] pt-0 text-[18px] leading-5 text-white sm:mt-2 sm:justify-between sm:gap-2 sm:border-slate-800 sm:pt-2 sm:text-xs">
                    <span className="font-normal sm:text-base sm:text-amber-300">{striker.runs || 0}<span className="font-normal">({striker.balls || 0})</span></span>
                    <span className="hidden sm:inline">4s: <strong className="text-white">{striker.fours || 0}</strong></span>
                    <span className="hidden sm:inline">6s: <strong className="text-white">{striker.sixes || 0}</strong></span>
                    <span className="hidden sm:inline">SR: <strong className="text-white">{striker.strikeRate || '0.0'}</strong></span>
                  </div>
                )}
              </div>

              {/* Non-Striker Card */}
              <div className="min-w-0 rounded-r-lg border border-l-0 border-[#383b3c] bg-[#111617] p-1 sm:rounded-2xl sm:border-l sm:border-slate-800 sm:bg-[#091124] sm:p-3.5">
                <div className="mb-0.5 text-[10px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Non-Striker
                </div>
                <div className="truncate font-sans text-[20px] font-normal leading-6 text-white sm:font-sports sm:text-xl">
                  {nonStriker?.name || 'Select Non-Striker'}
                </div>
                {nonStriker && (
                  <div className="mt-0 flex items-baseline gap-1 border-t border-[#303536] pt-0 text-[18px] leading-5 text-white sm:mt-2 sm:justify-between sm:gap-2 sm:border-slate-800 sm:pt-2 sm:text-xs">
                    <span className="font-normal sm:text-base">{nonStriker.runs || 0}<span className="font-normal">({nonStriker.balls || 0})</span></span>
                    <span className="hidden sm:inline">4s: <strong className="text-white">{nonStriker.fours || 0}</strong></span>
                    <span className="hidden sm:inline">6s: <strong className="text-white">{nonStriker.sixes || 0}</strong></span>
                    <span className="hidden sm:inline">SR: <strong className="text-white">{nonStriker.strikeRate || '0.0'}</strong></span>
                  </div>
                )}
              </div>

              {/* Bowler Card */}
              <div className="col-span-2 min-h-[44px] min-w-0 rounded-b-lg border border-t-0 border-[#484b4c] bg-[#303233] px-2 py-0.5 sm:col-span-1 sm:min-h-0 sm:rounded-2xl sm:border-t sm:border-slate-800 sm:bg-[#091124] sm:p-3.5">
                <div className="flex items-center justify-between gap-2 sm:hidden">
                  <div className="min-w-0">
                    <div className="truncate font-sans text-[18px] font-normal leading-6 text-white">{bowler?.name || 'Select Bowler'}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="whitespace-nowrap text-[17px] font-normal text-white">
                      {bowler?.overs || '0.0'}-{bowler?.maidens || 0}-{bowler?.runsConceded || 0}-{bowler?.wickets || 0}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting || match.status !== 'LIVE'}
                    onClick={() => setIsBowlerModalOpen(true)}
                    className="min-h-8 shrink-0 rounded-md border border-[#15918c] bg-[#222627] px-2 text-[11px] font-semibold text-[#58c3be] disabled:opacity-40"
                  >
                    Change
                  </button>
                </div>
                <div className="hidden sm:block">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#58c3be] sm:text-[10px] sm:font-bold sm:text-purple-400">
                    Bowler
                  </span>
                  <button
                    type="button"
                    disabled={isSubmitting || match.status !== 'LIVE'}
                    onClick={() => setIsBowlerModalOpen(true)}
                    className="min-h-8 rounded-md border border-[#15918c] bg-[#222627] px-2 text-[11px] font-semibold text-[#58c3be] transition hover:text-white disabled:opacity-40 sm:border-purple-800/80 sm:bg-purple-950/80 sm:text-purple-300 sm:p-1 sm:text-[10px]"
                  >
                    Change
                  </button>
                </div>
                <div className="truncate font-sans text-lg font-medium text-white sm:font-sports sm:text-xl">
                  {bowler?.name || 'Select Bowler'}
                </div>
                {bowler && (
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-[#484b4c] pt-1.5 text-[11px] text-slate-100 sm:mt-2 sm:border-slate-800 sm:pt-2 sm:text-xs sm:text-slate-300">
                    <span>O: <strong className="text-white">{bowler.overs || '0.0'}</strong></span>
                    <span>M: <strong className="text-white">{bowler.maidens || 0}</strong></span>
                    <span>R: <strong className="text-white">{bowler.runsConceded || 0}</strong></span>
                    <span>W: <strong className="text-purple-400 font-bold text-sm">{bowler.wickets || 0}</strong></span>
                    <span>Econ: <strong className="text-white">{bowler.economy || '0.00'}</strong></span>
                  </div>
                )}
                </div>
              </div>
            </div>

            {/* This Over Strip (Delivery Pills) */}
            <div className="min-h-[84px] rounded-b-lg border border-t-0 border-[#484b4c] bg-[#303233] px-2.5 py-2 sm:min-h-0 sm:rounded-2xl sm:border-slate-800 sm:bg-[#070D1D] sm:p-3">
              <div className="mb-1.5 hidden items-center justify-between sm:mb-2 sm:flex">
                <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  This Over Deliveries:
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono">
                  {liveSummary?.currentOverDeliveries?.length || 0} balls bowled
                </span>
              </div>
              <div className="flex min-h-8 flex-wrap items-center gap-1.5 overflow-x-auto sm:min-h-10 sm:gap-2">
                {(!liveSummary?.currentOverDeliveries || liveSummary.currentOverDeliveries.length === 0) ? (
                  <span className="text-xs text-slate-500 italic">Start of over — waiting for delivery</span>
                ) : (
                  liveSummary.currentOverDeliveries.map((d, idx) => {
                    if (!d || typeof d !== 'object') {
                      return (
                        <div
                          key={idx}
                          className="flex h-12 min-w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-800 px-2 text-xs font-semibold text-white shadow-sm sm:h-9 sm:min-w-9"
                        >
                          {typeof d === 'string' && d.trim() ? d : '•'}
                        </div>
                      );
                    }
                    let badgeClass = 'bg-[#f4f4f5] text-[#151617] border-[#d6d7d8] sm:bg-slate-800 sm:text-white sm:border-slate-700';
                    let text = Number.isFinite(d.totalRuns) ? String(d.totalRuns) : (d.display || '•');

                    if (d.isWicket) {
                      badgeClass = 'bg-rose-600 text-white border-rose-500 font-bold';
                      text = 'W';
                    } else if (d.extraType === 'WIDE') {
                      badgeClass = 'bg-[#424546] text-white border-[#55595a] sm:bg-purple-900/80 sm:text-purple-200 sm:border-purple-700';
                      text = d.extraRuns > 1 ? `Wd+${d.extraRuns - 1}` : 'Wd';
                    } else if (d.extraType === 'NO_BALL') {
                      badgeClass = 'bg-[#424546] text-white border-[#55595a] sm:bg-amber-900/80 sm:text-amber-200 sm:border-amber-700';
                      text = d.batRuns > 0 ? `Nb+${d.batRuns}` : 'Nb';
                    } else if (d.batRuns === 6) {
                      badgeClass = 'bg-[#b8c91c] text-[#111] font-sports font-bold border-[#b8c91c] text-base sm:bg-amber-500 sm:text-slate-950 sm:border-amber-300';
                      text = '6';
                    } else if (d.batRuns === 4) {
                      badgeClass = 'bg-[#189b96] text-white font-sports font-bold border-[#43bbb6] text-base sm:bg-emerald-600 sm:border-emerald-400';
                      text = '4';
                    } else if (d.batRuns === 0 && d.isLegal) {
                      badgeClass = 'bg-[#222526] text-slate-400 border-[#35393a] sm:bg-slate-900 sm:border-slate-800';
                      text = '•';
                    }

                    return (
                      <div
                        key={idx}
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-[16px] shadow-sm font-semibold sm:h-9 sm:w-9 sm:text-xs ${badgeClass}`}
                      >
                        {text}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-30 bg-[#080808] px-0 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-10px_28px_rgba(0,0,0,0.4)] sm:hidden">
              <div className="grid grid-cols-4 gap-[2px] bg-[#242424]">
                <div className="col-span-3 row-span-2 grid grid-cols-3 grid-rows-2 gap-[2px]">
                  {[
                    { runs: 0, label: '0' },
                    { runs: 1, label: '1' },
                    { runs: 2, label: '2' },
                    { runs: 3, label: '3' },
                    { runs: 4, label: '4', sub: 'Four', bright: true },
                    { runs: 6, label: '6', sub: 'Six', bright: true }
                  ].map((button) => (
                    <button
                      type="button"
                      key={button.runs}
                      disabled={isSubmitting || match.status !== 'LIVE'}
                      onClick={() => handleScoreBall(button.runs)}
                      aria-label={`Record ${button.runs} ${button.runs === 1 ? 'run' : 'runs'}`}
                      className="flex min-h-[96px] flex-col items-center justify-center bg-[#090909] text-white active:bg-[#202020] disabled:opacity-40"
                    >
                      <span className="font-sans text-[28px] font-normal leading-none">{button.label}</span>
                      {button.sub && <span className="mt-1 text-sm font-normal">{button.sub}</span>}
                    </button>
                  ))}
                </div>
                <div className="col-start-4 row-span-2 flex flex-col gap-[2px]">
                  <button
                    type="button"
                    disabled={isSubmitting || !liveSummary?.recentDeliveries?.length}
                    onClick={handleUndoBall}
                    aria-label="Undo last ball"
                    className="flex min-h-0 flex-1 items-center justify-center bg-[#1a1a1a] px-1 text-[22px] font-normal text-[#75c6c1] disabled:opacity-40"
                  >
                    UNDO
                  </button>
                  <div className="flex min-h-0 flex-1 bg-[#1a1a1a]">
                    {[5, 7].map((runs) => (
                      <button
                        type="button"
                        key={runs}
                        disabled={isSubmitting || match.status !== 'LIVE'}
                        onClick={() => handleScoreBall(runs)}
                        aria-label={`Record ${runs} runs`}
                        className="min-w-0 flex-1 text-[22px] font-normal text-white disabled:opacity-40"
                      >
                        {runs}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
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
                    className="flex min-h-0 flex-1 items-center justify-center bg-[#1a1a1a] px-1 text-[22px] font-normal text-[#f21f32] disabled:opacity-40"
                  >
                    OUT
                  </button>
                </div>
                <div className="col-span-4 grid grid-cols-4 gap-[2px]">
                  {[
                    { type: 'WIDE', label: 'WD' },
                    { type: 'NO_BALL', label: 'NB' },
                    { type: 'BYE', label: 'BYE' },
                    { type: 'LEG_BYE', label: 'LB' }
                  ].map((extra) => (
                    <button
                      type="button"
                      key={extra.type}
                      disabled={isSubmitting || match.status !== 'LIVE'}
                      onClick={() => {
                        setExtrasForm({ type: extra.type, extraRuns: 1, batRuns: 0 });
                        setIsExtrasModalOpen(true);
                      }}
                      className="min-h-[62px] bg-[#1a1a1a] text-xl font-normal text-white active:bg-[#292929] disabled:opacity-40"
                    >
                      {extra.label}
                    </button>
                  ))}
                </div>
              </div>
              {isShortcutsExpanded && (
                <div className="space-y-2 bg-[#1b1b1b] py-2 text-center text-xs text-white">
                  <p>Tap a run · WD wide · NB no-ball · OUT wicket</p>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { id: 'console', label: 'Score' },
                      { id: 'scorecard', label: 'Card' },
                      { id: 'commentary', label: 'Balls' },
                      { id: 'squads', label: 'Squads' }
                    ].map((tab) => (
                      <button
                        type="button"
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsShortcutsExpanded(false);
                        }}
                        className={`rounded-md px-1 py-2 ${activeTab === tab.id ? 'bg-[#373737] text-white' : 'bg-[#090909] text-white'}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="button"
                aria-expanded={isShortcutsExpanded}
                onClick={() => setIsShortcutsExpanded((expanded) => !expanded)}
                className="mt-1 flex h-9 w-full items-center justify-center gap-2 bg-[#1c1c1c] text-base font-normal text-white"
              >
                Scoring shortcuts
                <ChevronRight className={`h-4 w-4 -rotate-90 transition-transform ${isShortcutsExpanded ? 'rotate-90' : ''}`} />
              </button>
            </div>

            {/* 4. CricHeroes Touch-First Scoring Keypad */}
            <div className="sticky bottom-0 z-20 -mx-1.5 hidden border-t border-slate-700/80 bg-[#071020]/[0.98] p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-10px_28px_rgba(2,6,23,0.65)] sm:static sm:mx-0 sm:block sm:rounded-3xl sm:border sm:border-slate-800 sm:bg-[#070D1D] sm:p-5 sm:shadow-none space-y-2 sm:space-y-3">
              {/* Main Runs Row */}
              <div className="grid grid-cols-6 gap-1 sm:gap-2">
                {[
                  { runs: 0, label: '0', sub: 'Dot', color: 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800' },
                  { runs: 1, label: '1', sub: 'Single', color: 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800' },
                  { runs: 2, label: '2', sub: 'Double', color: 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800' },
                  { runs: 3, label: '3', sub: 'Three', color: 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800' },
                  { runs: 4, label: '4', sub: 'FOUR!', color: 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border-emerald-600 shadow-md font-bold' },
                  { runs: 6, label: '6', sub: 'SIX!', color: 'bg-amber-950/80 hover:bg-amber-900 text-amber-400 border-amber-500 shadow-md font-bold' }
                ].map((btn) => (
                  <button
                    type="button"
                    key={btn.runs}
                    disabled={isSubmitting || match.status !== 'LIVE'}
                    onClick={() => handleScoreBall(btn.runs)}
                    aria-label={`Record ${btn.runs} ${btn.runs === 1 ? 'run' : 'runs'}`}
                    className={`min-h-12 rounded-lg sm:min-h-20 sm:rounded-2xl border flex flex-col items-center justify-center transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-40 disabled:cursor-not-allowed ${btn.color}`}
                  >
                    <span className="font-sports text-xl leading-none sm:text-3xl">{btn.label}</span>
                    <span className="hidden text-[10px] opacity-75 sm:inline">{btn.sub}</span>
                  </button>
                ))}
              </div>

              {/* Extras & Actions Row */}
              <div className="grid grid-cols-4 gap-1 sm:grid-cols-5 sm:gap-2">
                <button
                  type="button"
                  disabled={isSubmitting || match.status !== 'LIVE'}
                  onClick={() => {
                    setExtrasForm({ type: 'WIDE', extraRuns: 1, batRuns: 0 });
                    setIsExtrasModalOpen(true);
                  }}
                  className="min-h-10 rounded-lg border border-purple-800/80 bg-purple-950/40 text-purple-300 hover:bg-purple-900/60 font-sports text-[11px] sm:min-h-14 sm:rounded-xl sm:text-base flex items-center justify-center tracking-wide active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 disabled:opacity-40"
                >
                  WIDE
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || match.status !== 'LIVE'}
                  onClick={() => {
                    setExtrasForm({ type: 'NO_BALL', extraRuns: 1, batRuns: 0 });
                    setIsExtrasModalOpen(true);
                  }}
                  className="min-h-10 rounded-lg border border-amber-800/80 bg-amber-950/40 text-[10px] sm:min-h-14 sm:rounded-xl sm:text-base flex items-center justify-center tracking-wide active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-40"
                >
                  NO BALL
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || match.status !== 'LIVE'}
                  onClick={() => {
                    setExtrasForm({ type: 'BYE', extraRuns: 1, batRuns: 0 });
                    setIsExtrasModalOpen(true);
                  }}
                  className="min-h-10 rounded-lg border border-slate-700 bg-slate-900 text-[11px] sm:min-h-14 sm:rounded-xl sm:text-base flex items-center justify-center tracking-wide active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:opacity-40"
                >
                  BYE
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || match.status !== 'LIVE'}
                  onClick={() => {
                    setExtrasForm({ type: 'LEG_BYE', extraRuns: 1, batRuns: 0 });
                    setIsExtrasModalOpen(true);
                  }}
                  className="min-h-10 rounded-lg border border-slate-700 bg-slate-900 text-[10px] sm:min-h-14 sm:rounded-xl sm:text-base flex items-center justify-center tracking-wide active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:opacity-40"
                >
                  LEG BYE
                </button>

                {/* Big WICKET button */}
                <button
                  type="button"
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
                  className="col-span-4 sm:col-span-1 min-h-10 sm:min-h-14 rounded-lg sm:rounded-xl border border-rose-600 bg-gradient-to-r from-rose-700 to-rose-600 text-white font-sports text-sm sm:text-lg flex items-center justify-center tracking-wider hover:brightness-110 shadow-lg shadow-rose-900/40 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:opacity-40"
                >
                  ⚡ WICKET
                </button>
              </div>

              {/* Utility Tools Row (Undo, Change Bowler, End Innings) */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-1.5 sm:pt-2">
                <button
                  type="button"
                  disabled={isSubmitting || !liveSummary?.recentDeliveries?.length}
                  onClick={handleUndoBall}
                  className="flex min-h-10 items-center gap-1.5 rounded-lg border border-amber-600/50 bg-amber-950/40 px-3 py-2 text-[10px] font-bold text-amber-300 hover:bg-amber-900/60 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-xs"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Undo Last Ball</span>
                </button>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting || match.status !== 'LIVE' || isNextBowlerRequired}
                    onClick={() => setIsBowlerModalOpen(true)}
                    className="flex min-h-10 items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-[10px] font-bold text-slate-200 transition hover:border-slate-500 disabled:opacity-40 sm:gap-1.5 sm:rounded-xl sm:px-3.5 sm:py-2.5 sm:text-xs"
                  >
                    <span>Change Bowler</span>
                  </button>

                  <button
                    type="button"
                    onClick={refreshMatchData}
                    className="flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-2 text-xs font-semibold text-slate-400 transition hover:text-white sm:rounded-xl sm:px-3 sm:py-2.5"
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

      {activeTab !== 'console' && (
        <nav aria-label="Scoring sections" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 gap-px border-t border-[#777] bg-[#bbb] pb-[env(safe-area-inset-bottom)] sm:hidden">
          {[
            { id: 'console', label: 'Score' },
            { id: 'scorecard', label: 'Card' },
            { id: 'commentary', label: 'Balls' },
            { id: 'squads', label: 'Squads' }
          ].map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-12 bg-[#dedee0] text-sm ${activeTab === tab.id ? 'font-semibold text-[#159b96]' : 'text-[#171819]'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      )}

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
              {requiresNextBatter ? (
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
                  {availableBatters
                    .map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
              </div>
              ) : wicketEndsInnings ? (
                <p className="rounded-xl border border-rose-900/60 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
                  This is the final wicket. The innings will end without another batter.
                </p>
              ) : null}

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
                  disabled={isSubmitting || (requiresNextBatter &&
                    !availableBatters.some((person) => person.id === wicketForm.nextBatsmanId))}
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
              {!isNextBowlerRequired && (
                <button onClick={() => setIsBowlerModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400">
              {isNextBowlerRequired
                ? `Over complete. Select a different bowler before the next delivery. ${bowler?.name} cannot bowl consecutive overs.`
                : `Note: The bowler from the previous over (${bowler?.name}) cannot bowl consecutive overs.`}
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {bowlingSquad
                .filter((p) => p.id !== bowler?.id)
                .map((b) => {
                  const figures = currentInningsData?.bowling?.find((item) => item.id === b.id);
                  const quota = Number(match.oversPerBowler || Math.ceil(match.oversLimit / 5));
                  const quotaReached = figures?.legalBalls >= quota * 6;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      disabled={quotaReached}
                      onClick={() => setSelectedBowlerId(b.id)}
                      className={`w-full text-left p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                        quotaReached
                          ? 'cursor-not-allowed border-slate-900 bg-slate-950 text-slate-600'
                          : selectedBowlerId === b.id
                            ? 'border-purple-500 bg-purple-950/60 text-white font-bold'
                            : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>{b.name}</span>
                      {quotaReached
                        ? <span className="text-[10px] uppercase tracking-wide">Quota reached</span>
                        : selectedBowlerId === b.id && <Check className="h-4 w-4 text-purple-400" />}
                    </button>
                  );
                })}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              {!isNextBowlerRequired && (
                <button
                  type="button"
                  onClick={() => setIsBowlerModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
              )}
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
