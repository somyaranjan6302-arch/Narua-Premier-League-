const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8'
  }
});

const isValidSeason = (season) =>
  typeof season === 'string' && season.trim().length > 0 && season.length <= 60;

const publicAuctionState = (state) => {
  if (!state) return state;
  const { auditLog: _auditLog, ...publicState } = state;
  return publicState;
};

export class AuctionRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/publish' && request.method === 'POST') {
      let payload;
      try {
        payload = await request.json();
      } catch {
        return json({ error: 'Realtime update must be valid JSON.' }, 400);
      }

      const validBid = payload?.type === 'auction-bid' && payload.bid &&
        typeof payload.bid === 'object' && Number.isSafeInteger(payload.bid.version) &&
        Number.isSafeInteger(payload.bid.currentBid) && Array.isArray(payload.bid.bidHistory);
      const validState = payload?.type !== 'auction-bid' && payload?.state &&
        typeof payload.state === 'object' && Number.isSafeInteger(payload.state.version);
      const validScoringUpdate = payload?.type === 'scoring-update' &&
        payload.match && typeof payload.match === 'object' &&
        typeof payload.match.id === 'string' &&
        payload.match.season === payload.season &&
        payload.scorecard && typeof payload.scorecard === 'object' &&
        payload.scorecard.match?.id === payload.match.id;
      const validScoringSummary = payload?.type === 'scoring-summary' &&
        payload.match && typeof payload.match === 'object' &&
        typeof payload.match.id === 'string' &&
        payload.match.season === payload.season &&
        payload.scorecard && Array.isArray(payload.scorecard.innings) &&
        [1, 2].includes(payload.scorecard.currentInningsNumber) &&
        payload.scorecard.liveSummary && typeof payload.scorecard.liveSummary === 'object' &&
        (payload.scorecard.liveSummary.target === null ||
          Number.isFinite(payload.scorecard.liveSummary.target)) &&
        (payload.scorecard.liveSummary.remainingRuns === null ||
          Number.isFinite(payload.scorecard.liveSummary.remainingRuns)) &&
        (payload.scorecard.liveSummary.remainingBalls === null ||
          Number.isFinite(payload.scorecard.liveSummary.remainingBalls)) &&
        (payload.scorecard.liveSummary.rrr === null ||
          typeof payload.scorecard.liveSummary.rrr === 'string') &&
        payload.scorecard.innings.every((innings) =>
          typeof innings?.teamId === 'string' &&
          Number.isFinite(innings.totalRuns) &&
          Number.isFinite(innings.wickets) &&
          typeof innings.overs === 'string'
        );
      const isScoringUpdate = payload?.type === 'scoring-update';
      const isScoringSummary = payload?.type === 'scoring-summary';
      if (!payload || !isValidSeason(payload.season) ||
        (isScoringUpdate ? !validScoringUpdate
          : isScoringSummary ? !validScoringSummary : (!validBid && !validState))) {
        return json({ error: 'Realtime update is invalid.' }, 400);
      }

      const message = isScoringUpdate
        ? JSON.stringify({
          type: 'scoring-update',
          season: payload.season,
          match: payload.match,
          scorecard: payload.scorecard
        })
        : isScoringSummary
        ? JSON.stringify({
          type: 'scoring-summary',
          season: payload.season,
          match: payload.match,
          scorecard: payload.scorecard
        })
        : payload.type === 'auction-bid'
        ? JSON.stringify({
          type: 'auction-bid',
          season: payload.season,
          bid: payload.bid
        })
        : JSON.stringify({
          type: 'auction-state',
          season: payload.season,
          state: publicAuctionState(payload.state)
        });
      let delivered = 0;
      for (const socket of this.ctx.getWebSockets()) {
        const attachment = socket.deserializeAttachment();
        const channel = isScoringUpdate ? 'scoring-match' : isScoringSummary ? 'scoring' : 'auction';
        if ((attachment?.channel || 'auction') !== channel || attachment.season !== payload.season) continue;
        if (isScoringUpdate && attachment.matchId !== payload.match.id) continue;
        try {
          socket.send(message);
          delivered += 1;
        } catch {
          socket.close(1011, 'Realtime update delivery failed.');
        }
      }

      return json({ delivered });
    }

    if (url.pathname !== '/connect' || request.method !== 'GET' ||
      request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Not found.', { status: 404 });
    }

    const season = url.searchParams.get('season')?.trim() || '';
    const requestedChannel = url.searchParams.get('channel');
    const channel = requestedChannel === 'scoring-match' ? 'scoring-match'
      : requestedChannel === 'scoring' ? 'scoring' : 'auction';
    if (!isValidSeason(season)) return new Response('Choose a valid season.', { status: 400 });
    const matchId = url.searchParams.get('matchId')?.trim() || '';
    if (channel === 'scoring-match' && !/^[A-Za-z0-9._:-]{1,120}$/.test(matchId)) {
      return new Response('Choose a valid match.', { status: 400 });
    }

    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment({ season, channel, ...(channel === 'scoring-match' ? { matchId } : {}) });
    if (channel === 'scoring' || channel === 'scoring-match') {
      pair[1].send(JSON.stringify({ type: 'scoring-connected', season }));
    } else {
      const result = await this.env.DB.prepare(
        'SELECT value FROM npl_site_data WHERE data_key = ?'
      ).bind(`auction-live:${season}`).first();
      const state = result?.value ? JSON.parse(result.value) : null;
      pair[1].send(JSON.stringify({
        type: 'auction-state',
        season,
        state: publicAuctionState(state),
        version: state?.version || 0
      }));
    }

    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  webSocketMessage(socket) {
    socket.close(1008, 'Auction rooms are read-only for spectators.');
  }

  webSocketClose() {}

  webSocketError(socket) {
    socket.close(1011, 'Auction room connection failed.');
  }
}

export default {
  async fetch() {
    return new Response('Not found.', { status: 404 });
  }
};
