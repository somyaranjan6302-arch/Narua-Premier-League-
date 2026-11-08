/**
 * NARUA PREMIER LEAGUE (NPL) - LIVE SCORING STORE & EVENT BROADCASTER
 * 
 * Provides unified persistence layer with:
 * 1. Safe PostgreSQL transactional persistence when DATABASE_URL is configured
 * 2. High-performance JSON persistence in server/data/ when running in local dev
 * 3. Real-time event broadcasting (SSE) for zero-latency live score streaming
 * 4. Idempotency and concurrency safety against duplicate delivery submissions
 */

import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import {
  calculateInningsState,
  processDelivery,
  calculateTournamentNetRunRate,
  WICKET_TYPES,
  TEAM_WICKET_TYPES,
  EXTRA_TYPES
} from './cricketEngine.js';

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.join(serverDirectory, 'data');
const matchesFile = path.join(dataDirectory, 'live-matches.json');
const deliveriesFile = path.join(dataDirectory, 'live-deliveries.json');
const squadsFile = path.join(dataDirectory, 'live-squads.json');
const getFirstBattingTeamId = (match) => match.tossDecision === 'BAT'
  ? match.tossWinnerId
  : (match.tossWinnerId === match.teamAId ? match.teamBId : match.teamAId);
const maxWicketsForTeam = (match, squads, teamId) => {
  const teamSquad = teamId === match.teamAId ? squads.teamA : squads.teamB;
  const playingCount = (teamSquad || []).filter((person) => person.isPlayingXi !== false).length;
  return playingCount > 1 ? playingCount - 1 : 10;
};

// In-memory real-time SSE listeners: matchId -> Set of response callbacks
const matchListeners = new Map();

// Concurrency mutex lock per match
const matchLocks = new Map();

const acquireLock = async (matchId) => {
  while (matchLocks.has(matchId)) {
    await matchLocks.get(matchId);
  }
  let unlock;
  const promise = new Promise((resolve) => { unlock = resolve; });
  matchLocks.set(matchId, promise);
  return () => {
    matchLocks.delete(matchId);
    unlock();
  };
};

const readJson = async (filePath, fallback) => {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
};

const writeJson = async (filePath, value) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

/**
 * Register SSE client for a match
 */
export const registerMatchListener = (matchId, clientRes) => {
  if (!matchListeners.has(matchId)) {
    matchListeners.set(matchId, new Set());
  }
  const set = matchListeners.get(matchId);
  set.add(clientRes);

  return () => {
    set.delete(clientRes);
    if (set.size === 0) matchListeners.delete(matchId);
  };
};

/**
 * Broadcast event to all clients watching this match
 */
export const broadcastMatchUpdate = (matchId, eventName, payload) => {
  const set = matchListeners.get(matchId);
  if (!set || set.size === 0) return;
  const eventPayload = eventName === 'match:updated' && payload && typeof payload === 'object'
    ? {
      ...payload,
      umpires: (payload.umpires || []).map(({ name }) => ({ name })),
      secondaryScorers: (payload.secondaryScorers || []).map(({ name }) => ({ name }))
    }
    : payload;
  const data = `event: ${eventName}\ndata: ${JSON.stringify(eventPayload)}\n\n`;
  for (const client of set) {
    try {
      client.write(data);
    } catch {
      set.delete(client);
    }
  }
};

/**
 * Live Scoring Store Class
 */
export class ScoringStore {
  constructor(databasePool = null) {
    this.database = databasePool;
  }

  async initSchema() {
    if (this.database) {
      try {
        await this.database.query(`
          -- Ensure scorer role is allowed
          DO $$
          BEGIN
            IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'npl_admin_users_role_check') THEN
              ALTER TABLE public.npl_admin_users DROP CONSTRAINT npl_admin_users_role_check;
            END IF;
            ALTER TABLE public.npl_admin_users ADD CONSTRAINT npl_admin_users_role_check CHECK (role IN ('owner', 'admin', 'scorer'));
          EXCEPTION WHEN OTHERS THEN NULL;
          END $$;

          CREATE TABLE IF NOT EXISTS public.npl_matches (
            id TEXT PRIMARY KEY,
            tournament_id TEXT,
            season TEXT NOT NULL,
            match_number TEXT NOT NULL,
            tournament_phase TEXT NOT NULL DEFAULT 'LEAGUE MATCH',
            team_a_id TEXT NOT NULL,
            team_b_id TEXT NOT NULL,
            team_a_name TEXT NOT NULL,
            team_b_name TEXT NOT NULL,
            team_a_short TEXT,
            team_b_short TEXT,
            match_type TEXT NOT NULL DEFAULT 'Limited Overs',
            overs_limit NUMERIC(4,1) NOT NULL DEFAULT 20.0,
            overs_per_bowler INTEGER NOT NULL DEFAULT 4,
            powerplay_overs INTEGER DEFAULT 6,
            city TEXT NOT NULL DEFAULT 'Jajpur',
            ground TEXT NOT NULL DEFAULT 'Narua Cricket Ground',
            match_date TEXT NOT NULL,
            match_time TEXT NOT NULL,
            venue TEXT NOT NULL DEFAULT 'Narua Cricket Ground',
            ball_type TEXT NOT NULL DEFAULT 'Tennis',
            pitch_type TEXT NOT NULL DEFAULT 'Matting',
            umpires JSONB NOT NULL DEFAULT '[]'::jsonb,
            secondary_scorers JSONB NOT NULL DEFAULT '[]'::jsonb,
            toss_winner_id TEXT,
            toss_decision TEXT,
            assigned_scorer_id TEXT,
            status TEXT NOT NULL DEFAULT 'UPCOMING',
            current_innings_number INTEGER DEFAULT 1,
            current_batting_team_id TEXT,
            current_bowling_team_id TEXT,
            current_players JSONB,
            result TEXT,
            winner_team_id TEXT,
            win_margin TEXT,
            player_of_match JSONB,
            created_by TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          ALTER TABLE public.npl_matches
            ADD COLUMN IF NOT EXISTS ball_type TEXT NOT NULL DEFAULT 'Tennis',
            ADD COLUMN IF NOT EXISTS pitch_type TEXT NOT NULL DEFAULT 'Matting',
            ADD COLUMN IF NOT EXISTS umpires JSONB NOT NULL DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS secondary_scorers JSONB NOT NULL DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS current_players JSONB;

          CREATE TABLE IF NOT EXISTS public.npl_match_squads (
            id TEXT PRIMARY KEY,
            match_id TEXT NOT NULL REFERENCES public.npl_matches(id) ON DELETE CASCADE,
            team_id TEXT NOT NULL,
            player_id TEXT NOT NULL,
            player_name TEXT NOT NULL,
            is_playing_xi BOOLEAN NOT NULL DEFAULT TRUE,
            is_captain BOOLEAN NOT NULL DEFAULT FALSE,
            is_wicketkeeper BOOLEAN NOT NULL DEFAULT FALSE,
            batting_order INTEGER,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_match_player UNIQUE (match_id, player_id)
          );

          CREATE TABLE IF NOT EXISTS public.npl_innings (
            id TEXT PRIMARY KEY,
            match_id TEXT NOT NULL REFERENCES public.npl_matches(id) ON DELETE CASCADE,
            innings_number INTEGER NOT NULL,
            batting_team_id TEXT NOT NULL,
            bowling_team_id TEXT NOT NULL,
            total_runs INTEGER NOT NULL DEFAULT 0,
            wickets INTEGER NOT NULL DEFAULT 0,
            legal_balls INTEGER NOT NULL DEFAULT 0,
            overs_limit NUMERIC(4,1) NOT NULL DEFAULT 20.0,
            target_runs INTEGER,
            status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
            current_striker_id TEXT,
            current_non_striker_id TEXT,
            current_bowler_id TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_match_innings UNIQUE (match_id, innings_number)
          );

          CREATE TABLE IF NOT EXISTS public.npl_deliveries (
            id TEXT PRIMARY KEY,
            match_id TEXT NOT NULL REFERENCES public.npl_matches(id) ON DELETE CASCADE,
            innings_id TEXT NOT NULL,
            sequence_number INTEGER NOT NULL,
            over_number INTEGER NOT NULL,
            ball_number INTEGER NOT NULL,
            striker_id TEXT NOT NULL,
            striker_name TEXT NOT NULL,
            non_striker_id TEXT NOT NULL,
            non_striker_name TEXT NOT NULL,
            bowler_id TEXT NOT NULL,
            bowler_name TEXT NOT NULL,
            bat_runs INTEGER NOT NULL DEFAULT 0,
            extra_runs INTEGER NOT NULL DEFAULT 0,
            extra_type TEXT,
            total_runs INTEGER NOT NULL DEFAULT 0,
            is_legal BOOLEAN NOT NULL DEFAULT TRUE,
            is_wicket BOOLEAN NOT NULL DEFAULT FALSE,
            wicket_type TEXT,
            dismissed_player_id TEXT,
            dismissed_player_name TEXT,
            fielder_id TEXT,
            fielder_name TEXT,
            score_after_ball TEXT,
            commentary TEXT,
            created_by TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);
      } catch (err) {
        console.error('Warning: could not execute postgres scoring schema auto-migration:', err.message);
      }
    }
  }

  async getAllMatches({ season, status } = {}) {
    if (this.database) {
      let query = 'SELECT * FROM npl_matches WHERE 1=1';
      const params = [];
      if (season) {
        params.push(season);
        query += ` AND season = $${params.length}`;
      }
      if (status) {
        params.push(status);
        query += ` AND status = $${params.length}`;
      }
      query += ' ORDER BY created_at DESC';
      const res = await this.database.query(query, params);
      return res.rows.map(this.mapMatchRow);
    }

    const matches = await readJson(matchesFile, []);
    return matches
      .filter((m) => (!season || m.season === season) && (!status || m.status === status))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async getMatchById(matchId) {
    if (this.database) {
      const res = await this.database.query('SELECT * FROM npl_matches WHERE id = $1', [matchId]);
      if (!res.rows[0]) return null;
      return this.mapMatchRow(res.rows[0]);
    }
    const matches = await readJson(matchesFile, []);
    return matches.find((m) => m.id === matchId) || null;
  }

  async createMatch(matchData, user) {
    const id = `match_${Date.now()}_${randomBytes(4).toString('hex')}`;
    const oversLimit = Number(matchData.oversLimit || 20);
    const oversPerBowler = Number(matchData.oversPerBowler || Math.ceil(oversLimit / 5));
    if (!Number.isFinite(oversLimit) || oversLimit < 1 || oversLimit > 50 ||
      !Number.isInteger(oversPerBowler) || oversPerBowler < 1 || oversPerBowler > oversLimit) {
      throw new Error('Match overs must be 1–50, and each bowler quota must be a whole number within the match length.');
    }
    const newMatch = {
      id,
      tournamentId: matchData.tournamentId || 'npl-tournament',
      season: matchData.season || 'Season 5',
      matchNumber: matchData.matchNumber || 'Match 1',
      tournamentPhase: matchData.tournamentPhase || 'LEAGUE MATCH',
      teamAId: matchData.teamAId || matchData.team1Id,
      teamBId: matchData.teamBId || matchData.team2Id,
      teamAName: matchData.teamAName || matchData.team1Name || 'Team A',
      teamBName: matchData.teamBName || matchData.team2Name || 'Team B',
      teamAShort: matchData.teamAShort || matchData.team1Short || 'TMA',
      teamBShort: matchData.teamBShort || matchData.team2Short || 'TMB',
      matchType: matchData.matchType || 'Limited Overs',
      oversLimit,
      oversPerBowler,
      powerplayOvers: Number(matchData.powerplayOvers || 6),
      city: matchData.city || 'Jajpur',
      ground: matchData.ground || 'Narua Cricket Ground',
      venue: matchData.venue || matchData.ground || 'Narua Cricket Ground',
      ballType: matchData.ballType || 'Tennis',
      pitchType: matchData.pitchType || 'Matting',
      umpires: Array.isArray(matchData.umpires) ? matchData.umpires : [],
      secondaryScorers: Array.isArray(matchData.secondaryScorers) ? matchData.secondaryScorers : [],
      matchDate: matchData.matchDate || matchData.date || new Date().toISOString().split('T')[0],
      matchTime: matchData.matchTime || matchData.time || '10:00 AM',
      tossWinnerId: null,
      tossDecision: null,
      assignedScorerId: matchData.assignedScorerId || null,
      status: 'UPCOMING',
      currentInningsNumber: 1,
      currentBattingTeamId: null,
      currentBowlingTeamId: null,
      currentPlayers: null,
      result: null,
      winnerTeamId: null,
      winMargin: null,
      playerOfMatch: null,
      createdBy: user?.adminId || 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (this.database) {
      await this.database.query(`
        INSERT INTO npl_matches (
          id, tournament_id, season, match_number, tournament_phase,
          team_a_id, team_b_id, team_a_name, team_b_name, team_a_short, team_b_short,
          match_type, overs_limit, overs_per_bowler, powerplay_overs,
          city, ground, venue, match_date, match_time,
          ball_type, pitch_type, umpires, secondary_scorers,
          assigned_scorer_id, status, created_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22::jsonb, $23::jsonb, $24, $25, $26, $27, $28, $29
        )`,
        [
          newMatch.id, newMatch.tournamentId, newMatch.season, newMatch.matchNumber, newMatch.tournamentPhase,
          newMatch.teamAId, newMatch.teamBId, newMatch.teamAName, newMatch.teamBName, newMatch.teamAShort, newMatch.teamBShort,
          newMatch.matchType, newMatch.oversLimit, newMatch.oversPerBowler, newMatch.powerplayOvers,
          newMatch.city, newMatch.ground, newMatch.venue, newMatch.matchDate, newMatch.matchTime,
          newMatch.ballType, newMatch.pitchType, JSON.stringify(newMatch.umpires), JSON.stringify(newMatch.secondaryScorers),
          newMatch.assignedScorerId, newMatch.status, newMatch.createdBy, newMatch.createdAt, newMatch.updatedAt
        ]
      );
    } else {
      const matches = await readJson(matchesFile, []);
      matches.unshift(newMatch);
      await writeJson(matchesFile, matches);
    }

    return newMatch;
  }

  async updateMatch(matchId, updates) {
    if (this.database) {
      const current = await this.getMatchById(matchId);
      if (!current) throw new Error('Match not found');
      const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
      await this.database.query(`
        UPDATE npl_matches SET
          match_number = $2, tournament_phase = $3,
          overs_limit = $4, overs_per_bowler = $5, powerplay_overs = $6,
          city = $7, ground = $8, venue = $9, match_date = $10, match_time = $11,
          ball_type = $12, pitch_type = $13, umpires = $14::jsonb, secondary_scorers = $15::jsonb,
          assigned_scorer_id = $16, status = $17,
          toss_winner_id = $18, toss_decision = $19,
          current_innings_number = $20, current_batting_team_id = $21, current_bowling_team_id = $22,
          current_players = $23::jsonb, result = $24, winner_team_id = $25,
          win_margin = $26, player_of_match = $27,
          updated_at = NOW()
        WHERE id = $1
      `, [
        matchId, updated.matchNumber, updated.tournamentPhase,
        updated.oversLimit, updated.oversPerBowler, updated.powerplayOvers,
        updated.city, updated.ground, updated.venue, updated.matchDate, updated.matchTime,
        updated.ballType || 'Tennis', updated.pitchType || 'Matting',
        JSON.stringify(updated.umpires || []), JSON.stringify(updated.secondaryScorers || []),
        updated.assignedScorerId, updated.status,
        updated.tossWinnerId, updated.tossDecision,
        updated.currentInningsNumber, updated.currentBattingTeamId, updated.currentBowlingTeamId,
        updated.currentPlayers ? JSON.stringify(updated.currentPlayers) : null,
        updated.result, updated.winnerTeamId, updated.winMargin, updated.playerOfMatch ? JSON.stringify(updated.playerOfMatch) : null
      ]);
      return updated;
    }

    const matches = await readJson(matchesFile, []);
    const idx = matches.findIndex((m) => m.id === matchId);
    if (idx < 0) throw new Error('Match not found');
    matches[idx] = { ...matches[idx], ...updates, updatedAt: new Date().toISOString() };
    await writeJson(matchesFile, matches);
    return matches[idx];
  }

  async deleteMatch(matchId) {
    if (this.database) {
      await this.database.query('DELETE FROM npl_matches WHERE id = $1', [matchId]);
    } else {
      const matches = await readJson(matchesFile, []);
      await writeJson(matchesFile, matches.filter((m) => m.id !== matchId));
      const deliveries = await readJson(deliveriesFile, {});
      delete deliveries[matchId];
      await writeJson(deliveriesFile, deliveries);
      const squads = await readJson(squadsFile, {});
      delete squads[matchId];
      await writeJson(squadsFile, squads);
    }
  }

  async saveSquads(matchId, squads) {
    // squads: { teamA: [...players], teamB: [...players] }
    if (this.database) {
      await this.database.query('DELETE FROM npl_match_squads WHERE match_id = $1', [matchId]);
      for (const teamKey of ['teamA', 'teamB']) {
        const teamSquad = squads[teamKey] || [];
        for (const p of teamSquad) {
          await this.database.query(`
            INSERT INTO npl_match_squads (id, match_id, team_id, player_id, player_name, is_playing_xi, is_captain, is_wicketkeeper)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            `${matchId}_${p.id}`, matchId, p.teamId || teamKey, p.id, p.name,
            p.isPlayingXi !== false, Boolean(p.isCaptain), Boolean(p.isWicketkeeper)
          ]);
        }
      }
    } else {
      const allSquads = await readJson(squadsFile, {});
      allSquads[matchId] = squads;
      await writeJson(squadsFile, allSquads);
    }
  }

  async getSquads(matchId) {
    if (this.database) {
      const res = await this.database.query('SELECT * FROM npl_match_squads WHERE match_id = $1', [matchId]);
      const squads = { teamA: [], teamB: [] };
      const match = await this.getMatchById(matchId);
      for (const row of res.rows) {
        const item = {
          id: row.player_id,
          name: row.player_name,
          isPlayingXi: row.is_playing_xi,
          isCaptain: row.is_captain,
          isWicketkeeper: row.is_wicketkeeper
        };
        if (row.team_id === match?.teamAId) squads.teamA.push(item);
        else squads.teamB.push(item);
      }
      return squads;
    }
    const allSquads = await readJson(squadsFile, {});
    return allSquads[matchId] || { teamA: [], teamB: [] };
  }

  async recordToss(matchId, { tossWinnerId, tossDecision }) {
    const match = await this.getMatchById(matchId);
    if (!match) throw new Error('Match not found');

    const battingFirstId = tossDecision === 'BAT'
      ? tossWinnerId
      : (tossWinnerId === match.teamAId ? match.teamBId : match.teamAId);
    const bowlingFirstId = battingFirstId === match.teamAId ? match.teamBId : match.teamAId;

    const updated = await this.updateMatch(matchId, {
      tossWinnerId,
      tossDecision,
      status: 'TOSS',
      currentBattingTeamId: battingFirstId,
      currentBowlingTeamId: bowlingFirstId
    });

    broadcastMatchUpdate(matchId, 'match:updated', updated);
    return updated;
  }

  async startInnings(matchId, { inningsNumber = 1, striker, nonStriker, bowler }) {
    const match = await this.getMatchById(matchId);
    if (!match) throw new Error('Match not found');

    let battingTeamId = match.currentBattingTeamId;
    let bowlingTeamId = match.currentBowlingTeamId;

    if (inningsNumber === 2) {
      // Swap batting & bowling teams for 2nd innings
      battingTeamId = match.currentBowlingTeamId;
      bowlingTeamId = match.currentBattingTeamId;
    }

    const updated = await this.updateMatch(matchId, {
      status: 'LIVE',
      currentInningsNumber: inningsNumber,
      currentBattingTeamId: battingTeamId,
      currentBowlingTeamId: bowlingTeamId,
      currentPlayers: { striker, nonStriker, bowler }
    });

    // Save opening players
    const matchDeliveries = await this.getDeliveries(matchId);
    matchDeliveries[`innings_${inningsNumber}_openers`] = { striker, nonStriker, bowler };
    await this.saveDeliveriesMap(matchId, matchDeliveries);

    broadcastMatchUpdate(matchId, 'innings:started', { matchId, inningsNumber, striker, nonStriker, bowler });
    return updated;
  }

  async getDeliveries(matchId) {
    if (this.database) {
      const res = await this.database.query(
        'SELECT * FROM npl_deliveries WHERE match_id = $1 ORDER BY sequence_number ASC',
        [matchId]
      );
      const innings1 = [];
      const innings2 = [];
      for (const row of res.rows) {
        const item = {
          id: row.id,
          sequenceNumber: row.sequence_number,
          overNumber: row.over_number,
          ballNumber: row.ball_number,
          strikerId: row.striker_id,
          strikerName: row.striker_name,
          nonStrikerId: row.non_striker_id,
          nonStrikerName: row.non_striker_name,
          bowlerId: row.bowler_id,
          bowlerName: row.bowler_name,
          batRuns: row.bat_runs,
          extraRuns: row.extra_runs,
          extraType: row.extra_type,
          totalRuns: row.total_runs,
          isLegal: row.is_legal,
          isWicket: row.is_wicket,
          wicketType: row.wicket_type,
          dismissedPlayerId: row.dismissed_player_id,
          dismissedPlayerName: row.dismissed_player_name,
          fielderId: row.fielder_id,
          fielderName: row.fielder_name,
          commentary: row.commentary,
          createdAt: row.created_at
        };
        if (row.innings_id.endsWith('_1')) innings1.push(item);
        else innings2.push(item);
      }
      return { 1: innings1, 2: innings2 };
    }

    const allDeliveries = await readJson(deliveriesFile, {});
    return allDeliveries[matchId] || { 1: [], 2: [] };
  }

  async saveDeliveriesMap(matchId, map) {
    if (!this.database) {
      const allDeliveries = await readJson(deliveriesFile, {});
      allDeliveries[matchId] = map;
      await writeJson(deliveriesFile, allDeliveries);
    }
  }

  async recordDelivery(matchId, deliveryInput, user) {
    const releaseLock = await acquireLock(matchId);
    try {
      const match = await this.getMatchById(matchId);
      if (!match) throw new Error('Match not found');

      const inningsNum = match.currentInningsNumber || 1;
      const allDeliveries = await this.getDeliveries(matchId);
      const squads = await this.getSquads(matchId);
      const inningsDeliveries = allDeliveries[inningsNum] || [];

      // Openers
      const openers = allDeliveries[`innings_${inningsNum}_openers`] || {
        striker: { id: deliveryInput.strikerId, name: deliveryInput.strikerName },
        nonStriker: { id: deliveryInput.nonStrikerId, name: deliveryInput.nonStrikerName },
        bowler: { id: deliveryInput.bowlerId, name: deliveryInput.bowlerName }
      };
      const battingSquad = match.currentBattingTeamId === match.teamAId ? squads.teamA : squads.teamB;
      const bowlingSquad = match.currentBowlingTeamId === match.teamAId ? squads.teamA : squads.teamB;
      const maxWickets = maxWicketsForTeam(match, squads, match.currentBattingTeamId);
      const firstInningsMaxWickets = maxWicketsForTeam(match, squads, getFirstBattingTeamId(match));

      // Target for 2nd innings
      let target = null;
      if (inningsNum === 2) {
        const inn1Deliveries = allDeliveries[1] || [];
        const inn1State = calculateInningsState({
          maxOvers: match.oversLimit,
          maxWickets: firstInningsMaxWickets,
          openingStriker: allDeliveries['innings_1_openers']?.striker,
          openingBowler: allDeliveries['innings_1_openers']?.bowler,
          deliveries: inn1Deliveries
        });
        target = inn1State.totalRuns + 1;
      }

      // Calculate state before this ball
      const currentState = calculateInningsState({
        maxOvers: match.oversLimit,
        maxWickets,
        target,
        openingStriker: openers.striker,
        openingNonStriker: openers.nonStriker,
        openingBowler: openers.bowler,
        deliveries: inningsDeliveries
      });
      if (match.status !== 'LIVE' || currentState.isInningsComplete) {
        throw new Error('This innings is not live or has already completed.');
      }
      const selectedBowlerId = deliveryInput.bowlerId || currentState.currentBowler.id;
      const selectedBowler = currentState.bowling.find((figure) => figure.id === selectedBowlerId);
      if (!bowlingSquad.some((person) => person.id === selectedBowlerId && person.isPlayingXi !== false)) {
        throw new Error('Select a bowler from the playing XI.');
      }
      const bowlerQuota = Number(match.oversPerBowler || Math.ceil(match.oversLimit / 5));
      if (selectedBowler && selectedBowler.legalBalls >= bowlerQuota * 6) {
        throw new Error(`${selectedBowler.name} has reached the ${bowlerQuota}-over bowling quota.`);
      }
      if (currentState.legalBalls > 0 && currentState.legalBalls % 6 === 0) {
        const completedOverNumber = (currentState.legalBalls / 6) - 1;
        const bowledInPreviousOver = inningsDeliveries.some((delivery) =>
          delivery.overNumber === completedOverNumber && delivery.bowlerId === selectedBowlerId
        );
        if (bowledInPreviousOver) {
          throw new Error('The bowler from the previous over cannot bowl this over.');
        }
      }
      const dismissedPlayerId = deliveryInput.dismissedPlayerId || currentState.currentStriker.id;
      const isWicket = Boolean(deliveryInput.isWicket && deliveryInput.wicketType);
      if (isWicket && TEAM_WICKET_TYPES.has(deliveryInput.wicketType) &&
        dismissedPlayerId !== currentState.currentStriker.id &&
        dismissedPlayerId !== currentState.currentNonStriker.id) {
        throw new Error('Choose the striker or non-striker currently at the crease.');
      }
      const incomingPlayerId = deliveryInput.nextBatsmanId || deliveryInput.incomingPlayerId;
      const incomingBatter = battingSquad.find((person) =>
        person.id === incomingPlayerId && person.isPlayingXi !== false
      );
      const isTeamWicket = isWicket && TEAM_WICKET_TYPES.has(deliveryInput.wicketType);
      const incomingRequired = isWicket && (deliveryInput.wicketType === WICKET_TYPES.RETIRED_HURT ||
        (isTeamWicket && currentState.wickets + 1 < maxWickets));
      if (incomingRequired && !incomingBatter) {
        throw new Error('Select an eligible incoming batter who has not already been dismissed.');
      }
      if (incomingBatter && (
        incomingBatter.id === currentState.currentStriker.id ||
        incomingBatter.id === currentState.currentNonStriker.id ||
        currentState.batting.some((batter) => batter.id === incomingBatter.id && batter.isOut)
      )) {
        throw new Error('The incoming batter must be an eligible player who is not out or at the crease.');
      }

      // Prepare ball record
      const isLegal = deliveryInput.extraType !== EXTRA_TYPES.WIDE && deliveryInput.extraType !== EXTRA_TYPES.NO_BALL;
      const seqNumber = inningsDeliveries.length + 1;
      const currentLegalBalls = currentState.legalBalls;
      const overNumber = Math.floor(currentLegalBalls / 6);
      const ballNumber = isLegal ? (currentLegalBalls % 6) + 1 : (currentLegalBalls % 6) + 1;

      let batRuns = Number(deliveryInput.batRuns || 0);
      let extraRuns = Number(deliveryInput.extraRuns || 0);
      let totalRuns = batRuns;
      let bowlerRunsConceded = batRuns;

      if (deliveryInput.extraType === EXTRA_TYPES.WIDE) {
        const wideTotal = Math.max(1, (extraRuns || 1) + batRuns);
        totalRuns = wideTotal;
        extraRuns = wideTotal;
        batRuns = 0;
        bowlerRunsConceded = wideTotal;
      } else if (deliveryInput.extraType === EXTRA_TYPES.NO_BALL) {
        const nbExtra = extraRuns || 1;
        totalRuns = nbExtra + batRuns;
        extraRuns = nbExtra;
        bowlerRunsConceded = totalRuns;
      } else if (deliveryInput.extraType === EXTRA_TYPES.BYE || deliveryInput.extraType === EXTRA_TYPES.LEG_BYE) {
        const byeTotal = extraRuns || batRuns || 1;
        totalRuns = byeTotal;
        extraRuns = byeTotal;
        batRuns = 0;
        bowlerRunsConceded = 0;
      }

      const newDelivery = {
        id: `del_${matchId}_${inningsNum}_${seqNumber}_${randomBytes(3).toString('hex')}`,
        sequenceNumber: seqNumber,
        overNumber,
        ballNumber,
        strikerId: deliveryInput.strikerId || currentState.currentStriker.id,
        strikerName: deliveryInput.strikerName || currentState.currentStriker.name,
        nonStrikerId: deliveryInput.nonStrikerId || currentState.currentNonStriker.id,
        nonStrikerName: deliveryInput.nonStrikerName || currentState.currentNonStriker.name,
        bowlerId: deliveryInput.bowlerId || currentState.currentBowler.id,
        bowlerName: deliveryInput.bowlerName || currentState.currentBowler.name,
        batRuns,
        extraRuns,
        extraType: deliveryInput.extraType || null,
        totalRuns,
        bowlerRunsConceded,
        isLegal,
        isWicket,
        wicketType: deliveryInput.wicketType || null,
        dismissedPlayerId: isWicket ? dismissedPlayerId : null,
        dismissedPlayerName: isWicket ? (
          deliveryInput.dismissedPlayerName ||
          (dismissedPlayerId === currentState.currentStriker.id
            ? currentState.currentStriker.name
            : currentState.currentNonStriker.name)
        ) : null,
        incomingPlayerId: incomingBatter?.id || null,
        incomingPlayerName: incomingBatter?.name || null,
        fielderId: deliveryInput.fielderId || null,
        fielderName: deliveryInput.fielderName || null,
        commentary: deliveryInput.commentary || '',
        createdAt: new Date().toISOString()
      };

      inningsDeliveries.push(newDelivery);
      allDeliveries[inningsNum] = inningsDeliveries;

      // Recalculate full state after this ball
      const stateAfter = calculateInningsState({
        maxOvers: match.oversLimit,
        maxWickets,
        target,
        openingStriker: openers.striker,
        openingNonStriker: openers.nonStriker,
        openingBowler: openers.bowler,
        deliveries: inningsDeliveries
      });

      // Handle innings break or match completion if target chased / all out / overs finished
      if (stateAfter.isInningsComplete) {
        if (inningsNum === 1) {
          match.status = 'INNINGS_BREAK';
        } else if (inningsNum === 2) {
          let resultText = '';
          let winnerId = null;
          let margin = '';

          const battingTeamName = match.currentBattingTeamId === match.teamAId ? match.teamAName : match.teamBName;
          const bowlingTeamName = match.currentBowlingTeamId === match.teamAId ? match.teamAName : match.teamBName;

          if (stateAfter.totalRuns >= target) {
            const wicketsRemaining = maxWickets - stateAfter.wickets;
            winnerId = match.currentBattingTeamId;
            margin = `${wicketsRemaining} wicket${wicketsRemaining > 1 ? 's' : ''}`;
            resultText = `${battingTeamName} won by ${margin}`;
          } else if (stateAfter.totalRuns === (target - 1)) {
            resultText = 'Match Tied';
          } else {
            const runDiff = (target - 1) - stateAfter.totalRuns;
            winnerId = match.currentBowlingTeamId;
            margin = `${runDiff} run${runDiff > 1 ? 's' : ''}`;
            resultText = `${bowlingTeamName} won by ${margin}`;
          }

          match.status = 'COMPLETED';
          match.result = resultText;
          match.winnerTeamId = winnerId;
          match.winMargin = margin;
        }
      }

      await this.updateMatch(matchId, {
        status: match.status,
        result: match.result,
        winnerTeamId: match.winnerTeamId,
        winMargin: match.winMargin,
        currentPlayers: {
          striker: stateAfter.currentStriker,
          nonStriker: stateAfter.currentNonStriker,
          bowler: stateAfter.currentBowler
        }
      });

      if (this.database) {
        await this.database.query(`
          INSERT INTO npl_deliveries (
            id, match_id, innings_id, sequence_number, over_number, ball_number,
            striker_id, striker_name, non_striker_id, non_striker_name,
            bowler_id, bowler_name, bat_runs, extra_runs, extra_type, total_runs,
            is_legal, is_wicket, wicket_type, dismissed_player_id, dismissed_player_name,
            fielder_id, fielder_name, commentary, created_by, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
          )
        `, [
          newDelivery.id, matchId, `${matchId}_${inningsNum}`, newDelivery.sequenceNumber,
          newDelivery.overNumber, newDelivery.ballNumber,
          newDelivery.strikerId, newDelivery.strikerName,
          newDelivery.nonStrikerId, newDelivery.nonStrikerName,
          newDelivery.bowlerId, newDelivery.bowlerName,
          newDelivery.batRuns, newDelivery.extraRuns, newDelivery.extraType, newDelivery.totalRuns,
          newDelivery.isLegal, newDelivery.isWicket, newDelivery.wicketType,
          newDelivery.dismissedPlayerId, newDelivery.dismissedPlayerName,
          newDelivery.fielderId, newDelivery.fielderName,
          newDelivery.commentary, user?.adminId || 'scorer', newDelivery.createdAt
        ]);
      } else {
        await this.saveDeliveriesMap(matchId, allDeliveries);
      }

      const payload = {
        matchId,
        inningsNumber: inningsNum,
        delivery: newDelivery,
        scoreState: stateAfter,
        matchStatus: match.status,
        result: match.result
      };

      broadcastMatchUpdate(matchId, 'score:updated', payload);
      return payload;
    } finally {
      releaseLock();
    }
  }

  async undoDelivery(matchId, user) {
    const releaseLock = await acquireLock(matchId);
    try {
      const match = await this.getMatchById(matchId);
      if (!match) throw new Error('Match not found');

      const inningsNum = match.currentInningsNumber || 1;
      const allDeliveries = await this.getDeliveries(matchId);
      const squads = await this.getSquads(matchId);
      const inningsDeliveries = allDeliveries[inningsNum] || [];

      if (inningsDeliveries.length === 0) {
        throw new Error('No deliveries to undo in this innings.');
      }

      const popped = inningsDeliveries.pop();

      if (this.database) {
        await this.database.query('DELETE FROM npl_deliveries WHERE id = $1', [popped.id]);
      } else {
        allDeliveries[inningsNum] = inningsDeliveries;
        await this.saveDeliveriesMap(matchId, allDeliveries);
      }

      // Re-evaluate innings state
      const openers = allDeliveries[`innings_${inningsNum}_openers`] || {
        striker: { id: popped.strikerId, name: popped.strikerName },
        nonStriker: { id: popped.nonStrikerId, name: popped.nonStrikerName },
        bowler: { id: popped.bowlerId, name: popped.bowlerName }
      };

      let target = null;
      if (inningsNum === 2) {
        const inn1Deliveries = allDeliveries[1] || [];
        const inn1State = calculateInningsState({
          maxOvers: match.oversLimit,
          maxWickets: maxWicketsForTeam(match, squads, getFirstBattingTeamId(match)),
          openingStriker: allDeliveries['innings_1_openers']?.striker,
          openingBowler: allDeliveries['innings_1_openers']?.bowler,
          deliveries: inn1Deliveries
        });
        target = inn1State.totalRuns + 1;
      }

      const stateAfterUndo = calculateInningsState({
        maxOvers: match.oversLimit,
        maxWickets: maxWicketsForTeam(match, squads, match.currentBattingTeamId),
        target,
        openingStriker: openers.striker,
        openingNonStriker: openers.nonStriker,
        openingBowler: openers.bowler,
        deliveries: inningsDeliveries
      });

      // If match was completed, restore to LIVE
      if (match.status === 'COMPLETED') {
        match.status = 'LIVE';
        match.result = null;
      }
      await this.updateMatch(matchId, {
        status: match.status,
        result: match.result,
        winnerTeamId: match.status === 'LIVE' ? null : match.winnerTeamId,
        winMargin: match.status === 'LIVE' ? null : match.winMargin,
        currentPlayers: {
          striker: stateAfterUndo.currentStriker,
          nonStriker: stateAfterUndo.currentNonStriker,
          bowler: stateAfterUndo.currentBowler
        }
      });

      const payload = {
        matchId,
        inningsNumber: inningsNum,
        undoneDelivery: popped,
        scoreState: stateAfterUndo,
        matchStatus: match.status
      };

      broadcastMatchUpdate(matchId, 'delivery:undone', payload);
      return payload;
    } finally {
      releaseLock();
    }
  }

  async getScorecard(matchId) {
    const match = await this.getMatchById(matchId);
    if (!match) return null;

    const allDeliveries = await this.getDeliveries(matchId);
    const inn1Deliveries = allDeliveries[1] || [];
    const inn2Deliveries = allDeliveries[2] || [];
    const squads = await this.getSquads(matchId);
    const firstTeamId = getFirstBattingTeamId(match);
    const secondTeamId = firstTeamId === match.teamAId ? match.teamBId : match.teamAId;

    const inn1Openers = allDeliveries['innings_1_openers'] || {
      striker: inn1Deliveries[0] ? { id: inn1Deliveries[0].strikerId, name: inn1Deliveries[0].strikerName } : null,
      nonStriker: inn1Deliveries[0] ? { id: inn1Deliveries[0].nonStrikerId, name: inn1Deliveries[0].nonStrikerName } : null,
      bowler: inn1Deliveries[0] ? { id: inn1Deliveries[0].bowlerId, name: inn1Deliveries[0].bowlerName } : null
    };

    const inn2Openers = allDeliveries['innings_2_openers'] || {
      striker: inn2Deliveries[0] ? { id: inn2Deliveries[0].strikerId, name: inn2Deliveries[0].strikerName } : null,
      nonStriker: inn2Deliveries[0] ? { id: inn2Deliveries[0].nonStrikerId, name: inn2Deliveries[0].nonStrikerName } : null,
      bowler: inn2Deliveries[0] ? { id: inn2Deliveries[0].bowlerId, name: inn2Deliveries[0].bowlerName } : null
    };

    const inn1State = calculateInningsState({
      maxOvers: match.oversLimit,
      maxWickets: maxWicketsForTeam(match, squads, firstTeamId),
      openingStriker: inn1Openers.striker,
      openingNonStriker: inn1Openers.nonStriker,
      openingBowler: inn1Openers.bowler,
      deliveries: inn1Deliveries
    });

    const target = inn1State.totalRuns + 1;

    const inn2State = calculateInningsState({
      maxOvers: match.oversLimit,
      maxWickets: maxWicketsForTeam(match, squads, secondTeamId),
      target,
      openingStriker: inn2Openers.striker,
      openingNonStriker: inn2Openers.nonStriker,
      openingBowler: inn2Openers.bowler,
      deliveries: inn2Deliveries
    });

    const currentInningsState = match.currentInningsNumber === 2 ? inn2State : inn1State;
    const savedPlayers = match.currentPlayers || {};
    const savedBowlerFigures = savedPlayers.bowler
      ? currentInningsState.bowling.find((figure) => figure.id === savedPlayers.bowler.id)
      : null;
    const currentBowler = savedPlayers.bowler
      ? {
        ...savedPlayers.bowler,
        ...(savedBowlerFigures || {
          overs: '0.0',
          maidens: 0,
          runsConceded: 0,
          wickets: 0,
          economy: '0.00'
        })
      }
      : currentInningsState.currentBowler;

    const firstBattingTeamId = firstTeamId;
    const firstBattingTeamName = firstBattingTeamId === match.teamAId ? match.teamAName : match.teamBName;
    const secondBattingTeamName = firstBattingTeamId === match.teamAId ? match.teamBName : match.teamAName;

    return {
      match,
      currentInningsNumber: match.currentInningsNumber,
      liveSummary: {
        score: `${currentInningsState.totalRuns}/${currentInningsState.wickets}`,
        overs: currentInningsState.overs,
        crr: currentInningsState.currentRunRate,
        rrr: currentInningsState.requiredRunRate,
        target: match.currentInningsNumber === 2 ? target : null,
        remainingRuns: currentInningsState.remainingRuns,
        remainingBalls: currentInningsState.remainingBalls,
        currentStriker: savedPlayers.striker || currentInningsState.currentStriker,
        currentNonStriker: savedPlayers.nonStriker || currentInningsState.currentNonStriker,
        currentBowler,
        recentDeliveries: currentInningsState.recentDeliveries,
        currentOverDeliveries: currentInningsState.currentOverDeliveries
      },
      innings: [
        {
          inningsNumber: 1,
          teamId: firstBattingTeamId,
          teamName: firstBattingTeamName,
          ...inn1State,
          deliveries: inn1Deliveries
        },
        {
          inningsNumber: 2,
          teamId: firstBattingTeamId === match.teamAId ? match.teamBId : match.teamAId,
          teamName: secondBattingTeamName,
          ...inn2State,
          deliveries: inn2Deliveries
        }
      ]
    };
  }

  mapMatchRow(row) {
    return {
      id: row.id,
      tournamentId: row.tournament_id,
      season: row.season,
      matchNumber: row.match_number,
      tournamentPhase: row.tournament_phase,
      teamAId: row.team_a_id,
      teamBId: row.team_b_id,
      teamAName: row.team_a_name,
      teamBName: row.team_b_name,
      teamAShort: row.team_a_short,
      teamBShort: row.team_b_short,
      matchType: row.match_type,
      oversLimit: Number(row.overs_limit),
      oversPerBowler: Number(row.overs_per_bowler),
      powerplayOvers: Number(row.powerplay_overs),
      city: row.city,
      ground: row.ground,
      venue: row.venue,
      ballType: row.ball_type || 'Tennis',
      pitchType: row.pitch_type || 'Matting',
      umpires: row.umpires || [],
      secondaryScorers: row.secondary_scorers || [],
      matchDate: row.match_date,
      matchTime: row.match_time,
      tossWinnerId: row.toss_winner_id,
      tossDecision: row.toss_decision,
      assignedScorerId: row.assigned_scorer_id,
      status: row.status,
      currentInningsNumber: Number(row.current_innings_number || 1),
      currentBattingTeamId: row.current_batting_team_id,
      currentBowlingTeamId: row.current_bowling_team_id,
      currentPlayers: row.current_players || null,
      result: row.result,
      winnerTeamId: row.winner_team_id,
      winMargin: row.win_margin,
      playerOfMatch: row.player_of_match,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async endInnings(matchId) {
    const match = await this.getMatchById(matchId);
    if (!match) throw new Error('Match not found');
    const updated = await this.updateMatch(matchId, {
      status: 'INNINGS_BREAK',
      currentInningsNumber: 2
    });
    broadcastMatchUpdate(matchId, 'match:updated', updated);
    return updated;
  }

  async endMatch(matchId, { result, winnerTeamId, winMargin, playerOfMatch } = {}) {
    const match = await this.getMatchById(matchId);
    if (!match) throw new Error('Match not found');
    const updated = await this.updateMatch(matchId, {
      status: 'COMPLETED',
      result: result || match.result,
      winnerTeamId: winnerTeamId || match.winnerTeamId,
      winMargin: winMargin || match.winMargin,
      playerOfMatch: playerOfMatch || match.playerOfMatch
    });
    broadcastMatchUpdate(matchId, 'match:completed', updated);
    return updated;
  }

  async getPointsTable(season) {
    const matches = await this.getAllMatches({ season });
    const completedMatches = matches.filter((m) => m.status === 'COMPLETED');

    const teamsMap = new Map();

    const getOrCreateTeam = (id, name, shortName) => {
      if (!teamsMap.has(id)) {
        teamsMap.set(id, {
          id,
          team: name,
          name,
          shortName: shortName || name.slice(0, 3).toUpperCase(),
          played: 0,
          won: 0,
          lost: 0,
          tied: 0,
          noResult: 0,
          points: 0,
          runsFor: 0,
          oversForBalls: 0,
          runsAgainst: 0,
          oversAgainstBalls: 0,
          form: []
        });
      }
      return teamsMap.get(id);
    };

    // Register all teams found in season fixtures
    for (const m of matches) {
      getOrCreateTeam(m.teamAId, m.teamAName, m.teamAShort);
      getOrCreateTeam(m.teamBId, m.teamBName, m.teamBShort);
    }

    for (const match of completedMatches) {
      const scorecard = await this.getScorecard(match.id);
      if (!scorecard || !scorecard.innings || scorecard.innings.length === 0) continue;

      const inn1 = scorecard.innings[0];
      const inn2 = scorecard.innings[1];
      if (!inn1) continue;

      const teamA = getOrCreateTeam(match.teamAId, match.teamAName, match.teamAShort);
      const teamB = getOrCreateTeam(match.teamBId, match.teamBName, match.teamBShort);

      teamA.played += 1;
      teamB.played += 1;

      // Determine match winner
      if (match.winnerTeamId === teamA.id) {
        teamA.won += 1;
        teamA.points += 2;
        teamA.form.push('W');
        teamB.lost += 1;
        teamB.form.push('L');
      } else if (match.winnerTeamId === teamB.id) {
        teamB.won += 1;
        teamB.points += 2;
        teamB.form.push('W');
        teamA.lost += 1;
        teamA.form.push('L');
      } else if (match.result?.toLowerCase().includes('tie')) {
        teamA.tied += 1;
        teamA.points += 1;
        teamA.form.push('T');
        teamB.tied += 1;
        teamB.points += 1;
        teamB.form.push('T');
      } else {
        teamA.noResult += 1;
        teamA.points += 1;
        teamA.form.push('NR');
        teamB.noResult += 1;
        teamB.points += 1;
        teamB.form.push('NR');
      }

      // Innings 1 batting & bowling team
      const inn1BatTeamId = match.tossDecision === 'BAT'
        ? match.tossWinnerId
        : (match.tossWinnerId === match.teamAId ? match.teamBId : (match.tossWinnerId ? match.teamAId : match.currentBattingTeamId || match.teamAId));
      const inn1Bat = inn1BatTeamId === teamA.id ? teamA : teamB;
      const inn1Bowl = inn1BatTeamId === teamA.id ? teamB : teamA;

      const inn1OversQuotaBalls = Math.round(Number(match.oversLimit || 20) * 6);
      const inn1BallsFaced = inn1.isAllOut ? inn1OversQuotaBalls : inn1.legalBalls;

      inn1Bat.runsFor += inn1.totalRuns;
      inn1Bat.oversForBalls += inn1BallsFaced;
      inn1Bowl.runsAgainst += inn1.totalRuns;
      inn1Bowl.oversAgainstBalls += inn1BallsFaced;

      // Innings 2 batting & bowling team (if played)
      if (inn2 && inn2.legalBalls > 0) {
        const inn2Bat = inn1Bowl;
        const inn2Bowl = inn1Bat;
        const inn2OversQuotaBalls = Math.round(Number(match.oversLimit || 20) * 6);
        const inn2BallsFaced = inn2.isAllOut ? inn2OversQuotaBalls : inn2.legalBalls;

        inn2Bat.runsFor += inn2.totalRuns;
        inn2Bat.oversForBalls += inn2BallsFaced;
        inn2Bowl.runsAgainst += inn2.totalRuns;
        inn2Bowl.oversAgainstBalls += inn2BallsFaced;
      }
    }

    const rows = Array.from(teamsMap.values()).map((row) => {
      const nrr = calculateTournamentNetRunRate({
        runsScored: row.runsFor,
        ballsFaced: row.oversForBalls,
        runsConceded: row.runsAgainst,
        ballsBowled: row.oversAgainstBalls
      });

      return {
        id: row.id,
        team: row.name,
        name: row.name,
        shortName: row.shortName,
        played: row.played,
        won: row.won,
        lost: row.lost,
        tied: row.tied,
        noResult: row.noResult,
        points: row.points,
        nrr,
        netRunRate: nrr,
        for: `${row.runsFor}/${Math.floor(row.oversForBalls / 6)}.${row.oversForBalls % 6}`,
        against: `${row.runsAgainst}/${Math.floor(row.oversAgainstBalls / 6)}.${row.oversAgainstBalls % 6}`,
        form: row.form.slice(-5)
      };
    });

    // Sort by points DESC, then numeric NRR DESC, then wins DESC
    rows.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const nrrA = parseFloat(a.nrr) || 0;
      const nrrB = parseFloat(b.nrr) || 0;
      if (nrrB !== nrrA) return nrrB - nrrA;
      return b.won - a.won;
    });

    return rows.map((r, i) => ({ rank: i + 1, ...r }));
  }

  async getLeaderboard(season) {
    const matches = await this.getAllMatches({ season });
    const battersMap = new Map();
    const bowlersMap = new Map();

    for (const match of matches) {
      const scorecard = await this.getScorecard(match.id);
      if (!scorecard || !scorecard.innings) continue;

      for (const inn of scorecard.innings) {
        for (const b of (inn.batting || [])) {
          if (!battersMap.has(b.id)) {
            battersMap.set(b.id, {
              id: b.id,
              name: b.name,
              innings: 0,
              runs: 0,
              balls: 0,
              fours: 0,
              sixes: 0,
              notOuts: 0,
              highestScore: 0
            });
          }
          const batter = battersMap.get(b.id);
          batter.innings += 1;
          batter.runs += (b.runs || 0);
          batter.balls += (b.balls || 0);
          batter.fours += (b.fours || 0);
          batter.sixes += (b.sixes || 0);
          if (!b.isOut) batter.notOuts += 1;
          if (b.runs > batter.highestScore) batter.highestScore = b.runs;
        }

        for (const bw of (inn.bowling || [])) {
          if (!bowlersMap.has(bw.id)) {
            bowlersMap.set(bw.id, {
              id: bw.id,
              name: bw.name,
              innings: 0,
              legalBalls: 0,
              maidens: 0,
              runs: 0,
              wickets: 0,
              bestWickets: 0,
              bestRuns: 999
            });
          }
          const bowler = bowlersMap.get(bw.id);
          bowler.innings += 1;
          bowler.legalBalls += (bw.legalBalls || 0);
          bowler.maidens += (bw.maidens || 0);
          bowler.runs += (bw.runsConceded || 0);
          bowler.wickets += (bw.wickets || 0);
          if (
            bw.wickets > bowler.bestWickets ||
            (bw.wickets === bowler.bestWickets && bw.runsConceded < bowler.bestRuns)
          ) {
            bowler.bestWickets = bw.wickets;
            bowler.bestRuns = bw.runsConceded;
          }
        }
      }
    }

    const topBatters = Array.from(battersMap.values())
      .map((b) => ({
        ...b,
        strikeRate: b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0',
        average: (b.innings - b.notOuts) > 0 ? (b.runs / (b.innings - b.notOuts)).toFixed(1) : b.runs.toFixed(1)
      }))
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 10);

    const topBowlers = Array.from(bowlersMap.values())
      .map((bw) => ({
        ...bw,
        overs: `${Math.floor(bw.legalBalls / 6)}.${bw.legalBalls % 6}`,
        economy: bw.legalBalls > 0 ? ((bw.runs / bw.legalBalls) * 6).toFixed(2) : '0.00',
        average: bw.wickets > 0 ? (bw.runs / bw.wickets).toFixed(1) : '0.0',
        bestFigures: bowlerFiguresDisplay(bw.bestWickets, bw.bestRuns)
      }))
      .sort((a, b) => b.wickets - a.wickets || a.economy - b.economy)
      .slice(0, 10);

    return { topBatters, topBowlers };
  }
}

const bowlerFiguresDisplay = (wickets, runs) => {
  if (wickets === 0 && runs === 999) return '0/0';
  return `${wickets}/${runs === 999 ? 0 : runs}`;
};
