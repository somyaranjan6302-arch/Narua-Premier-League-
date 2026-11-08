/**
 * NARUA PREMIER LEAGUE (NPL) - STANDALONE CRICKET SCORING ENGINE
 * 
 * Implements standard Laws of Cricket and T20/Limited Overs playing conditions:
 * - Legal ball accounting (wide & no ball do not count towards 6-ball over)
 * - Batter vs Extra runs breakdown
 * - Bowler figures and economy calculation
 * - Official dismissal rules & bowler wicket attribution
 * - Strike rotation (odd runs & over completions)
 * - 2nd innings target, remaining balls/runs & required run rate
 * - Deterministic replay calculation for 100% accurate Undo and Ball Corrections
 */

export const EXTRA_TYPES = {
  WIDE: 'WIDE',
  NO_BALL: 'NO_BALL',
  BYE: 'BYE',
  LEG_BYE: 'LEG_BYE',
  PENALTY: 'PENALTY'
};

export const WICKET_TYPES = {
  BOWLED: 'BOWLED',
  CAUGHT: 'CAUGHT',
  CAUGHT_AND_BOWLED: 'CAUGHT_AND_BOWLED',
  LBW: 'LBW',
  RUN_OUT: 'RUN_OUT',
  STUMPED: 'STUMPED',
  HIT_WICKET: 'HIT_WICKET',
  RETIRED_OUT: 'RETIRED_OUT',
  RETIRED_HURT: 'RETIRED_HURT',
  OBSTRUCTING_FIELD: 'OBSTRUCTING_FIELD',
  TIMED_OUT: 'TIMED_OUT',
  HIT_BALL_TWICE: 'HIT_BALL_TWICE'
};

// Bowler gets credit for these dismissals
export const BOWLER_CREDITED_WICKETS = new Set([
  WICKET_TYPES.BOWLED,
  WICKET_TYPES.CAUGHT,
  WICKET_TYPES.CAUGHT_AND_BOWLED,
  WICKET_TYPES.LBW,
  WICKET_TYPES.STUMPED,
  WICKET_TYPES.HIT_WICKET
]);

// Counts towards team wickets lost
export const TEAM_WICKET_TYPES = new Set([
  WICKET_TYPES.BOWLED,
  WICKET_TYPES.CAUGHT,
  WICKET_TYPES.CAUGHT_AND_BOWLED,
  WICKET_TYPES.LBW,
  WICKET_TYPES.RUN_OUT,
  WICKET_TYPES.STUMPED,
  WICKET_TYPES.HIT_WICKET,
  WICKET_TYPES.RETIRED_OUT,
  WICKET_TYPES.OBSTRUCTING_FIELD,
  WICKET_TYPES.TIMED_OUT,
  WICKET_TYPES.HIT_BALL_TWICE
]);

/**
 * Format legal balls as overs string (e.g. 15 balls -> "2.3")
 */
export const formatOvers = (legalBalls) => {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
};

/**
 * Format run rate
 */
export const calculateRunRate = (runs, legalBalls) => {
  if (!legalBalls || legalBalls === 0) return '0.00';
  return ((runs / legalBalls) * 6).toFixed(2);
};

/**
 * Format economy rate
 */
export const calculateEconomy = (runsConceded, legalBalls) => {
  if (!legalBalls || legalBalls === 0) return '0.00';
  return ((runsConceded / legalBalls) * 6).toFixed(2);
};

/**
 * Format strike rate
 */
export const calculateStrikeRate = (runs, ballsFaced) => {
  if (!ballsFaced || ballsFaced === 0) return '0.00';
  return ((runs / ballsFaced) * 100).toFixed(1);
};

/**
 * Build delivery summary label (e.g., "1", "4", "6", "W", "Wd", "Nb+1")
 */
export const getDeliveryDisplay = (delivery) => {
  if (delivery.wicketType && delivery.wicketType !== WICKET_TYPES.RETIRED_HURT) {
    if (delivery.batRuns > 0) return `W+${delivery.batRuns}`;
    return 'W';
  }
  if (delivery.extraType === EXTRA_TYPES.WIDE) {
    return delivery.totalRuns > 1 ? `${delivery.totalRuns}Wd` : 'Wd';
  }
  if (delivery.extraType === EXTRA_TYPES.NO_BALL) {
    return delivery.batRuns > 0 ? `Nb+${delivery.batRuns}` : 'Nb';
  }
  if (delivery.extraType === EXTRA_TYPES.BYE) {
    return `${delivery.extraRuns}B`;
  }
  if (delivery.extraType === EXTRA_TYPES.LEG_BYE) {
    return `${delivery.extraRuns}Lb`;
  }
  return String(delivery.batRuns ?? 0);
};

/**
 * Process a single delivery and calculate new state
 */
export const processDelivery = (currentState, deliveryInput) => {
  const {
    batRuns = 0,
    extraRuns = 0,
    extraType = null,
    isWicket = false,
    wicketType = null,
    dismissedPlayerId = null,
    dismissedPlayerName = null,
    incomingPlayerId = null,
    incomingPlayerName = null,
    fielderId = null,
    fielderName = null,
    runOutBatter = 'STRIKER', // 'STRIKER' | 'NON_STRIKER'
    customTotalRuns = null
  } = deliveryInput;

  // 1. Determine legality
  const isLegal = extraType !== EXTRA_TYPES.WIDE && extraType !== EXTRA_TYPES.NO_BALL;
  
  // 2. Calculate runs
  let totalRuns = 0;
  let bowlerRunsConceded = 0;
  let batterRuns = 0;
  let teamExtraRuns = 0;

  if (extraType === EXTRA_TYPES.WIDE) {
    // Standard wide = 1 extra + additional runs scored on wide
    const wideTotal = Math.max(1, (extraRuns || 1) + batRuns);
    totalRuns = customTotalRuns !== null ? customTotalRuns : wideTotal;
    teamExtraRuns = totalRuns;
    bowlerRunsConceded = totalRuns;
    batterRuns = 0; // Batsman does not get runs on wide
  } else if (extraType === EXTRA_TYPES.NO_BALL) {
    // No ball = 1 penalty extra + bat runs
    const nbExtra = extraRuns || 1;
    batterRuns = batRuns;
    teamExtraRuns = nbExtra;
    totalRuns = customTotalRuns !== null ? customTotalRuns : (nbExtra + batterRuns);
    bowlerRunsConceded = totalRuns;
  } else if (extraType === EXTRA_TYPES.BYE || extraType === EXTRA_TYPES.LEG_BYE) {
    // Byes / Leg byes: legal ball, extra for team, not charged to bowler
    teamExtraRuns = extraRuns || batRuns || 1;
    totalRuns = teamExtraRuns;
    batterRuns = 0;
    bowlerRunsConceded = 0;
  } else if (extraType === EXTRA_TYPES.PENALTY) {
    teamExtraRuns = extraRuns || 5;
    totalRuns = teamExtraRuns;
    batterRuns = 0;
    bowlerRunsConceded = 0;
  } else {
    // Normal delivery off the bat
    batterRuns = batRuns;
    totalRuns = batterRuns;
    bowlerRunsConceded = batterRuns;
    teamExtraRuns = 0;
  }

  // 3. Wicket accounting
  const isActualWicket = Boolean(isWicket && wicketType && TEAM_WICKET_TYPES.has(wicketType));
  const bowlerGetsWicket = Boolean(isWicket && wicketType && BOWLER_CREDITED_WICKETS.has(wicketType));
  const isRetiredHurt = wicketType === WICKET_TYPES.RETIRED_HURT;

  // 4. Update legal balls & over count
  const newLegalBalls = currentState.legalBalls + (isLegal ? 1 : 0);
  const overNumber = Math.floor(currentState.legalBalls / 6);
  const ballNumber = (currentState.legalBalls % 6) + 1;
  const isOverComplete = isLegal && (newLegalBalls % 6 === 0) && newLegalBalls > 0;

  // 5. Strike rotation
  let nextStriker = { ...currentState.currentStriker };
  let nextNonStriker = { ...currentState.currentNonStriker };
  let actualDismissedPlayerName = dismissedPlayerName;

  // Dismissal handling
  if (isActualWicket || isRetiredHurt) {
    const outPlayerId = dismissedPlayerId || (runOutBatter === 'NON_STRIKER' ? nextNonStriker.id : nextStriker.id);
    const isStrikerOut = outPlayerId === nextStriker.id;
    const isNonStrikerOut = outPlayerId === nextNonStriker.id;
    if (!isStrikerOut && !isNonStrikerOut) {
      throw new Error('The dismissed batter must be at the crease.');
    }
    actualDismissedPlayerName ||= isStrikerOut ? nextStriker.name : nextNonStriker.name;
    if ((isRetiredHurt ||
      (isActualWicket && (currentState.wickets || 0) + 1 < (currentState.maxWickets || 10))) &&
      !incomingPlayerId) {
      throw new Error('Select the incoming batter before recording the wicket.');
    }
    if (incomingPlayerId && (incomingPlayerId === nextStriker.id || incomingPlayerId === nextNonStriker.id)) {
      throw new Error('The incoming batter must be different from both batters at the crease.');
    }
    if (incomingPlayerId && currentState.batting?.some((batter) =>
      batter.id === incomingPlayerId && batter.isOut
    )) {
      throw new Error('A dismissed batter cannot return to the crease.');
    }
    const incoming = incomingPlayerId
      ? { id: incomingPlayerId, name: incomingPlayerName || 'New Batter' }
      : null;
    if (isStrikerOut) nextStriker = incoming;
    else nextNonStriker = incoming;
  }

  // Physical runs taken running between wickets (odd runs swap ends)
  // On wide or no-ball, physical runs running also rotate strike
  const physicalRuns = (extraType === EXTRA_TYPES.BYE || extraType === EXTRA_TYPES.LEG_BYE)
    ? teamExtraRuns
    : (extraType === EXTRA_TYPES.WIDE ? (totalRuns - 1) : batterRuns);

  if (physicalRuns % 2 === 1) {
    const temp = nextStriker;
    nextStriker = nextNonStriker;
    nextNonStriker = temp;
  }

  // End of over strike rotation
  if (isOverComplete) {
    const temp = nextStriker;
    nextStriker = nextNonStriker;
    nextNonStriker = temp;
  }

  const deliveryRecord = {
    sequenceNumber: currentState.deliveries.length + 1,
    overNumber,
    ballNumber: isLegal ? ballNumber : (currentState.legalBalls % 6) + 1,
    strikerId: currentState.currentStriker.id,
    strikerName: currentState.currentStriker.name,
    nonStrikerId: currentState.currentNonStriker.id,
    nonStrikerName: currentState.currentNonStriker.name,
    bowlerId: currentState.currentBowler.id,
    bowlerName: currentState.currentBowler.name,
    batRuns: batterRuns,
    extraRuns: teamExtraRuns,
    extraType,
    totalRuns,
    bowlerRunsConceded,
    isLegal,
    isWicket: isActualWicket,
    bowlerGetsWicket,
    wicketType,
    dismissedPlayerId: isActualWicket || isRetiredHurt ? (dismissedPlayerId || nextStriker.id) : null,
    dismissedPlayerName: isActualWicket || isRetiredHurt ? actualDismissedPlayerName : null,
    incomingPlayerId,
    incomingPlayerName,
    fielderId,
    fielderName,
    display: getDeliveryDisplay({ batRuns: batterRuns, extraType, extraRuns: teamExtraRuns, totalRuns, wicketType }),
    timestamp: new Date().toISOString()
  };

  return {
    delivery: deliveryRecord,
    isOverComplete,
    nextStriker,
    nextNonStriker
  };
};

/**
 * Replay an entire innings from scratch given match configuration and delivery list.
 * This guarantees 100% mathematical consistency for scorecard, partnerships, FOW, and undo!
 */
export const calculateInningsState = ({
  maxOvers = 20,
  maxWickets = 10,
  target = null,
  openingStriker,
  openingNonStriker,
  openingBowler,
  deliveries = []
}) => {
  let totalRuns = 0;
  let wickets = 0;
  let legalBalls = 0;
  let wideCount = 0;
  let noBallCount = 0;
  let byeCount = 0;
  let legByeCount = 0;
  let penaltyRuns = 0;

  const battingStats = new Map();
  const bowlingStats = new Map();
  const fallOfWickets = [];
  const recentDeliveries = [];

  // Helper to get or init batter stat
  const getBatter = (id, name) => {
    if (!battingStats.has(id)) {
      battingStats.set(id, {
        id,
        name,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        dots: 0,
        dismissal: 'not out',
        isOut: false,
        strikeRate: '0.00'
      });
    }
    return battingStats.get(id);
  };

  // Helper to get or init bowler stat
  const getBowler = (id, name) => {
    if (!bowlingStats.has(id)) {
      bowlingStats.set(id, {
        id,
        name,
        legalBalls: 0,
        overs: '0.0',
        runsConceded: 0,
        wickets: 0,
        maidens: 0,
        wides: 0,
        noBalls: 0,
        economy: '0.00',
        currentOverRuns: 0,
        currentOverLegalBalls: 0
      });
    }
    return bowlingStats.get(id);
  };

  let currentStriker = openingStriker || { id: 'unknown', name: 'Striker' };
  let currentNonStriker = openingNonStriker || { id: 'unknown', name: 'Non-Striker' };
  let currentBowler = openingBowler || { id: 'unknown', name: 'Bowler' };

  if (currentStriker.id) getBatter(currentStriker.id, currentStriker.name);
  if (currentNonStriker.id) getBatter(currentNonStriker.id, currentNonStriker.name);
  if (currentBowler.id) getBowler(currentBowler.id, currentBowler.name);

  let currentOverDeliveries = [];

  for (const del of deliveries) {
    if (legalBalls > 0 && legalBalls % 6 === 0) currentOverDeliveries = [];
    const isLegal = del.isLegal !== false && del.extraType !== EXTRA_TYPES.WIDE && del.extraType !== EXTRA_TYPES.NO_BALL;
    if (del.strikerId) currentStriker = { id: del.strikerId, name: del.strikerName };
    if (del.nonStrikerId) currentNonStriker = { id: del.nonStrikerId, name: del.nonStrikerName };
    if (del.bowlerId) currentBowler = { id: del.bowlerId, name: del.bowlerName };
    const batter = getBatter(del.strikerId, del.strikerName);
    const bowler = getBowler(del.bowlerId, del.bowlerName);

    // Runs
    totalRuns += del.totalRuns || 0;
    if (isLegal) legalBalls += 1;

    // Extras count
    if (del.extraType === EXTRA_TYPES.WIDE) wideCount += (del.extraRuns || del.totalRuns || 1);
    else if (del.extraType === EXTRA_TYPES.NO_BALL) noBallCount += (del.extraRuns || 1);
    else if (del.extraType === EXTRA_TYPES.BYE) byeCount += (del.extraRuns || 1);
    else if (del.extraType === EXTRA_TYPES.LEG_BYE) legByeCount += (del.extraRuns || 1);
    else if (del.extraType === EXTRA_TYPES.PENALTY) penaltyRuns += (del.extraRuns || 5);

    // Batter stats
    if (del.extraType !== EXTRA_TYPES.WIDE) {
      batter.balls += 1; // Wide does not count as ball faced by batter
    }
    batter.runs += del.batRuns || 0;
    if (del.batRuns === 4) batter.fours += 1;
    if (del.batRuns === 6) batter.sixes += 1;
    if (del.batRuns === 0 && isLegal && !del.isWicket) batter.dots += 1;
    batter.strikeRate = calculateStrikeRate(batter.runs, batter.balls);

    // Bowler stats
    if (isLegal) bowler.legalBalls += 1;
    bowler.runsConceded += del.bowlerRunsConceded ?? (del.extraType === EXTRA_TYPES.BYE || del.extraType === EXTRA_TYPES.LEG_BYE ? 0 : del.totalRuns);
    if (del.extraType === EXTRA_TYPES.WIDE) bowler.wides += 1;
    if (del.extraType === EXTRA_TYPES.NO_BALL) bowler.noBalls += 1;

    // Track runs in current over for maiden determination
    bowler.currentOverRuns += (del.extraType === EXTRA_TYPES.BYE || del.extraType === EXTRA_TYPES.LEG_BYE ? 0 : del.totalRuns);
    if (isLegal) bowler.currentOverLegalBalls += 1;

    if (bowler.currentOverLegalBalls === 6) {
      if (bowler.currentOverRuns === 0) bowler.maidens += 1;
      bowler.currentOverRuns = 0;
      bowler.currentOverLegalBalls = 0;
    }

    bowler.overs = formatOvers(bowler.legalBalls);
    bowler.economy = calculateEconomy(bowler.runsConceded, bowler.legalBalls);

    // Wickets
    if (del.isWicket && TEAM_WICKET_TYPES.has(del.wicketType)) {
      wickets += 1;
      const dismissedId = del.dismissedPlayerId || del.strikerId;
      const dismissedBatter = battingStats.get(dismissedId) || batter;
      dismissedBatter.isOut = true;
      const incoming = del.incomingPlayerId
        ? { id: del.incomingPlayerId, name: del.incomingPlayerName || 'New Batter' }
        : null;
      if (dismissedId === currentStriker?.id) currentStriker = incoming;
      else if (dismissedId === currentNonStriker?.id) currentNonStriker = incoming;

      let dismissalText = 'out';
      if (del.wicketType === WICKET_TYPES.BOWLED) dismissalText = `b ${del.bowlerName}`;
      else if (del.wicketType === WICKET_TYPES.CAUGHT) dismissalText = del.fielderName ? `c ${del.fielderName} b ${del.bowlerName}` : `c & b ${del.bowlerName}`;
      else if (del.wicketType === WICKET_TYPES.CAUGHT_AND_BOWLED) dismissalText = `c & b ${del.bowlerName}`;
      else if (del.wicketType === WICKET_TYPES.LBW) dismissalText = `lbw b ${del.bowlerName}`;
      else if (del.wicketType === WICKET_TYPES.RUN_OUT) dismissalText = del.fielderName ? `run out (${del.fielderName})` : 'run out';
      else if (del.wicketType === WICKET_TYPES.STUMPED) dismissalText = del.fielderName ? `st ${del.fielderName} b ${del.bowlerName}` : `st b ${del.bowlerName}`;
      else if (del.wicketType === WICKET_TYPES.HIT_WICKET) dismissalText = `hit wicket b ${del.bowlerName}`;
      else if (del.wicketType === WICKET_TYPES.RETIRED_OUT) dismissalText = 'retired out';

      dismissedBatter.dismissal = dismissalText;

      if (BOWLER_CREDITED_WICKETS.has(del.wicketType)) {
        bowler.wickets += 1;
      }

      fallOfWickets.push({
        wicketNumber: wickets,
        score: totalRuns,
        overs: formatOvers(legalBalls),
        playerId: dismissedBatter.id,
        playerName: dismissedBatter.name
      });
    } else if (del.wicketType === WICKET_TYPES.RETIRED_HURT) {
      const dismissedId = del.dismissedPlayerId || del.strikerId;
      const dismissedBatter = battingStats.get(dismissedId) || batter;
      dismissedBatter.dismissal = 'retired hurt';
      if (del.incomingPlayerId) {
        const incoming = { id: del.incomingPlayerId, name: del.incomingPlayerName || 'New Batter' };
        if (dismissedId === currentStriker.id) currentStriker = incoming;
        else if (dismissedId === currentNonStriker.id) currentNonStriker = incoming;
      }
    }

    // Strike rotation simulation
    const physicalRuns = (del.extraType === EXTRA_TYPES.BYE || del.extraType === EXTRA_TYPES.LEG_BYE)
      ? (del.extraRuns || del.totalRuns)
      : (del.extraType === EXTRA_TYPES.WIDE ? Math.max(0, del.totalRuns - 1) : (del.batRuns || 0));

    if (physicalRuns % 2 === 1) {
      const temp = currentStriker;
      currentStriker = currentNonStriker;
      currentNonStriker = temp;
    }

    // If over completed
    if (isLegal && (legalBalls % 6 === 0) && legalBalls > 0) {
      const temp = currentStriker;
      currentStriker = currentNonStriker;
      currentNonStriker = temp;
    }

    currentOverDeliveries.push({
      ...del,
      display: del.display || getDeliveryDisplay(del)
    });
    recentDeliveries.push(del.display || getDeliveryDisplay(del));
  }

  // Calculate totals and status
  const maxLegalBalls = maxOvers * 6;
  const isAllOut = wickets >= maxWickets;
  const isOversComplete = legalBalls >= maxLegalBalls;
  const isTargetChased = target !== null && totalRuns >= target;

  let isInningsComplete = isAllOut || isOversComplete || isTargetChased;

  let remainingRuns = null;
  let remainingBalls = null;
  let requiredRunRate = null;

  if (target !== null) {
    remainingRuns = Math.max(0, target - totalRuns);
    remainingBalls = Math.max(0, maxLegalBalls - legalBalls);
    requiredRunRate = remainingBalls > 0 ? ((remainingRuns / remainingBalls) * 6).toFixed(2) : '0.00';
  }

  const extrasTotal = wideCount + noBallCount + byeCount + legByeCount + penaltyRuns;

  return {
    totalRuns,
    wickets,
    legalBalls,
    overs: formatOvers(legalBalls),
    currentRunRate: calculateRunRate(totalRuns, legalBalls),
    target,
    remainingRuns,
    remainingBalls,
    requiredRunRate,
    extras: {
      total: extrasTotal,
      wides: wideCount,
      noBalls: noBallCount,
      byes: byeCount,
      legByes: legByeCount,
      penalty: penaltyRuns
    },
    batting: Array.from(battingStats.values()),
    bowling: Array.from(bowlingStats.values()),
    fallOfWickets,
    recentDeliveries: recentDeliveries.slice(-12),
    currentOverDeliveries,
    currentStriker,
    currentNonStriker,
    currentBowler,
    isInningsComplete,
    isAllOut,
    maxWickets,
    isOversComplete,
    isTargetChased
  };
};

/**
 * Net Run Rate (NRR) Calculator
 * NRR = (Runs Scored / Overs Faced) - (Runs Conceded / Overs Bowled)
 * Note: If a team is bowled all-out inside their quota, their overs faced are counted as full quota overs!
 */
export const calculateTournamentNetRunRate = ({
  runsScored,
  ballsFaced,
  quotaOversFaced,
  runsConceded,
  ballsBowled,
  quotaOversBowled
}) => {
  const oversFacedDecimal = quotaOversFaced || (Math.floor(ballsFaced / 6) + (ballsFaced % 6) / 6);
  const oversBowledDecimal = quotaOversBowled || (Math.floor(ballsBowled / 6) + (ballsBowled % 6) / 6);

  if (oversFacedDecimal === 0 || oversBowledDecimal === 0) return '0.000';

  const forRate = runsScored / oversFacedDecimal;
  const againstRate = runsConceded / oversBowledDecimal;
  const nrr = forRate - againstRate;

  return (nrr >= 0 ? `+${nrr.toFixed(3)}` : nrr.toFixed(3));
};
