import assert from 'node:assert/strict';
import test from 'node:test';
import { resetAuctionForSeason } from './auctionReset.js';

test('auction reset preserves registrations and restores auctioned players and season squads', () => {
  const registration = {
    id: 'player-1',
    season: 'Season 6',
    fullName: 'Player One',
    phone: '1234567890',
    status: 'AUCTIONED',
    auctionPreviousStatus: 'SHORTLISTED',
    soldTo: 'Team A',
    soldToTeamId: 'team-a',
    soldPrice: '₹1,000'
  };
  const unaffectedRegistration = { id: 'player-2', season: 'Season 5', status: 'UNSOLD' };
  const team = {
    id: 'team-a',
    sessions: ['Season 6'],
    squad: [
      { id: 'player-1', season: 'Season 6' },
      { id: 'historic-player', season: 'Season 5' }
    ]
  };
  const result = resetAuctionForSeason({
    state: {
      status: 'live',
      currentPlayer: null,
      soldPlayers: [{ playerId: 'player-1' }],
      unsoldPlayers: [],
      purseCap: 5000,
      minimumBidIncrement: 200,
      maxSquadSize: 10,
      teamPurseCaps: { 'team-a': 4000 },
      teamPurses: { 'team-a': 1000 },
      auditLog: [{ action: 'PLAYER_SOLD' }]
    },
    registrations: [registration, unaffectedRegistration],
    teams: [team],
    season: 'Season 6'
  });

  assert.deepEqual(result.registrations[0], {
    id: 'player-1',
    season: 'Season 6',
    fullName: 'Player One',
    phone: '1234567890',
    status: 'SHORTLISTED'
  });
  assert.equal(result.registrations[1], unaffectedRegistration);
  assert.deepEqual(result.teams[0].squad, [{ id: 'historic-player', season: 'Season 5' }]);
  assert.equal(result.auctionLiveState.status, 'waiting');
  assert.deepEqual(result.auctionLiveState.soldPlayers, []);
  assert.deepEqual(result.auctionLiveState.teamPurses, { 'team-a': 4000 });
  assert.equal(result.auctionLiveState.minimumBidIncrement, 200);
  assert.deepEqual(result.auctionLiveState.auditLog, [{ action: 'PLAYER_SOLD' }]);
});

test('auction reset returns an unsold or active player to the verified pool', () => {
  const result = resetAuctionForSeason({
    state: {
      currentPlayer: { id: 'player-1' },
      soldPlayers: [],
      unsoldPlayers: [{ playerId: 'player-2' }]
    },
    registrations: [
      { id: 'player-1', season: 'Season 6', status: 'UNSOLD', unsold: true },
      { id: 'player-2', season: 'Season 6', status: 'UNSOLD' }
    ],
    teams: [],
    season: 'Season 6'
  });

  assert.deepEqual(result.registrations.map(({ status, ...player }) => ({ ...player, status })), [
    { id: 'player-1', season: 'Season 6', status: 'VERIFIED' },
    { id: 'player-2', season: 'Season 6', status: 'VERIFIED' }
  ]);
  assert.equal(result.auctionLiveState.currentPlayer, null);
});
