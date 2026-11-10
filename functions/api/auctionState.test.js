import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyAuctionBid,
  appendAuctionBidAudit,
  auditAuctionTransition,
  auctionBidSnapshot,
  auctionPhotoByteLength,
  commitAuctionBid,
  compactAuctionState,
  hasAuctionProcessedPlayer,
  isAuctionTeamEligible,
  isAuctionPlayerPhotoUrl,
  MAX_AUCTION_PHOTO_BYTES,
  publicAuctionState,
  setAuctionTeamPurseCap
} from './auctionState.js';

const initialState = {
  status: 'live',
  currentPlayer: { id: 'player-1', photo: `data:image/png;base64,${'a'.repeat(10000)}` },
  currentBid: 100,
  currentBiddingTeam: null,
  bidHistory: [],
  purseCap: 5000,
  teamPurses: { teamA: 1000, teamB: 500 },
  version: 3,
  updatedAt: '2026-11-07T00:00:00.000Z'
};

test('auction team eligibility requires an active team assigned to the requested season', () => {
  assert.equal(isAuctionTeamEligible({ id: 'teamA', sessions: ['Season 6'] }, 'Season 6'), true);
  assert.equal(isAuctionTeamEligible({ id: 'teamA', sessions: ['Season 5'] }, 'Season 6'), false);
  assert.equal(isAuctionTeamEligible({ id: 'teamA', sessions: ['Season 6'], active: false }, 'Season 6'), false);
  assert.equal(isAuctionTeamEligible({ id: 'teamA' }, 'Season 6'), false);
});

test('processed auction players are detected in sold and unsold history', () => {
  const state = {
    soldPlayers: [{ playerId: 'sold-player' }],
    unsoldPlayers: [{ playerId: 'unsold-player' }]
  };
  assert.equal(hasAuctionProcessedPlayer(state, 'sold-player'), true);
  assert.equal(hasAuctionProcessedPlayer(state, 'unsold-player'), true);
  assert.equal(hasAuctionProcessedPlayer(state, 'other-player'), false);
});

test('auction purse rules keep a team-specific cap separate from the default cap', () => {
  const state = setAuctionTeamPurseCap({
    ...initialState,
    teamPurseCaps: { teamA: 1000, teamB: 500 },
    teamPurses: { teamA: 800, teamB: 500 }
  }, 'teamA', 1200);
  const teamBState = setAuctionTeamPurseCap(state, 'teamB', 700);
  assert.equal(state.teamPurseCaps.teamA, 1200);
  assert.equal(state.teamPurses.teamA, 1000);
  assert.equal(teamBState.teamPurseCaps.teamB, 700);
  assert.equal(teamBState.teamPurses.teamB, 700);
  assert.throws(() => setAuctionTeamPurseCap(state, 'teamA', 100), /cannot be lower than this team’s spending/);
});

test('audits a re-auction only when an unsold player has an exception reason', () => {
  const previous = {
    ...initialState,
    currentPlayer: null,
    unsoldPlayers: [{ playerId: 'player-1', playerName: 'Player One' }]
  };
  const next = { ...previous, currentPlayer: { id: 'player-1', name: 'Player One' } };
  const options = { actor: { adminId: 'owner', role: 'owner' } };
  assert.throws(() => auditAuctionTransition(previous, next, options), /requires an exception reason/);

  const audited = auditAuctionTransition(previous, next, {
    ...options,
    exceptionReason: 'Correction approved by the tournament owner.',
    now: new Date('2026-11-07T00:01:00.000Z')
  });
  assert.equal(audited.auditLog[0].action, 'PLAYER_REAUCTIONED');
  assert.equal(audited.auditLog[0].actorId, 'owner');
  assert.match(audited.auditLog[0].details.reason, /Correction approved/);
});

test('rejects re-auction of sold players even with an exception reason', () => {
  const previous = {
    ...initialState,
    currentPlayer: null,
    soldPlayers: [{ playerId: 'player-1', teamId: 'teamA' }]
  };
  assert.throws(() => auditAuctionTransition(previous, {
    ...previous,
    currentPlayer: { id: 'player-1', name: 'Player One' }
  }, {
    actor: { adminId: 'owner', role: 'owner' },
    exceptionReason: 'Approved exception.'
  }), /sold player cannot be re-auctioned/);
});

test('records bid and administrative auction changes in a private audit log', () => {
  const actor = { adminId: 'admin-one', role: 'admin' };
  const withBid = appendAuctionBidAudit(
    applyAuctionBid(initialState, { teamId: 'teamA', teamName: 'Team A', increment: 100 }),
    actor,
    { teamId: 'teamA', teamName: 'Team A' },
    new Date('2026-11-07T00:01:00.000Z')
  );
  assert.equal(withBid.auditLog[0].action, 'BID_PLACED');
  assert.equal(withBid.auditLog[0].details.amount, 200);

  const previousPurseState = {
    ...initialState,
    teamPurseCaps: { teamA: 1000 },
    teamPurses: { teamA: 800 }
  };
  const changed = auditAuctionTransition(previousPurseState, {
    ...previousPurseState,
    teamPurseCaps: { teamA: 1200 },
    teamPurses: { teamA: 1000 }
  }, { actor });
  assert.equal(changed.auditLog[0].action, 'TEAM_PURSE_CHANGED');
  assert.equal(Object.hasOwn(publicAuctionState(changed), 'auditLog'), false);
});

test('accepts successive bids from different teams using the latest bid', () => {
  const firstBid = applyAuctionBid(initialState, {
    teamId: 'teamA',
    teamName: 'Team A',
    increment: 100
  }, new Date('2026-11-07T00:01:00.000Z'));
  const secondBid = applyAuctionBid(firstBid, {
    teamId: 'teamB',
    teamName: 'Team B',
    increment: 100
  }, new Date('2026-11-07T00:01:01.000Z'));

  assert.equal(firstBid.currentBid, 200);
  assert.equal(secondBid.currentBid, 300);
  assert.equal(secondBid.currentBiddingTeam, 'teamB');
  assert.deepEqual(secondBid.bidHistory.map((bid) => bid.team), ['Team B', 'Team A']);
  assert.equal(secondBid.version, 5);
  assert.equal(secondBid.currentPlayer.photo, undefined);
});

test('rejects a bid that exceeds the franchise purse', () => {
  assert.throws(() => applyAuctionBid(initialState, {
    teamId: 'teamB',
    teamName: 'Team B',
    increment: 500
  }), /not have enough purse/);
});

test('rejects bid increments below the configured season minimum', () => {
  assert.throws(() => applyAuctionBid(initialState, {
    teamId: 'teamA',
    teamName: 'Team A',
    increment: 50
  }), /minimum bid increment is ₹100/);
  assert.throws(() => applyAuctionBid({ ...initialState, minimumBidIncrement: 500 }, {
    teamId: 'teamA',
    teamName: 'Team A',
    increment: 100
  }), /minimum bid increment is ₹500/);
});

test('rejects a bid when the team has reached its configured squad limit', () => {
  const state = {
    ...initialState,
    maxSquadSize: 2,
    soldPlayers: [
      { playerId: 'player-1', teamId: 'teamA' },
      { playerId: 'player-2', teamId: 'teamA' }
    ]
  };
  assert.throws(() => applyAuctionBid(state, {
    teamId: 'teamA',
    teamName: 'Team A',
    increment: 100
  }), /reached the maximum squad size/);
});

test('returns a compact bid snapshot without the player image', () => {
  const nextState = applyAuctionBid(initialState, {
    teamId: 'teamA',
    teamName: 'Team A',
    increment: 100
  });
  const snapshot = auctionBidSnapshot(nextState);

  assert.equal(snapshot.currentBid, 200);
  assert.equal(snapshot.currentPlayerId, 'player-1');
  assert.equal(Object.hasOwn(snapshot, 'currentPlayer'), false);
  assert.equal(JSON.stringify(snapshot).includes('base64'), false);
});

test('moves a large embedded player image to a separate media URL during compacting and the next bid', () => {
  const photoUrl = '/api/media/auction-player-photo%3Aplayer-1?v=abc123';
  const compacted = compactAuctionState(initialState, photoUrl, new Date('2026-11-07T00:01:00.000Z'));
  const nextBid = applyAuctionBid(initialState, {
    teamId: 'teamA',
    teamName: 'Team A',
    increment: 100
  });

  assert.equal(compacted.currentPlayer.photo, photoUrl);
  assert.equal(compacted.version, initialState.version + 1);
  assert.equal(nextBid.currentPlayer.photo, undefined);
  assert.equal(JSON.stringify(nextBid).includes('base64'), false);
  assert.equal(JSON.stringify(compacted).includes('base64'), false);
});

test('calculates the decoded photo size used by the 250 KB upload limit', () => {
  assert.equal(auctionPhotoByteLength('AAAA'), 3);
  assert.equal(auctionPhotoByteLength('AAA='), 2);
  assert.equal(MAX_AUCTION_PHOTO_BYTES, 256000);
});

test('allows only auction player media URLs through the auction state photo filter', () => {
  assert.equal(isAuctionPlayerPhotoUrl('/api/media/auction-player-photo%3Aplayer-1?v=abc_123'), true);
  assert.equal(isAuctionPlayerPhotoUrl('/api/media/auction-player-photo%3Aplayer-1'), true);
  assert.equal(isAuctionPlayerPhotoUrl('/api/media/team-logo%3Ateam-1'), false);
  assert.equal(isAuctionPlayerPhotoUrl('https://example.com/photo.jpg'), false);
});

test('retries a bid after a concurrent team update using the new current bid', async () => {
  let state = initialState;
  let causedRace = false;
  const savedState = await commitAuctionBid({
    readState: async () => state,
    compareAndSet: async (nextState, expectedVersion) => {
      if (!causedRace) {
        causedRace = true;
        state = applyAuctionBid(state, {
          teamId: 'teamA',
          teamName: 'Team A',
          increment: 100
        });
        return null;
      }
      if (state.version !== expectedVersion) return null;
      state = nextState;
      return state;
    },
    bid: { teamId: 'teamB', teamName: 'Team B', increment: 100 }
  });

  assert.equal(savedState.currentBid, 300);
  assert.equal(savedState.currentBiddingTeam, 'teamB');
  assert.deepEqual(savedState.bidHistory.map((bid) => bid.team), ['Team B', 'Team A']);
});
