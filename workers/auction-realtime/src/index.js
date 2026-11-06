const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8'
  }
});

const isValidSeason = (season) =>
  typeof season === 'string' && season.trim().length > 0 && season.length <= 60;

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
        return json({ error: 'Auction update must be valid JSON.' }, 400);
      }

      if (!payload || !isValidSeason(payload.season) || !payload.state ||
        typeof payload.state !== 'object' || !Number.isSafeInteger(payload.state.version)) {
        return json({ error: 'Auction update is invalid.' }, 400);
      }

      const message = JSON.stringify({
        type: 'auction-state',
        season: payload.season,
        state: payload.state
      });
      let delivered = 0;
      for (const socket of this.ctx.getWebSockets()) {
        try {
          socket.send(message);
          delivered += 1;
        } catch {
          socket.close(1011, 'Auction update delivery failed.');
        }
      }

      return json({ delivered });
    }

    if (url.pathname !== '/connect' || request.method !== 'GET' ||
      request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Not found.', { status: 404 });
    }

    const season = url.searchParams.get('season')?.trim() || '';
    if (!isValidSeason(season)) return new Response('Choose a valid auction season.', { status: 400 });

    const result = await this.env.DB.prepare(
      'SELECT value FROM npl_site_data WHERE data_key = ?'
    ).bind(`auction-live:${season}`).first();
    const state = result?.value ? JSON.parse(result.value) : null;

    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment({ season });
    pair[1].send(JSON.stringify({
      type: 'auction-state',
      season,
      state,
      version: state?.version || 0
    }));

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
