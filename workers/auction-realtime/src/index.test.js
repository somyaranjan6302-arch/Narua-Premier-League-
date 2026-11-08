import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AuctionRoom } from './index.js';

const createSocket = (channel, season) => ({
  messages: [],
  deserializeAttachment: () => ({ channel, season }),
  send(message) {
    this.messages.push(JSON.parse(message));
  },
  close() {}
});

const scoringUpdate = () => ({
  type: 'scoring-update',
  season: 'Season 6',
  match: { id: 'match-1', season: 'Season 6' },
  scorecard: { match: { id: 'match-1' }, innings: [] }
});

test('broadcasts a scoring update only to scoring subscribers in that season', async () => {
  const scoringSocket = createSocket('scoring-match', 'Season 6');
  scoringSocket.deserializeAttachment = () => ({
    channel: 'scoring-match',
    season: 'Season 6',
    matchId: 'match-1'
  });
  const auctionSocket = createSocket('auction', 'Season 6');
  const otherSeasonSocket = createSocket('scoring', 'Season 5');
  const otherMatchSocket = createSocket('scoring-match', 'Season 6');
  otherMatchSocket.deserializeAttachment = () => ({
    channel: 'scoring-match',
    season: 'Season 6',
    matchId: 'match-2'
  });
  const room = new AuctionRoom({
    getWebSockets: () => [scoringSocket, auctionSocket, otherSeasonSocket, otherMatchSocket]
  }, {});

  const response = await room.fetch(new Request('https://room/publish', {
    method: 'POST',
    body: JSON.stringify(scoringUpdate())
  }));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { delivered: 1 });
  assert.equal(scoringSocket.messages[0].type, 'scoring-update');
  assert.deepEqual(auctionSocket.messages, []);
  assert.deepEqual(otherSeasonSocket.messages, []);
  assert.deepEqual(otherMatchSocket.messages, []);
});

test('broadcasts lightweight score summaries only to season scoring subscribers', async () => {
  const scoringSocket = createSocket('scoring', 'Season 6');
  const matchSocket = createSocket('scoring-match', 'Season 6');
  const room = new AuctionRoom({
    getWebSockets: () => [scoringSocket, matchSocket]
  }, {});
  const response = await room.fetch(new Request('https://room/publish', {
    method: 'POST',
    body: JSON.stringify({
      type: 'scoring-summary',
      season: 'Season 6',
      match: { id: 'match-1', season: 'Season 6' },
      scorecard: {
        currentInningsNumber: 2,
        liveSummary: {
          target: 143,
          remainingRuns: 48,
          remainingBalls: 34,
          rrr: '8.47'
        },
        innings: [
          { teamId: 'team-a', totalRuns: 142, wickets: 5, overs: '20.0' },
          { teamId: 'team-b', totalRuns: 95, wickets: 3, overs: '14.2' }
        ]
      }
    })
  }));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { delivered: 1 });
  assert.equal(scoringSocket.messages[0].type, 'scoring-summary');
  assert.deepEqual(scoringSocket.messages[0].scorecard.innings, [
    { teamId: 'team-a', totalRuns: 142, wickets: 5, overs: '20.0' },
    { teamId: 'team-b', totalRuns: 95, wickets: 3, overs: '14.2' }
  ]);
  assert.deepEqual(scoringSocket.messages[0].scorecard.liveSummary, {
    target: 143,
    remainingRuns: 48,
    remainingBalls: 34,
    rrr: '8.47'
  });
  assert.deepEqual(matchSocket.messages, []);
});

test('rejects incomplete scoring updates without broadcasting them', async () => {
  const socket = createSocket('scoring', 'Season 6');
  const room = new AuctionRoom({ getWebSockets: () => [socket] }, {});
  const payload = scoringUpdate();
  payload.scorecard.match.id = 'different-match';

  const response = await room.fetch(new Request('https://room/publish', {
    method: 'POST',
    body: JSON.stringify(payload)
  }));

  assert.equal(response.status, 400);
  assert.deepEqual(socket.messages, []);
});
