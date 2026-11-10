export class AuctionBidError extends Error {
  constructor(message, status = 409) {
    super(message);
    this.status = status;
  }
}

export const isAuctionTeamEligible = (team, season) => {
  if (!team || team.active === false || typeof season !== 'string' || !season) return false;
  const sessions = Array.isArray(team.sessions) ? team.sessions
    : Array.isArray(team.seasons) ? team.seasons
      : team.session ? [team.session] : [];
  return sessions.includes(season);
};

export const hasAuctionProcessedPlayer = (state, playerId) => Boolean(playerId && (
  (state?.soldPlayers || []).some((player) => player.playerId === playerId) ||
  (state?.unsoldPlayers || []).some((player) => player.playerId === playerId || player.id === playerId)
));

export const publicAuctionState = (state) => {
  if (!state) return state;
  const { auditLog: _auditLog, ...publicState } = state;
  return publicState;
};

const createAuditEntry = (actor, action, details, now) => ({
  id: globalThis.crypto.randomUUID(),
  timestamp: now.toISOString(),
  actorId: actor.adminId,
  actorRole: actor.role,
  action,
  details
});

export const auditAuctionTransition = (previousState, nextState, {
  actor,
  exceptionReason,
  now = new Date()
}) => {
  const entries = [];
  const previousPlayerId = previousState.currentPlayer?.id;
  const nextPlayerId = nextState.currentPlayer?.id;

  if (nextPlayerId && nextPlayerId !== previousPlayerId) {
    if (previousPlayerId) {
      throw new AuctionBidError('Finish the current player before calling another player.');
    }
    const wasSold = (previousState.soldPlayers || []).some((player) => player.playerId === nextPlayerId);
    if (wasSold) throw new AuctionBidError('A sold player cannot be re-auctioned.');

    const wasUnsold = hasAuctionProcessedPlayer(previousState, nextPlayerId);
    if (wasUnsold && (typeof exceptionReason !== 'string' || exceptionReason.trim().length < 5 ||
      exceptionReason.trim().length > 500)) {
      throw new AuctionBidError('A re-auction of an unsold player requires an exception reason of 5-500 characters.', 400);
    }

    entries.push(createAuditEntry(actor, wasUnsold ? 'PLAYER_REAUCTIONED' : 'PLAYER_CALLED', {
      playerId: nextPlayerId,
      reason: wasUnsold ? exceptionReason.trim() : undefined
    }, now));
  }

  if (previousState.status !== nextState.status) {
    entries.push(createAuditEntry(actor, 'STATUS_CHANGED', {
      from: previousState.status,
      to: nextState.status
    }, now));
  }

  for (const field of ['purseCap', 'minimumBidIncrement', 'maxSquadSize']) {
    if (previousState[field] !== nextState[field]) {
      entries.push(createAuditEntry(actor, 'AUCTION_RULE_CHANGED', {
        field,
        from: previousState[field],
        to: nextState[field]
      }, now));
    }
  }

  for (const [teamId, purseCap] of Object.entries(nextState.teamPurseCaps || {})) {
    const previousCap = previousState.teamPurseCaps?.[teamId] ?? previousState.purseCap;
    if (previousCap !== purseCap) {
      const previousRemaining = previousState.teamPurses?.[teamId] ?? previousCap;
      const spent = Math.max(0, previousCap - previousRemaining);
      if (purseCap < spent || nextState.teamPurses?.[teamId] !== purseCap - spent) {
        throw new AuctionBidError('A team purse cap cannot be lower than its spending, and the remaining purse must match the new cap.', 400);
      }
      if (nextState.currentPlayer && nextState.currentBiddingTeam === teamId &&
        nextState.teamPurses[teamId] < nextState.currentBid) {
        throw new AuctionBidError('A team purse cap cannot be lower than its current bid.', 400);
      }
      entries.push(createAuditEntry(actor, 'TEAM_PURSE_CHANGED', {
        teamId,
        from: previousCap,
        to: purseCap,
        remaining: nextState.teamPurses?.[teamId]
      }, now));
    }
  }

  for (const [teamId, remaining] of Object.entries(nextState.teamPurses || {})) {
    const previousRemaining = previousState.teamPurses?.[teamId];
    if (previousRemaining !== undefined && previousRemaining !== remaining) {
      entries.push(createAuditEntry(actor, 'TEAM_PURSE_BALANCE_CHANGED', {
        teamId,
        from: previousRemaining,
        to: remaining
      }, now));
    }
  }

  const previousSoldIds = new Set((previousState.soldPlayers || []).map((player) => player.playerId));
  for (const player of nextState.soldPlayers || []) {
    if (!previousSoldIds.has(player.playerId)) {
      entries.push(createAuditEntry(actor, 'PLAYER_SOLD', {
        playerId: player.playerId,
        teamId: player.teamId,
        price: player.soldPrice
      }, now));
    }
  }

  const previousUnsoldIds = new Set((previousState.unsoldPlayers || []).map((player) => player.playerId || player.id));
  for (const player of nextState.unsoldPlayers || []) {
    const playerId = player.playerId || player.id;
    if (!previousUnsoldIds.has(playerId)) {
      entries.push(createAuditEntry(actor, 'PLAYER_MARKED_UNSOLD', { playerId }, now));
    }
  }

  return {
    ...nextState,
    auditLog: [...(previousState.auditLog || []), ...entries]
  };
};

export const appendAuctionBidAudit = (state, actor, bid, now = new Date()) => ({
  ...state,
  auditLog: [
    ...(state.auditLog || []),
    createAuditEntry(actor, 'BID_PLACED', {
      teamId: bid.teamId,
      teamName: bid.teamName.trim(),
      amount: state.currentBid,
      playerId: state.currentPlayer?.id
    }, now)
  ]
});

export const setAuctionTeamPurseCap = (state, teamId, purseCap) => {
  if (typeof teamId !== 'string' || !teamId ||
    !Number.isSafeInteger(purseCap) || purseCap <= 0) {
    throw new AuctionBidError('Enter a valid team purse cap.', 400);
  }
  const currentCap = state.teamPurseCaps?.[teamId] ?? state.purseCap ?? 5000000;
  const currentRemaining = state.teamPurses?.[teamId] ?? currentCap;
  const spent = Math.max(0, currentCap - currentRemaining);
  if (purseCap < spent) {
    throw new AuctionBidError('The purse cap cannot be lower than this team’s spending.');
  }
  const remaining = purseCap - spent;
  if (state.currentPlayer && state.currentBiddingTeam === teamId &&
    remaining < state.currentBid) {
    throw new AuctionBidError('The purse cap cannot be lower than this team’s current bid.');
  }
  return {
    ...state,
    teamPurseCaps: { ...state.teamPurseCaps, [teamId]: purseCap },
    teamPurses: { ...state.teamPurses, [teamId]: remaining }
  };
};

export const MAX_AUCTION_PHOTO_BYTES = 250 * 1024;
export const isAuctionPlayerPhotoUrl = (value) => (
  typeof value === 'string' &&
  /^\/api\/media\/auction-player-photo%3A[A-Za-z0-9._-]{1,120}(?:\?v=[A-Za-z0-9_-]{1,32})?$/.test(value)
);

export const auctionPhotoByteLength = (base64) => {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor(base64.length * 3 / 4) - padding;
};

export const applyAuctionBid = (state, { teamId, teamName, increment }, now = new Date()) => {
  if (!state || state.status !== 'live' || !state.currentPlayer) {
    throw new AuctionBidError('The auction is not accepting bids right now.');
  }
  if (typeof teamId !== 'string' || !/^[A-Za-z0-9._:-]{1,120}$/.test(teamId) ||
    typeof teamName !== 'string' || !teamName.trim() || teamName.length > 120) {
    throw new AuctionBidError('Choose a valid franchise.', 400);
  }
  if (!Number.isSafeInteger(increment) || increment <= 0 ||
    !Number.isSafeInteger(state.currentBid) || state.currentBid < 0) {
    throw new AuctionBidError('Enter a valid bid increment.', 400);
  }
  const minimumBidIncrement = Number.isSafeInteger(state.minimumBidIncrement) && state.minimumBidIncrement > 0
    ? state.minimumBidIncrement
    : 100;
  if (increment < minimumBidIncrement) {
    throw new AuctionBidError(`The minimum bid increment is ₹${minimumBidIncrement}.`, 400);
  }
  const maxSquadSize = Number.isSafeInteger(state.maxSquadSize) && state.maxSquadSize > 0
    ? state.maxSquadSize
    : 13;
  const teamSquadCount = (state.soldPlayers || []).filter((player) => (
    player.teamId === teamId ||
    (!player.teamId && player.team?.toLowerCase() === teamName.trim().toLowerCase())
  )).length;
  if (teamSquadCount >= maxSquadSize) {
    throw new AuctionBidError(`${teamName} has reached the maximum squad size.`);
  }

  const amount = state.currentBid + increment;
  if (!Number.isSafeInteger(amount)) {
    throw new AuctionBidError('The bid amount is too large.', 400);
  }

  const purseCap = Number.isSafeInteger(state.purseCap) ? state.purseCap : 5000000;
  const teamPurseCap = state.teamPurseCaps?.[teamId] ?? purseCap;
  const purse = state.teamPurses?.[teamId] ?? teamPurseCap;
  if (!Number.isSafeInteger(purse) || amount > purse) {
    throw new AuctionBidError(`${teamName} does not have enough purse remaining.`);
  }

  const currentPlayer = { ...state.currentPlayer };
  if (typeof currentPlayer.photo === 'string' && currentPlayer.photo.startsWith('data:image/')) {
    delete currentPlayer.photo;
  }

  return {
    ...state,
    currentPlayer,
    currentBid: amount,
    currentBiddingTeam: teamId,
    bidHistory: [
      {
        team: teamName.trim(),
        amount,
        time: now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
      },
      ...(Array.isArray(state.bidHistory) ? state.bidHistory : []).slice(0, 19)
    ],
    version: (Number.isSafeInteger(state.version) ? state.version : 0) + 1,
    updatedAt: now.toISOString()
  };

};

export const compactAuctionState = (state, photoUrl, now = new Date()) => {
  const photo = state?.currentPlayer?.photo;
  if (!state?.currentPlayer || typeof photoUrl !== 'string' || !photoUrl || photoUrl === photo) return null;
  if (photo && typeof photo === 'string' &&
    !photo.startsWith('data:image/') && !photo.startsWith('/api/auction/player-photo?')) return null;

  const currentPlayer = { ...state.currentPlayer };
  currentPlayer.photo = photoUrl;
  return {
    ...state,
    currentPlayer,
    version: (Number.isSafeInteger(state.version) ? state.version : 0) + 1,
    updatedAt: now.toISOString()
  };
};

export const auctionBidSnapshot = (state) => ({
  version: state.version,
  status: state.status,
  currentPlayerId: state.currentPlayer?.id || null,
  currentBid: state.currentBid,
  currentBiddingTeam: state.currentBiddingTeam,
  bidHistory: state.bidHistory,
  updatedAt: state.updatedAt
});

export const commitAuctionBid = async ({ readState, compareAndSet, bid, actor, maxAttempts = 8 }) => {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const currentState = await readState();
    let nextState;
    try {
      nextState = applyAuctionBid(currentState, bid);
      if (actor) nextState = appendAuctionBidAudit(nextState, actor, bid);
    } catch (error) {
      if (error instanceof AuctionBidError) error.state = currentState;
      throw error;
    }

    const expectedVersion = Number.isSafeInteger(currentState.version) ? currentState.version : 0;
    const savedState = await compareAndSet(nextState, expectedVersion);
    if (savedState) return savedState;
  }

  const error = new AuctionBidError('Bidding is busy. The latest bid has been loaded; please place your bid again.');
  error.state = await readState();
  throw error;
};
