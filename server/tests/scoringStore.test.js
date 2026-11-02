import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ScoringStore } from '../scoringStore.js';
import { EXTRA_TYPES, WICKET_TYPES } from '../cricketEngine.js';

test('ScoringStore Full Lifecycle: Match setup -> Innings 1 -> Innings 2 Chase -> Points Table & Leaderboard', async () => {
  const store = new ScoringStore(null); // Local JSON mode
  const seasonName = 'Test Season ' + Date.now();

  // 1. Create a Match
  const match = await store.createMatch({
    season: seasonName,
    matchNumber: 'TEST-01',
    tournamentPhase: 'GROUP STAGE',
    teamAId: 'team-alpha',
    teamBId: 'team-beta',
    teamAName: 'Team Alpha',
    teamBName: 'Team Beta',
    teamAShort: 'TAL',
    teamBShort: 'TBT',
    oversLimit: 5.0,
    oversPerBowler: 2,
    city: 'Narua',
    ground: 'Narua Stadium',
    matchDate: '2026-11-02',
    matchTime: '14:00',
    venue: 'Narua Stadium'
  }, { adminId: 'developer' });

  assert.ok(match.id, 'Match should have an ID');
  assert.equal(match.status, 'UPCOMING');

  // 2. Save Squads
  const squadAlpha = [
    { id: 'a1', name: 'Alpha Striker 1', isPlayingXi: true, isCaptain: true },
    { id: 'a2', name: 'Alpha Striker 2', isPlayingXi: true, isWicketkeeper: true },
    { id: 'a3', name: 'Alpha Batter 3', isPlayingXi: true }
  ];
  const squadBeta = [
    { id: 'b1', name: 'Beta Bowler 1', isPlayingXi: true, isCaptain: true },
    { id: 'b2', name: 'Beta Bowler 2', isPlayingXi: true },
    { id: 'b3', name: 'Beta Batter 1', isPlayingXi: true }
  ];
  await store.saveSquads(match.id, { teamA: squadAlpha, teamB: squadBeta });
  const fetchedSquads = await store.getSquads(match.id);
  assert.equal(fetchedSquads.teamA.length, 3);
  assert.equal(fetchedSquads.teamB.length, 3);

  // 3. Toss
  const tossUpdate = await store.recordToss(match.id, {
    tossWinnerId: 'team-alpha',
    tossDecision: 'BAT'
  });
  assert.equal(tossUpdate.status, 'TOSS');
  assert.equal(tossUpdate.currentBattingTeamId, 'team-alpha');
  assert.equal(tossUpdate.currentBowlingTeamId, 'team-beta');

  // 4. Start Innings 1
  const inn1Start = await store.startInnings(match.id, {
    inningsNumber: 1,
    striker: { id: 'a1', name: 'Alpha Striker 1' },
    nonStriker: { id: 'a2', name: 'Alpha Striker 2' },
    bowler: { id: 'b1', name: 'Beta Bowler 1' }
  });
  assert.equal(inn1Start.status, 'LIVE');
  assert.equal(inn1Start.currentInningsNumber, 1);

  // 5. Ball 1: 4 runs by Striker 1
  const b1 = await store.recordDelivery(match.id, {
    strikerId: 'a1',
    strikerName: 'Alpha Striker 1',
    nonStrikerId: 'a2',
    nonStrikerName: 'Alpha Striker 2',
    bowlerId: 'b1',
    bowlerName: 'Beta Bowler 1',
    batRuns: 4,
    isLegal: true,
    totalRuns: 4
  });
  assert.equal(b1.scoreState.totalRuns, 4);
  assert.equal(b1.scoreState.overs, '0.1');

  // 6. Ball 2: Wide (+1 extra)
  const b2 = await store.recordDelivery(match.id, {
    strikerId: 'a1',
    strikerName: 'Alpha Striker 1',
    nonStrikerId: 'a2',
    nonStrikerName: 'Alpha Striker 2',
    bowlerId: 'b1',
    bowlerName: 'Beta Bowler 1',
    batRuns: 0,
    extraRuns: 1,
    extraType: EXTRA_TYPES.WIDE,
    isLegal: false,
    totalRuns: 1
  });
  assert.equal(b2.scoreState.totalRuns, 5);
  assert.equal(b2.scoreState.overs, '0.1'); // Still 0.1 because wide is illegal

  // 7. Ball 3: Wicket (Bowled)
  const b3 = await store.recordDelivery(match.id, {
    strikerId: 'a1',
    strikerName: 'Alpha Striker 1',
    nonStrikerId: 'a2',
    nonStrikerName: 'Alpha Striker 2',
    bowlerId: 'b1',
    bowlerName: 'Beta Bowler 1',
    batRuns: 0,
    isLegal: true,
    isWicket: true,
    wicketType: WICKET_TYPES.BOWLED,
    dismissedPlayerId: 'a1',
    dismissedPlayerName: 'Alpha Striker 1'
  });
  assert.equal(b3.scoreState.wickets, 1);
  assert.equal(b3.scoreState.overs, '0.2');

  // 8. Test Undo (undoes wicket)
  const undone = await store.undoDelivery(match.id);
  assert.equal(undone.scoreState.wickets, 0);
  assert.equal(undone.scoreState.overs, '0.1');

  // 9. Re-deliver Ball 3 as 6 runs
  const b3New = await store.recordDelivery(match.id, {
    strikerId: 'a1',
    strikerName: 'Alpha Striker 1',
    nonStrikerId: 'a2',
    nonStrikerName: 'Alpha Striker 2',
    bowlerId: 'b1',
    bowlerName: 'Beta Bowler 1',
    batRuns: 6,
    isLegal: true,
    totalRuns: 6
  });
  assert.equal(b3New.scoreState.totalRuns, 11);
  assert.equal(b3New.scoreState.overs, '0.2');

  // 10. End Innings 1 manually
  await store.endInnings(match.id);
  const midMatch = await store.getMatchById(match.id);
  assert.equal(midMatch.status, 'INNINGS_BREAK');

  // 11. Start Innings 2 (Team Beta chasing 12 runs in 5 overs)
  await store.startInnings(match.id, {
    inningsNumber: 2,
    striker: { id: 'b3', name: 'Beta Batter 1' },
    nonStriker: { id: 'b2', name: 'Beta Bowler 2' },
    bowler: { id: 'a3', name: 'Alpha Batter 3' }
  });

  // Check scorecard before 2nd innings balls
  const sc1 = await store.getScorecard(match.id);
  assert.equal(sc1.liveSummary.target, 12);
  assert.equal(sc1.liveSummary.remainingRuns, 12);

  // Ball 1 of Chase: SIX!
  await store.recordDelivery(match.id, {
    strikerId: 'b3',
    strikerName: 'Beta Batter 1',
    nonStrikerId: 'b2',
    nonStrikerName: 'Beta Bowler 2',
    bowlerId: 'a3',
    bowlerName: 'Alpha Batter 3',
    batRuns: 6,
    isLegal: true,
    totalRuns: 6
  });

  // Ball 2 of Chase: SIX! (Total 12 runs, target 12 achieved!)
  const winningBall = await store.recordDelivery(match.id, {
    strikerId: 'b3',
    strikerName: 'Beta Batter 1',
    nonStrikerId: 'b2',
    nonStrikerName: 'Beta Bowler 2',
    bowlerId: 'a3',
    bowlerName: 'Alpha Batter 3',
    batRuns: 6,
    isLegal: true,
    totalRuns: 6
  });

  assert.equal(winningBall.matchStatus, 'COMPLETED');
  assert.ok(winningBall.result.includes('Team Beta won'));

  // 12. Points Table & NRR Verification
  const pointsTable = await store.getPointsTable(seasonName);
  assert.equal(pointsTable.length, 2);
  const winnerRow = pointsTable.find((r) => r.id === 'team-beta');
  const loserRow = pointsTable.find((r) => r.id === 'team-alpha');

  assert.equal(winnerRow.won, 1);
  assert.equal(winnerRow.points, 2);
  assert.ok(parseFloat(winnerRow.nrr) > 0, 'Winner NRR should be positive');
  assert.equal(loserRow.lost, 1);
  assert.equal(loserRow.points, 0);
  assert.ok(parseFloat(loserRow.nrr) < 0, 'Loser NRR should be negative');

  // 13. Tournament Leaderboard Verification
  const leaderboard = await store.getLeaderboard(seasonName);
  assert.ok(leaderboard.topBatters.length > 0, 'Should have top batters');
  assert.equal(leaderboard.topBatters[0].name, 'Beta Batter 1');
  assert.equal(leaderboard.topBatters[0].runs, 12);

  // Clean up test match
  await store.deleteMatch(match.id);
});
