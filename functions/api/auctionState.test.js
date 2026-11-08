import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyAuctionBid,
  auctionBidSnapshot,
  auctionPhotoByteLength,
  commitAuctionBid,
  compactAuctionState,
  isAuctionPlayerPhotoUrl,
  MAX_AUCTION_PHOTO_BYTES
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
