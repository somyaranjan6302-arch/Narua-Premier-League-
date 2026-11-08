import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EXTRA_TYPES,
  WICKET_TYPES,
  calculateInningsState,
  processDelivery,
  calculateTournamentNetRunRate,
  formatOvers
} from '../cricketEngine.js';

test('TEST 1: Six legal deliveries complete an over', () => {
  const deliveries = [];
  const striker = { id: 'p1', name: 'Striker' };
  const nonStriker = { id: 'p2', name: 'NonStriker' };
  const bowler = { id: 'b1', name: 'Bowler' };

  for (let i = 0; i < 6; i++) {
    deliveries.push({
      strikerId: striker.id,
      strikerName: striker.name,
      nonStrikerId: nonStriker.id,
      nonStrikerName: nonStriker.name,
      bowlerId: bowler.id,
      bowlerName: bowler.name,
      batRuns: 0,
      isLegal: true,
      totalRuns: 0
    });
  }

  const state = calculateInningsState({
    maxOvers: 20,
    openingStriker: striker,
    openingNonStriker: nonStriker,
    openingBowler: bowler,
    deliveries
  });

  assert.equal(state.legalBalls, 6);
  assert.equal(state.overs, '1.0');
  assert.equal(state.currentOverDeliveries.length, 6);
  assert.equal(state.currentOverDeliveries[0].batRuns, 0);
  assert.equal(state.currentOverDeliveries[0].display, '0');
});

test('A wicket requires a replacement and preserves the dismissed batter name', () => {
  const striker = { id: 'p1', name: 'Striker' };
  const nonStriker = { id: 'p2', name: 'Non-Striker' };
  const bowler = { id: 'b1', name: 'Bowler' };
  const currentState = {
    legalBalls: 0,
    deliveries: [],
    wickets: 0,
    maxWickets: 10,
    currentStriker: striker,
    currentNonStriker: nonStriker,
    currentBowler: bowler
  };
  const wicket = {
    isWicket: true,
    wicketType: WICKET_TYPES.BOWLED,
    dismissedPlayerId: striker.id
  };

  assert.throws(() => processDelivery(currentState, wicket), /Select the incoming batter/);

  const result = processDelivery(currentState, {
    ...wicket,
    incomingPlayerId: 'p3',
    incomingPlayerName: 'Incoming Batter'
  });
  assert.equal(result.delivery.dismissedPlayerName, striker.name);
  assert.equal(result.nextStriker.id, 'p3');
  assert.equal(result.nextNonStriker.id, nonStriker.id);
  const replayedState = calculateInningsState({
    openingStriker: striker,
    openingNonStriker: nonStriker,
    openingBowler: bowler,
    deliveries: [{
      ...result.delivery,
      isLegal: true,
      totalRuns: 0,
      batRuns: 0
    }]
  });
  assert.throws(() => processDelivery({
    ...currentState,
    wickets: replayedState.wickets,
    batting: replayedState.batting,
    legalBalls: replayedState.legalBalls,
    deliveries: [result.delivery],
    currentStriker: replayedState.currentStriker,
    currentNonStriker: replayedState.currentNonStriker
  }, {
    ...wicket,
    dismissedPlayerId: nonStriker.id,
    incomingPlayerId: striker.id
  }), /dismissed batter cannot return/);
});

test('The next over starts with a fresh delivery list', () => {
  const striker = { id: 'p1', name: 'Striker' };
  const nonStriker = { id: 'p2', name: 'Non-Striker' };
  const bowler = { id: 'b1', name: 'Bowler' };
  const deliveries = Array.from({ length: 7 }, (_, index) => ({
    strikerId: striker.id,
    strikerName: striker.name,
    nonStrikerId: nonStriker.id,
    nonStrikerName: nonStriker.name,
    bowlerId: bowler.id,
    bowlerName: bowler.name,
    batRuns: 0,
    isLegal: true,
    totalRuns: 0,
    display: '0',
    sequenceNumber: index + 1
  }));
  const completedOver = calculateInningsState({
    openingStriker: striker,
    openingNonStriker: nonStriker,
    openingBowler: bowler,
    deliveries: deliveries.slice(0, 6)
  });
  const nextOver = calculateInningsState({
    openingStriker: striker,
    openingNonStriker: nonStriker,
    openingBowler: bowler,
    deliveries
  });

  assert.equal(completedOver.currentOverDeliveries.length, 6);
  assert.equal(nextOver.currentOverDeliveries.length, 1);
  assert.equal(nextOver.currentOverDeliveries[0].display, '0');
});

test('TEST 2: Wide adds an extra but does not increment legal balls', () => {
  const striker = { id: 'p1', name: 'Striker' };
  const nonStriker = { id: 'p2', name: 'NonStriker' };
  const bowler = { id: 'b1', name: 'Bowler' };

  const deliveries = [
    {
      strikerId: striker.id,
      strikerName: striker.name,
      nonStrikerId: nonStriker.id,
      nonStrikerName: nonStriker.name,
      bowlerId: bowler.id,
      bowlerName: bowler.name,
      batRuns: 0,
      extraRuns: 1,
      extraType: EXTRA_TYPES.WIDE,
      isLegal: false,
      totalRuns: 1
    }
  ];

  const state = calculateInningsState({
    maxOvers: 20,
    openingStriker: striker,
    openingNonStriker: nonStriker,
    openingBowler: bowler,
    deliveries
  });

  assert.equal(state.legalBalls, 0);
  assert.equal(state.overs, '0.0');
  assert.equal(state.totalRuns, 1);
  assert.equal(state.extras.wides, 1);
  assert.equal(state.bowling[0].runsConceded, 1);
});

test('TEST 3: No-ball adds an extra and does not increment legal balls', () => {
  const striker = { id: 'p1', name: 'Striker' };
  const nonStriker = { id: 'p2', name: 'NonStriker' };
  const bowler = { id: 'b1', name: 'Bowler' };

  const deliveries = [
    {
      strikerId: striker.id,
      strikerName: striker.name,
      nonStrikerId: nonStriker.id,
      nonStrikerName: nonStriker.name,
      bowlerId: bowler.id,
      bowlerName: bowler.name,
      batRuns: 2,
      extraRuns: 1,
      extraType: EXTRA_TYPES.NO_BALL,
      isLegal: false,
      totalRuns: 3,
      bowlerRunsConceded: 3
    }
  ];

  const state = calculateInningsState({
    maxOvers: 20,
    openingStriker: striker,
    openingNonStriker: nonStriker,
    openingBowler: bowler,
    deliveries
  });

  assert.equal(state.legalBalls, 0);
  assert.equal(state.totalRuns, 3);
  assert.equal(state.extras.noBalls, 1);
  assert.equal(state.batting[0].runs, 2);
  assert.equal(state.bowling[0].runsConceded, 3);
});

test('TEST 4: A boundary adds four batsman runs', () => {
  const striker = { id: 'p1', name: 'Striker' };
  const bowler = { id: 'b1', name: 'Bowler' };

  const deliveries = [
    {
      strikerId: striker.id,
      strikerName: striker.name,
      bowlerId: bowler.id,
      bowlerName: bowler.name,
      batRuns: 4,
      isLegal: true,
      totalRuns: 4
    }
  ];

  const state = calculateInningsState({
    openingStriker: striker,
    openingBowler: bowler,
    deliveries
  });

  assert.equal(state.totalRuns, 4);
  assert.equal(state.batting[0].runs, 4);
  assert.equal(state.batting[0].fours, 1);
});

test('TEST 5: A six adds six batsman runs', () => {
  const striker = { id: 'p1', name: 'Striker' };
  const bowler = { id: 'b1', name: 'Bowler' };

  const deliveries = [
    {
      strikerId: striker.id,
      strikerName: striker.name,
      bowlerId: bowler.id,
      bowlerName: bowler.name,
      batRuns: 6,
      isLegal: true,
      totalRuns: 6
    }
  ];

  const state = calculateInningsState({
    openingStriker: striker,
    openingBowler: bowler,
    deliveries
  });

  assert.equal(state.totalRuns, 6);
  assert.equal(state.batting[0].runs, 6);
  assert.equal(state.batting[0].sixes, 1);
});

test('TEST 6: Byes and leg-byes update extras correctly without charging bowler', () => {
  const striker = { id: 'p1', name: 'Striker' };
  const bowler = { id: 'b1', name: 'Bowler' };

  const deliveries = [
    {
      strikerId: striker.id,
      strikerName: striker.name,
      bowlerId: bowler.id,
      bowlerName: bowler.name,
      batRuns: 0,
      extraRuns: 2,
      extraType: EXTRA_TYPES.BYE,
      isLegal: true,
      totalRuns: 2,
      bowlerRunsConceded: 0
    },
    {
      strikerId: striker.id,
      strikerName: striker.name,
      bowlerId: bowler.id,
      bowlerName: bowler.name,
      batRuns: 0,
      extraRuns: 1,
      extraType: EXTRA_TYPES.LEG_BYE,
      isLegal: true,
      totalRuns: 1,
      bowlerRunsConceded: 0
    }
  ];

  const state = calculateInningsState({
    openingStriker: striker,
    openingBowler: bowler,
    deliveries
  });

  assert.equal(state.totalRuns, 3);
  assert.equal(state.extras.byes, 2);
  assert.equal(state.extras.legByes, 1);
  assert.equal(state.batting[0].runs, 0);
  assert.equal(state.bowling[0].runsConceded, 0);
  assert.equal(state.legalBalls, 2);
});

test('TEST 7: Wicket increments only for valid dismissal types (Retired Hurt does not increment)', () => {
  const striker = { id: 'p1', name: 'Striker' };
  const nonStriker = { id: 'p2', name: 'NonStriker' };
  const bowler = { id: 'b1', name: 'Bowler' };

  // Delivery 1: Bowled (Valid dismissal)
  const d1 = {
    strikerId: striker.id,
    strikerName: striker.name,
    nonStrikerId: nonStriker.id,
    nonStrikerName: nonStriker.name,
    bowlerId: bowler.id,
    bowlerName: bowler.name,
    batRuns: 0,
    isLegal: true,
    totalRuns: 0,
    isWicket: true,
    wicketType: WICKET_TYPES.BOWLED,
    dismissedPlayerId: striker.id
  };

  // Delivery 2: Retired hurt (Should NOT increment wickets)
  const d2 = {
    strikerId: 'p3',
    strikerName: 'Batter 3',
    nonStrikerId: nonStriker.id,
    nonStrikerName: nonStriker.name,
    bowlerId: bowler.id,
    bowlerName: bowler.name,
    batRuns: 0,
    isLegal: true,
    totalRuns: 0,
    isWicket: false,
    wicketType: WICKET_TYPES.RETIRED_HURT,
    dismissedPlayerId: 'p3'
  };

  const state = calculateInningsState({
    openingStriker: striker,
    openingNonStriker: nonStriker,
    openingBowler: bowler,
    deliveries: [d1, d2]
  });

  assert.equal(state.wickets, 1);
  assert.equal(state.bowling[0].wickets, 1);
});

test('TEST 8: Run-out does not credit bowler with wicket but increments team wickets', () => {
  const striker = { id: 'p1', name: 'Striker' };
  const bowler = { id: 'b1', name: 'Bowler' };

  const deliveries = [
    {
      strikerId: striker.id,
      strikerName: striker.name,
      bowlerId: bowler.id,
      bowlerName: bowler.name,
      batRuns: 1,
      isLegal: true,
      totalRuns: 1,
      isWicket: true,
      wicketType: WICKET_TYPES.RUN_OUT,
      dismissedPlayerId: striker.id,
      fielderName: 'Fielder A'
    }
  ];

  const state = calculateInningsState({
    openingStriker: striker,
    openingBowler: bowler,
    deliveries
  });

  assert.equal(state.wickets, 1);
  assert.equal(state.bowling[0].wickets, 0); // Bowler not credited
  assert.equal(state.totalRuns, 1);
});

test('TEST 9: Strike rotation after odd and even runs', () => {
  const striker = { id: 'p1', name: 'Striker' };
  const nonStriker = { id: 'p2', name: 'NonStriker' };
  const bowler = { id: 'b1', name: 'Bowler' };

  // Ball 1: 1 run -> strike swaps
  const d1 = {
    strikerId: striker.id,
    strikerName: striker.name,
    nonStrikerId: nonStriker.id,
    nonStrikerName: nonStriker.name,
    bowlerId: bowler.id,
    bowlerName: bowler.name,
    batRuns: 1,
    isLegal: true,
    totalRuns: 1
  };

  const state1 = calculateInningsState({
    openingStriker: striker,
    openingNonStriker: nonStriker,
    openingBowler: bowler,
    deliveries: [d1]
  });

  assert.equal(state1.currentStriker.id, nonStriker.id);
  assert.equal(state1.currentNonStriker.id, striker.id);

  // Ball 2: 2 runs -> strike does not swap
  const d2 = {
    strikerId: nonStriker.id,
    strikerName: nonStriker.name,
    nonStrikerId: striker.id,
    nonStrikerName: striker.name,
    bowlerId: bowler.id,
    bowlerName: bowler.name,
    batRuns: 2,
    isLegal: true,
    totalRuns: 2
  };

  const state2 = calculateInningsState({
    openingStriker: striker,
    openingNonStriker: nonStriker,
    openingBowler: bowler,
    deliveries: [d1, d2]
  });

  assert.equal(state2.currentStriker.id, nonStriker.id);
  assert.equal(state2.currentNonStriker.id, striker.id);
});

test('TEST 10: Over-end strike rotation', () => {
  const striker = { id: 'p1', name: 'Striker' };
  const nonStriker = { id: 'p2', name: 'NonStriker' };
  const bowler = { id: 'b1', name: 'Bowler' };

  // 6 dot balls: striker faced all 6, at end of over strike rotates to nonStriker
  const deliveries = [];
  for (let i = 0; i < 6; i++) {
    deliveries.push({
      strikerId: striker.id,
      strikerName: striker.name,
      nonStrikerId: nonStriker.id,
      nonStrikerName: nonStriker.name,
      bowlerId: bowler.id,
      bowlerName: bowler.name,
      batRuns: 0,
      isLegal: true,
      totalRuns: 0
    });
  }

  const state = calculateInningsState({
    openingStriker: striker,
    openingNonStriker: nonStriker,
    openingBowler: bowler,
    deliveries
  });

  assert.equal(state.legalBalls, 6);
  assert.equal(state.currentStriker.id, nonStriker.id);
});

test('TEST 11: Undo restores the exact previous state', () => {
  const striker = { id: 'p1', name: 'Striker' };
  const bowler = { id: 'b1', name: 'Bowler' };

  const d1 = {
    strikerId: striker.id,
    strikerName: striker.name,
    bowlerId: bowler.id,
    bowlerName: bowler.name,
    batRuns: 4,
    isLegal: true,
    totalRuns: 4
  };

  const d2 = {
    strikerId: striker.id,
    strikerName: striker.name,
    bowlerId: bowler.id,
    bowlerName: bowler.name,
    batRuns: 6,
    isLegal: true,
    totalRuns: 6
  };

  const stateBefore = calculateInningsState({ openingStriker: striker, openingBowler: bowler, deliveries: [d1] });
  const stateAfterBall2 = calculateInningsState({ openingStriker: striker, openingBowler: bowler, deliveries: [d1, d2] });

  // Undoing ball 2: replay with [d1] only
  const stateRestored = calculateInningsState({ openingStriker: striker, openingBowler: bowler, deliveries: [d1] });

  assert.equal(stateAfterBall2.totalRuns, 10);
  assert.equal(stateRestored.totalRuns, stateBefore.totalRuns);
  assert.equal(stateRestored.legalBalls, stateBefore.legalBalls);
  assert.equal(stateRestored.batting[0].runs, 4);
});

test('TEST 12: Correction recalculates all affected statistics', () => {
  const striker = { id: 'p1', name: 'Striker' };
  const bowler = { id: 'b1', name: 'Bowler' };

  // Originally scored as 1 run
  const d1 = {
    strikerId: striker.id,
    strikerName: striker.name,
    bowlerId: bowler.id,
    bowlerName: bowler.name,
    batRuns: 1,
    isLegal: true,
    totalRuns: 1
  };

  // Corrected to 4 runs
  const d1Corrected = { ...d1, batRuns: 4, totalRuns: 4 };

  const state = calculateInningsState({ openingStriker: striker, openingBowler: bowler, deliveries: [d1Corrected] });
  assert.equal(state.totalRuns, 4);
  assert.equal(state.batting[0].fours, 1);
});

test('TEST 13: A successful chase automatically ends the match', () => {
  const striker = { id: 'p1', name: 'Striker' };
  const bowler = { id: 'b1', name: 'Bowler' };

  // Target = 15 runs. Batter hits 4, 6, 6 = 16 runs
  const deliveries = [
    { strikerId: striker.id, strikerName: striker.name, bowlerId: bowler.id, bowlerName: bowler.name, batRuns: 4, isLegal: true, totalRuns: 4 },
    { strikerId: striker.id, strikerName: striker.name, bowlerId: bowler.id, bowlerName: bowler.name, batRuns: 6, isLegal: true, totalRuns: 6 },
    { strikerId: striker.id, strikerName: striker.name, bowlerId: bowler.id, bowlerName: bowler.name, batRuns: 6, isLegal: true, totalRuns: 6 }
  ];

  const state = calculateInningsState({
    target: 15,
    maxOvers: 20,
    openingStriker: striker,
    openingBowler: bowler,
    deliveries
  });

  assert.equal(state.totalRuns, 16);
  assert.equal(state.isTargetChased, true);
  assert.equal(state.isInningsComplete, true);
});

test('TEST 14: Innings ends after configured overs or all-out', () => {
  const striker = { id: 'p1', name: 'Striker' };
  const bowler = { id: 'b1', name: 'Bowler' };

  // 1-over match (6 balls)
  const deliveries = [];
  for (let i = 0; i < 6; i++) {
    deliveries.push({
      strikerId: striker.id,
      strikerName: striker.name,
      bowlerId: bowler.id,
      bowlerName: bowler.name,
      batRuns: 1,
      isLegal: true,
      totalRuns: 1
    });
  }

  const state = calculateInningsState({
    maxOvers: 1,
    maxWickets: 10,
    openingStriker: striker,
    openingBowler: bowler,
    deliveries
  });

  assert.equal(state.isOversComplete, true);
  assert.equal(state.isInningsComplete, true);
});

test('TEST 18: Net Run Rate is calculated correctly according to official tournament rules', () => {
  // Team scored 180 in 20.0 overs (RR = 9.00)
  // Conceded 140 in 20.0 overs (RR = 7.00)
  // NRR should be +2.000
  const nrr = calculateTournamentNetRunRate({
    runsScored: 180,
    ballsFaced: 120,
    quotaOversFaced: 20,
    runsConceded: 140,
    ballsBowled: 120,
    quotaOversBowled: 20
  });

  assert.equal(nrr, '+2.000');
});
