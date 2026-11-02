import {
  calculateInningsState,
  calculateTournamentNetRunRate,
  EXTRA_TYPES,
  processDelivery,
  WICKET_TYPES
} from '../../server/cricketEngine.js';

const json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), {
  status,
  headers: {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    ...headers
  }
});

const errorResponse = (message, status) => json({ error: message }, status);
const matchIdPattern = /^[A-Za-z0-9._:-]{1,120}$/;
const extraTypes = new Set(Object.values(EXTRA_TYPES));
const wicketTypes = new Set(Object.values(WICKET_TYPES));
const database = (env) => env.DB;

const readRecord = async (env, id) => {
  const row = await database(env).prepare(
    'SELECT value FROM npl_live_scoring_matches WHERE match_id = ?'
  ).bind(id).first();
  return row ? { value: row.value, record: JSON.parse(row.value) } : null;
};

const saveRecord = async (env, id, record, previousValue) => {
  const value = JSON.stringify(record);
  const statement = previousValue === null
    ? database(env).prepare(
      'INSERT INTO npl_live_scoring_matches (match_id, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(match_id) DO NOTHING'
    ).bind(id, value)
    : database(env).prepare(
      'UPDATE npl_live_scoring_matches SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE match_id = ? AND value = ?'
    ).bind(value, id, previousValue);
  const result = await statement.run();
  if (!result.meta.changes) throw new Error('This match changed in another session. Refresh and try again.');
  return record;
};

const readBody = async (request) => {
  try {
    const body = await request.json();
    return body && typeof body === 'object' && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
};

const text = (value, fallback = '', maxLength = 200) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : fallback;

const player = (value, label) => {
  if (!value || typeof value !== 'object' ||
    typeof value.id !== 'string' || !value.id.trim() ||
    typeof value.name !== 'string' || !value.name.trim()) {
    throw new Error(`Select a valid ${label}.`);
  }
  return { id: value.id.trim().slice(0, 120), name: value.name.trim().slice(0, 120) };
};

const getInningsState = (match, innings, target = null) => calculateInningsState({
  maxOvers: match.oversLimit,
  target,
  openingStriker: innings?.openers?.striker,
  openingNonStriker: innings?.openers?.nonStriker,
  openingBowler: innings?.openers?.bowler,
  deliveries: innings?.deliveries || []
});

const getScorecard = (record) => {
  if (!record) return null;
  const { match, inningsByNumber } = record;
  const innings1 = inningsByNumber['1'] || { deliveries: [] };
  const innings2 = inningsByNumber['2'] || { deliveries: [] };
  const innings1State = getInningsState(match, innings1);
  const target = innings1State.totalRuns + 1;
  const innings2State = getInningsState(match, innings2, target);
  const firstBattingTeamId = innings1.battingTeamId ||
    (match.tossDecision === 'BAT'
      ? match.tossWinnerId
      : (match.tossWinnerId
        ? (match.tossWinnerId === match.teamAId ? match.teamBId : match.teamAId)
        : match.teamAId));
  const teamName = (id) => id === match.teamAId ? match.teamAName : match.teamBName;
  const innings = [
    { inningsNumber: 1, teamId: firstBattingTeamId, teamName: teamName(firstBattingTeamId), ...innings1State, deliveries: innings1.deliveries || [] },
    {
      inningsNumber: 2,
      teamId: innings2.battingTeamId || (firstBattingTeamId === match.teamAId ? match.teamBId : match.teamAId),
      teamName: teamName(innings2.battingTeamId || (firstBattingTeamId === match.teamAId ? match.teamBId : match.teamAId)),
      ...innings2State,
      deliveries: innings2.deliveries || []
    }
  ];
  const currentState = match.currentInningsNumber === 2 ? innings2State : innings1State;

  return {
    match,
    currentInningsNumber: match.currentInningsNumber || 1,
    liveSummary: {
      score: `${currentState.totalRuns}/${currentState.wickets}`,
      overs: currentState.overs,
      crr: currentState.currentRunRate,
      rrr: currentState.requiredRunRate,
      target: match.currentInningsNumber === 2 ? target : null,
      remainingRuns: currentState.remainingRuns,
      remainingBalls: currentState.remainingBalls,
      currentStriker: currentState.currentStriker,
      currentNonStriker: currentState.currentNonStriker,
      currentBowler: currentState.currentBowler,
      recentDeliveries: currentState.recentDeliveries,
      currentOverDeliveries: currentState.currentOverDeliveries
    },
    innings
  };
};

const matchFromBody = (body, id, user) => {
  const teamAId = text(body.teamAId || body.team1Id, '', 120);
  const teamBId = text(body.teamBId || body.team2Id, '', 120);
  const teamAName = text(body.teamAName || body.team1Name, '', 120);
  const teamBName = text(body.teamBName || body.team2Name, '', 120);
  const oversLimit = Number(body.oversLimit || 20);
  if (!teamAId || !teamBId || teamAId === teamBId || !teamAName || !teamBName) {
    throw new Error('Choose two different teams with names before creating the match.');
  }
  if (!Number.isFinite(oversLimit) || oversLimit < 1 || oversLimit > 50) {
    throw new Error('Overs must be between 1 and 50.');
  }
  const now = new Date().toISOString();
  return {
    match: {
      id,
      tournamentId: text(body.tournamentId, 'npl-tournament', 120),
      season: text(body.season, 'Season 5', 60),
      matchNumber: text(body.matchNumber, 'Match 1', 60),
      tournamentPhase: text(body.tournamentPhase, 'LEAGUE MATCH', 80),
      teamAId,
      teamBId,
      teamAName,
      teamBName,
      teamAShort: text(body.teamAShort || body.team1Short, 'TMA', 20),
      teamBShort: text(body.teamBShort || body.team2Short, 'TMB', 20),
      matchType: text(body.matchType, 'Limited Overs', 40),
      oversLimit,
      oversPerBowler: Number(body.oversPerBowler || Math.ceil(oversLimit / 5)),
      powerplayOvers: Number(body.powerplayOvers || 6),
      city: text(body.city, 'Jajpur', 80),
      ground: text(body.ground || body.venue, 'Narua Cricket Ground', 120),
      venue: text(body.venue || body.ground, 'Narua Cricket Ground', 120),
      matchDate: text(body.matchDate || body.date, now.slice(0, 10), 30),
      matchTime: text(body.matchTime || body.time, '10:00 AM', 30),
      tossWinnerId: null,
      tossDecision: null,
      assignedScorerId: text(body.assignedScorerId, '', 32) || null,
      status: 'UPCOMING',
      currentInningsNumber: 1,
      currentBattingTeamId: null,
      currentBowlingTeamId: null,
      result: null,
      winnerTeamId: null,
      winMargin: null,
      playerOfMatch: null,
      createdBy: user.admin_id,
      createdAt: now,
      updatedAt: now
    },
    squads: { teamA: [], teamB: [] },
    inningsByNumber: { '1': { openers: null, deliveries: [] }, '2': { openers: null, deliveries: [] } }
  };
};

const checkedRecord = async (env, id) => {
  const found = await readRecord(env, id);
  if (!found) return null;
  return found;
};

const updateRecord = async (env, found, change) => {
  change(found.record);
  found.record.match.updatedAt = new Date().toISOString();
  await saveRecord(env, found.record.match.id, found.record, found.value);
  return found.record;
};

const getAllMatches = async (env, url) => {
  const rows = await database(env).prepare(
    'SELECT value FROM npl_live_scoring_matches ORDER BY updated_at DESC'
  ).all();
  let matches = (rows.results || []).map((row) => JSON.parse(row.value).match);
  const season = url.searchParams.get('season');
  const status = url.searchParams.get('status');
  if (season) matches = matches.filter((match) => match.season === season);
  if (status) matches = matches.filter((match) => match.status === status);
  return { matches };
};

const normalizeSquads = (input, match) => {
  const result = { teamA: [], teamB: [] };
  for (const [key, teamId] of [['teamA', match.teamAId], ['teamB', match.teamBId]]) {
    const source = Array.isArray(input?.[key]) ? input[key] : [];
    if (source.length > 30) throw new Error('A match squad cannot contain more than 30 players.');
    const seen = new Set();
    result[key] = source.map((person) => {
      const selected = player(person, 'squad player');
      if (seen.has(selected.id)) throw new Error('A player can only appear once in a match squad.');
      seen.add(selected.id);
      return {
        ...selected,
        teamId,
        isPlayingXi: person.isPlayingXi !== false,
        isCaptain: Boolean(person.isCaptain),
        isWicketkeeper: Boolean(person.isWicketkeeper)
      };
    });
  }
  return result;
};

const getPointsTable = async (env, season) => {
  const { matches } = await getAllMatches(env, new URL(`https://npl.invalid/?season=${encodeURIComponent(season)}`));
  const standings = new Map();
  const getTeam = (id, name, shortName) => {
    if (!standings.has(id)) standings.set(id, {
      id, team: name, name, shortName: shortName || name.slice(0, 3).toUpperCase(),
      played: 0, won: 0, lost: 0, tied: 0, noResult: 0, points: 0,
      runsFor: 0, ballsFor: 0, runsAgainst: 0, ballsAgainst: 0, form: []
    });
    return standings.get(id);
  };
  for (const match of matches) {
    getTeam(match.teamAId, match.teamAName, match.teamAShort);
    getTeam(match.teamBId, match.teamBName, match.teamBShort);
    if (match.status !== 'COMPLETED') continue;
    const found = await readRecord(env, match.id);
    const card = getScorecard(found?.record);
    if (!card) continue;
    const first = card.innings[0];
    const second = card.innings[1];
    const teamA = getTeam(match.teamAId, match.teamAName, match.teamAShort);
    const teamB = getTeam(match.teamBId, match.teamBName, match.teamBShort);
    teamA.played += 1;
    teamB.played += 1;
    if (match.winnerTeamId === teamA.id) {
      teamA.won += 1; teamA.points += 2; teamA.form.push('W'); teamB.lost += 1; teamB.form.push('L');
    } else if (match.winnerTeamId === teamB.id) {
      teamB.won += 1; teamB.points += 2; teamB.form.push('W'); teamA.lost += 1; teamA.form.push('L');
    } else if (match.result?.toLowerCase().includes('tie')) {
      teamA.tied += 1; teamA.points += 1; teamA.form.push('T'); teamB.tied += 1; teamB.points += 1; teamB.form.push('T');
    } else {
      teamA.noResult += 1; teamA.points += 1; teamA.form.push('NR'); teamB.noResult += 1; teamB.points += 1; teamB.form.push('NR');
    }
    if (first) {
      const firstTeam = first.teamId === teamA.id ? teamA : teamB;
      const firstOpponent = firstTeam === teamA ? teamB : teamA;
      const quotaBalls = Math.round(Number(match.oversLimit || 20) * 6);
      const firstBalls = first.isAllOut ? quotaBalls : first.legalBalls;
      firstTeam.runsFor += first.totalRuns; firstTeam.ballsFor += firstBalls;
      firstOpponent.runsAgainst += first.totalRuns; firstOpponent.ballsAgainst += firstBalls;
      if (second && second.legalBalls > 0) {
        const secondBalls = second.isAllOut ? quotaBalls : second.legalBalls;
        firstOpponent.runsFor += second.totalRuns; firstOpponent.ballsFor += secondBalls;
        firstTeam.runsAgainst += second.totalRuns; firstTeam.ballsAgainst += secondBalls;
      }
    }
  }
  const rows = Array.from(standings.values()).map((team) => {
    const nrr = calculateTournamentNetRunRate({
      runsScored: team.runsFor,
      ballsFaced: team.ballsFor,
      runsConceded: team.runsAgainst,
      ballsBowled: team.ballsAgainst
    });
    return {
      id: team.id, team: team.name, name: team.name, shortName: team.shortName,
      played: team.played, won: team.won, lost: team.lost, tied: team.tied,
      noResult: team.noResult, points: team.points, nrr, netRunRate: nrr,
      for: `${team.runsFor}/${Math.floor(team.ballsFor / 6)}.${team.ballsFor % 6}`,
      against: `${team.runsAgainst}/${Math.floor(team.ballsAgainst / 6)}.${team.ballsAgainst % 6}`,
      form: team.form.slice(-5)
    };
  }).sort((a, b) => b.points - a.points || Number.parseFloat(b.nrr) - Number.parseFloat(a.nrr) || b.won - a.won);
  return rows.map((row, index) => ({ rank: index + 1, ...row }));
};

const getLeaderboard = async (env, season) => {
  const { matches } = await getAllMatches(env, new URL(`https://npl.invalid/?season=${encodeURIComponent(season)}`));
  const batters = new Map();
  const bowlers = new Map();
  for (const match of matches) {
    const found = await readRecord(env, match.id);
    const card = getScorecard(found?.record);
    for (const innings of card?.innings || []) {
      for (const item of innings.batting) {
        const current = batters.get(item.id) || {
          id: item.id, name: item.name, innings: 0, runs: 0, balls: 0,
          fours: 0, sixes: 0, notOuts: 0, highestScore: 0
        };
        current.innings += 1; current.runs += item.runs; current.balls += item.balls;
        current.fours += item.fours; current.sixes += item.sixes;
        if (!item.isOut) current.notOuts += 1;
        current.highestScore = Math.max(current.highestScore, item.runs);
        batters.set(item.id, current);
      }
      for (const item of innings.bowling) {
        const current = bowlers.get(item.id) || {
          id: item.id, name: item.name, innings: 0, legalBalls: 0,
          maidens: 0, runs: 0, wickets: 0, bestWickets: 0, bestRuns: 999
        };
        current.innings += 1; current.legalBalls += item.legalBalls;
        current.maidens += item.maidens; current.runs += item.runsConceded;
        current.wickets += item.wickets;
        if (item.wickets > current.bestWickets ||
          (item.wickets === current.bestWickets && item.runsConceded < current.bestRuns)) {
          current.bestWickets = item.wickets;
          current.bestRuns = item.runsConceded;
        }
        bowlers.set(item.id, current);
      }
    }
  }
  const topBatters = Array.from(batters.values()).map((item) => ({
    ...item,
    strikeRate: item.balls ? ((item.runs / item.balls) * 100).toFixed(1) : '0.0',
    average: item.innings > item.notOuts ? (item.runs / (item.innings - item.notOuts)).toFixed(1) : item.runs.toFixed(1)
  })).sort((a, b) => b.runs - a.runs).slice(0, 10);
  const topBowlers = Array.from(bowlers.values()).map((item) => ({
    ...item,
    overs: `${Math.floor(item.legalBalls / 6)}.${item.legalBalls % 6}`,
    economy: item.legalBalls ? ((item.runs / item.legalBalls) * 6).toFixed(2) : '0.00',
    average: item.wickets ? (item.runs / item.wickets).toFixed(1) : '0.0',
    bestFigures: `${item.bestWickets}/${item.bestRuns === 999 ? 0 : item.bestRuns}`
  })).sort((a, b) => b.wickets - a.wickets || a.runs - b.runs).slice(0, 10);
  return { topBatters, topBowlers };
};

const streamResponse = (request, env, id, initialCard) => {
  const encoder = new TextEncoder();
  let timer;
  let stopped = false;
  return new Response(new ReadableStream({
    start(controller) {
      let updatedAt = initialCard.match.updatedAt;
      const send = (name, value) => controller.enqueue(encoder.encode(
        `event: ${name}\ndata: ${JSON.stringify(value)}\n\n`
      ));
      send('score:initial', initialCard);
      const stop = () => {
        if (stopped) return;
        stopped = true;
        clearInterval(timer);
        try { controller.close(); } catch { /* The client already disconnected. */ }
      };
      request.signal.addEventListener('abort', stop, { once: true });
      timer = setInterval(async () => {
        if (stopped) return;
        try {
          const found = await readRecord(env, id);
          if (!found) {
            stop();
            return;
          }
          const card = getScorecard(found.record);
          if (card.match.updatedAt !== updatedAt) {
            updatedAt = card.match.updatedAt;
            send('score:initial', card);
          } else {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          }
        } catch (error) {
          console.error('Cloudflare live-score stream polling failed:', error);
          stop();
        }
      }, 2500);
    },
    cancel() {
      stopped = true;
      clearInterval(timer);
    }
  }), {
    headers: {
      'Cache-Control': 'no-cache, no-transform',
      'Content-Type': 'text/event-stream; charset=utf-8',
      'X-Accel-Buffering': 'no'
    }
  });
};

export const handleLiveScoringApi = async ({ request, env, url, path, method, user }) => {
  const matchesPath = path.match(/^\/api\/matches(?:\/([^/]+)(.*))?$/);
  const pointsPath = path.match(/^\/api\/tournaments\/([^/]+)\/(points-table|leaderboard)$/);
  if (!matchesPath && !pointsPath) return null;

  if (pointsPath && method === 'GET') {
    const season = decodeURIComponent(pointsPath[1]);
    if (!season || season.length > 60) return errorResponse('Choose a valid tournament season.', 400);
    if (pointsPath[2] === 'points-table') return json({ pointsTable: await getPointsTable(env, season) });
    return json(await getLeaderboard(env, season));
  }

  if (!matchesPath) return null;
  const id = matchesPath[1] ? decodeURIComponent(matchesPath[1]) : '';
  const tail = matchesPath[2] || '';
  if (id && !matchIdPattern.test(id)) return errorResponse('Match ID is invalid.', 400);

  if (!id && method === 'GET' && tail === '') return json(await getAllMatches(env, url));
  if (!id && method === 'POST' && tail === '') {
    if (!user) return errorResponse('Sign in required.', 401);
    const body = await readBody(request);
    if (!body) return errorResponse('Match details are invalid.', 400);
    const matchId = text(body.id, `match_${crypto.randomUUID()}`, 120);
    if (!matchIdPattern.test(matchId)) return errorResponse('Match ID is invalid.', 400);
    const existing = await readRecord(env, matchId);
    if (existing) return json({ match: existing.record.match });
    try {
      const record = matchFromBody(body, matchId, user);
      await saveRecord(env, matchId, record, null);
      return json({ match: record.match }, 201);
    } catch (error) {
      if (error.message.includes('changed in another session')) {
        const concurrent = await readRecord(env, matchId);
        if (concurrent) return json({ match: concurrent.record.match });
      }
      return errorResponse(error.message, 400);
    }
  }

  const found = id ? await checkedRecord(env, id) : null;
  if (id && method === 'GET' && tail === '') {
    return found ? json({ match: found.record.match }) : errorResponse('Match not found.', 404);
  }
  if (id && method === 'GET' && tail === '/scorecard') {
    const card = getScorecard(found?.record);
    return card ? json(card) : errorResponse('Match scorecard not found.', 404);
  }
  if (id && method === 'GET' && tail === '/stream') {
    const card = getScorecard(found?.record);
    return card ? streamResponse(request, env, id, card) : errorResponse('Match not found.', 404);
  }
  if (id && method === 'GET' && tail === '/squad') {
    return found ? json({ squads: found.record.squads }) : errorResponse('Match not found.', 404);
  }

  const mutation = method === 'POST' || method === 'PUT' || method === 'DELETE';
  if (id && mutation && !user) return errorResponse('Sign in required.', 401);
  if (!found && id && mutation) return errorResponse('Match not found.', 404);

  if (id && method === 'DELETE' && tail === '') {
    const result = await database(env).prepare(
      'DELETE FROM npl_live_scoring_matches WHERE match_id = ? AND value = ?'
    ).bind(id, found.value).run();
    if (!result.meta.changes) return errorResponse('This match changed in another session. Refresh and try again.', 409);
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  }

  if (id && method === 'PUT' && tail === '') {
    const body = await readBody(request);
    if (!body) return errorResponse('Match updates are invalid.', 400);
    const allowed = [
      'matchNumber', 'tournamentPhase', 'oversLimit', 'oversPerBowler', 'powerplayOvers',
      'city', 'ground', 'venue', 'matchDate', 'matchTime', 'assignedScorerId',
      'status', 'tossWinnerId', 'tossDecision', 'currentInningsNumber',
      'currentBattingTeamId', 'currentBowlingTeamId', 'result', 'winnerTeamId',
      'winMargin', 'playerOfMatch'
    ];
    try {
      const record = await updateRecord(env, found, (current) => {
        for (const key of allowed) if (body[key] !== undefined) current.match[key] = body[key];
      });
      return json({ match: record.match });
    } catch (error) {
      return errorResponse(error.message, 409);
    }
  }

  if (id && method === 'POST' && tail === '/assign-scorer') {
    const body = await readBody(request);
    if (!body) return errorResponse('Scorer assignment is invalid.', 400);
    try {
      const record = await updateRecord(env, found, (current) => {
        current.match.assignedScorerId = text(body.scorerId, '', 32) || null;
      });
      return json({ match: record.match });
    } catch (error) {
      return errorResponse(error.message, 409);
    }
  }

  if (id && method === 'POST' && tail === '/squad') {
    const body = await readBody(request);
    if (!body) return errorResponse('Squad details are invalid.', 400);
    try {
      const squads = normalizeSquads(body.squads || body, found.record.match);
      await updateRecord(env, found, (record) => { record.squads = squads; });
      return json({ success: true });
    } catch (error) {
      return errorResponse(error.message, 400);
    }
  }

  if (id && method === 'POST' && tail === '/toss') {
    const body = await readBody(request);
    if (!body || !['BAT', 'BOWL'].includes(body.tossDecision)) {
      return errorResponse('Choose the toss winner and whether they will bat or bowl.', 400);
    }
    const current = found.record.match;
    if (![current.teamAId, current.teamBId].includes(body.tossWinnerId)) {
      return errorResponse('The toss winner must be one of the two match teams.', 400);
    }
    const firstBattingId = body.tossDecision === 'BAT'
      ? body.tossWinnerId
      : body.tossWinnerId === current.teamAId ? current.teamBId : current.teamAId;
    try {
      const record = await updateRecord(env, found, (state) => {
        state.match.tossWinnerId = body.tossWinnerId;
        state.match.tossDecision = body.tossDecision;
        state.match.currentBattingTeamId = firstBattingId;
        state.match.currentBowlingTeamId = firstBattingId === current.teamAId ? current.teamBId : current.teamAId;
        state.match.status = 'TOSS';
      });
      return json({ match: record.match });
    } catch (error) {
      return errorResponse(error.message, 409);
    }
  }

  if (id && method === 'POST' && tail === '/start-innings') {
    const body = await readBody(request);
    const inningsNumber = Number(body?.inningsNumber || 1);
    if (![1, 2].includes(inningsNumber)) return errorResponse('Innings number must be 1 or 2.', 400);
    let openers;
    try {
      openers = {
        striker: player(body?.striker, 'striker'),
        nonStriker: player(body?.nonStriker, 'non-striker'),
        bowler: player(body?.bowler, 'bowler')
      };
    } catch (error) {
      return errorResponse(error.message, 400);
    }
    if (openers.striker.id === openers.nonStriker.id) {
      return errorResponse('Striker and non-striker must be different players.', 400);
    }
    try {
      const record = await updateRecord(env, found, (state) => {
        if (inningsNumber === 1 && !state.match.tossWinnerId) throw new Error('Record the toss before starting the first innings.');
        if (inningsNumber === 2 && state.match.status !== 'INNINGS_BREAK') throw new Error('The first innings must end before the second innings starts.');
        const battingTeamId = inningsNumber === 1
          ? state.match.currentBattingTeamId
          : state.match.currentBowlingTeamId;
        const bowlingTeamId = battingTeamId === state.match.teamAId
          ? state.match.teamBId
          : state.match.teamAId;
        state.inningsByNumber[String(inningsNumber)] = {
          openers,
          deliveries: state.inningsByNumber[String(inningsNumber)]?.deliveries || [],
          battingTeamId
        };
        state.match.currentInningsNumber = inningsNumber;
        state.match.currentBattingTeamId = battingTeamId;
        state.match.currentBowlingTeamId = bowlingTeamId;
        state.match.status = 'LIVE';
      });
      return json({ match: record.match });
    } catch (error) {
      return errorResponse(error.message, 400);
    }
  }

  if (id && method === 'POST' && tail === '/ball') {
    const body = await readBody(request);
    if (!body) return errorResponse('Delivery details are invalid.', 400);
    if (body.isWicket !== undefined && typeof body.isWicket !== 'boolean') {
      return errorResponse('Wicket status must be true or false.', 400);
    }
    const current = found.record.match;
    if (current.status !== 'LIVE') return errorResponse('The match is not live.', 409);
    const inningsNumber = current.currentInningsNumber || 1;
    const innings = found.record.inningsByNumber[String(inningsNumber)];
    if (!innings?.openers) return errorResponse('Start the innings before recording deliveries.', 409);
    const previousState = getInningsState(
      current,
      innings,
      inningsNumber === 2 ? getInningsState(current, found.record.inningsByNumber['1']).totalRuns + 1 : null
    );
    if (previousState.isInningsComplete) return errorResponse('This innings is already complete.', 409);
    const extraType = body.extraType || null;
    const wicketType = body.wicketType || null;
    if (extraType && !extraTypes.has(extraType)) return errorResponse('Choose a valid extra type.', 400);
    if (body.isWicket && !wicketTypes.has(wicketType)) return errorResponse('Choose a valid wicket type.', 400);
    const batRuns = Number(body.batRuns || 0);
    const extraRuns = Number(body.extraRuns || 0);
    if (!Number.isSafeInteger(batRuns) || batRuns < 0 || batRuns > 100 ||
      !Number.isSafeInteger(extraRuns) || extraRuns < 0 || extraRuns > 100) {
      return errorResponse('Runs must be whole numbers between 0 and 100.', 400);
    }
    const activeStriker = previousState.currentStriker;
    const activeNonStriker = previousState.currentNonStriker;
    const activeBowler = previousState.currentBowler;
    let striker;
    let nonStriker;
    let bowler;
    let processed;
    try {
      striker = player({
        id: body.strikerId || activeStriker.id,
        name: body.strikerName || activeStriker.name
      }, 'striker');
      nonStriker = player({
        id: body.nonStrikerId || activeNonStriker.id,
        name: body.nonStrikerName || activeNonStriker.name
      }, 'non-striker');
      bowler = player({
        id: body.bowlerId || activeBowler.id,
        name: body.bowlerName || activeBowler.name
      }, 'bowler');
    } catch (error) {
      return errorResponse(error.message, 400);
    }
    const squad = current.currentBattingTeamId === current.teamAId
      ? found.record.squads.teamA
      : found.record.squads.teamB;
    const incoming = squad.find((person) => person.id === (body.nextBatsmanId || body.incomingPlayerId));
    const currentActors = {
      ...previousState,
      deliveries: innings.deliveries,
      currentStriker: striker,
      currentNonStriker: nonStriker,
      currentBowler: bowler
    };
    try {
      processed = processDelivery(currentActors, {
        ...body,
        batRuns,
        extraRuns,
        extraType,
        isWicket: Boolean(body.isWicket),
        wicketType,
        incomingPlayerId: incoming?.id || body.incomingPlayerId || null,
        incomingPlayerName: incoming?.name || body.incomingPlayerName || null,
        commentary: text(body.commentary, '', 500)
      });
    } catch (error) {
      return errorResponse(error.message, 400);
    }
    const delivery = {
      ...processed.delivery,
      id: `del_${crypto.randomUUID()}`,
      commentary: text(body.commentary, processed.delivery.display, 500)
    };
    const nextDeliveries = [...innings.deliveries, delivery];
    const target = inningsNumber === 2
      ? getInningsState(current, found.record.inningsByNumber['1']).totalRuns + 1
      : null;
    const scoreState = getInningsState(current, { ...innings, deliveries: nextDeliveries }, target);
    let matchStatus = current.status;
    let result = current.result;
    let winnerTeamId = current.winnerTeamId;
    let winMargin = current.winMargin;
    if (scoreState.isInningsComplete && inningsNumber === 1) {
      matchStatus = 'INNINGS_BREAK';
    } else if (scoreState.isInningsComplete && inningsNumber === 2) {
      const battingTeamName = current.currentBattingTeamId === current.teamAId ? current.teamAName : current.teamBName;
      const bowlingTeamName = current.currentBowlingTeamId === current.teamAId ? current.teamAName : current.teamBName;
      if (scoreState.totalRuns >= target) {
        winnerTeamId = current.currentBattingTeamId;
        const wicketsRemaining = 10 - scoreState.wickets;
        winMargin = `${wicketsRemaining} wicket${wicketsRemaining === 1 ? '' : 's'}`;
        result = `${battingTeamName} won by ${winMargin}`;
      } else if (scoreState.totalRuns === target - 1) {
        result = 'Match Tied';
        winnerTeamId = null;
        winMargin = '';
      } else {
        winnerTeamId = current.currentBowlingTeamId;
        const runsDifference = target - 1 - scoreState.totalRuns;
        winMargin = `${runsDifference} run${runsDifference === 1 ? '' : 's'}`;
        result = `${bowlingTeamName} won by ${winMargin}`;
      }
      matchStatus = 'COMPLETED';
    }
    try {
      await updateRecord(env, found, (record) => {
        record.inningsByNumber[String(inningsNumber)].deliveries = nextDeliveries;
        record.match.status = matchStatus;
        record.match.result = result;
        record.match.winnerTeamId = winnerTeamId;
        record.match.winMargin = winMargin;
      });
    } catch (error) {
      return errorResponse(error.message, 409);
    }
    return json({ matchId: id, inningsNumber, delivery, scoreState, matchStatus, result });
  }

  if (id && method === 'POST' && tail === '/undo') {
    const inningsNumber = found.record.match.currentInningsNumber || 1;
    const innings = found.record.inningsByNumber[String(inningsNumber)];
    if (!innings?.deliveries.length) return errorResponse('No deliveries to undo in this innings.', 400);
    const undoneDelivery = innings.deliveries[innings.deliveries.length - 1];
    const deliveries = innings.deliveries.slice(0, -1);
    const target = inningsNumber === 2
      ? getInningsState(found.record.match, found.record.inningsByNumber['1']).totalRuns + 1
      : null;
    const scoreState = getInningsState(found.record.match, { ...innings, deliveries }, target);
    try {
      await updateRecord(env, found, (record) => {
        record.inningsByNumber[String(inningsNumber)].deliveries = deliveries;
        if (record.match.status === 'COMPLETED') {
          record.match.status = 'LIVE';
          record.match.result = null;
          record.match.winnerTeamId = null;
          record.match.winMargin = null;
        }
      });
    } catch (error) {
      return errorResponse(error.message, 409);
    }
    return json({ matchId: id, inningsNumber, undoneDelivery, scoreState, matchStatus: found.record.match.status });
  }

  if (id && method === 'POST' && tail === '/end-innings') {
    try {
      const record = await updateRecord(env, found, (state) => {
        state.match.status = 'INNINGS_BREAK';
        state.match.currentInningsNumber = 2;
      });
      return json({ match: record.match });
    } catch (error) {
      return errorResponse(error.message, 409);
    }
  }

  if (id && method === 'POST' && tail === '/end-match') {
    const body = await readBody(request) || {};
    try {
      const record = await updateRecord(env, found, (state) => {
        state.match.status = 'COMPLETED';
        state.match.result = text(body.result, state.match.result || '', 240);
        state.match.winnerTeamId = text(body.winnerTeamId, state.match.winnerTeamId || '', 120) || null;
        state.match.winMargin = text(body.winMargin, state.match.winMargin || '', 120);
        state.match.playerOfMatch = body.playerOfMatch || state.match.playerOfMatch;
      });
      return json({ match: record.match });
    } catch (error) {
      return errorResponse(error.message, 409);
    }
  }

  return null;
};
