export class AuctionBidError extends Error {
  constructor(message, status = 409) {
    super(message);
    this.status = status;
  }
}

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

  const amount = state.currentBid + increment;
  if (!Number.isSafeInteger(amount)) {
    throw new AuctionBidError('The bid amount is too large.', 400);
  }

  const purseCap = Number.isSafeInteger(state.purseCap) ? state.purseCap : 5000000;
  const purse = state.teamPurses?.[teamId] ?? purseCap;
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

export const commitAuctionBid = async ({ readState, compareAndSet, bid, maxAttempts = 8 }) => {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const currentState = await readState();
    let nextState;
    try {
      nextState = applyAuctionBid(currentState, bid);
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
