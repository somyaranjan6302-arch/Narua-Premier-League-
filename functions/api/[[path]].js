import { mergeOfficialSession1Content } from '../../src/data/session1Performers.js';
import { mergeOfficialSession2Content } from '../../src/data/session2Data.js';
import { mergeOfficialSession3Content } from '../../src/data/session3Data.js';
import { mergeOfficialSession4Content } from '../../src/data/session4Data.js';
import { mergeOfficialSession5Content } from '../../src/data/session5Data.js';
import staticSiteMedia from '../staticSiteMedia.js';
import {
  auctionPhotoByteLength,
  auctionBidSnapshot,
  auditAuctionTransition,
  AuctionBidError,
  commitAuctionBid,
  compactAuctionState,
  isAuctionTeamEligible,
  isAuctionPlayerPhotoUrl,
  MAX_AUCTION_PHOTO_BYTES,
  publicAuctionState
} from './auctionState.js';
import {
  createPublicRegistration,
  matchesRegistrationIdentity,
  PlayerRegistrationError
} from './registrationState.js';
import { handleLiveScoringApi } from './liveScoring.js';

const SESSION_COOKIE = 'npl_admin_session';
const SESSION_SECONDS = 8 * 60 * 60;
const PASSWORD_ITERATIONS = 100000;
const MEDIA_CHUNK_SIZE = 96 * 1024;
const mediaTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const mediaKeyPattern = /^(news|champion|team-logo|team|match-banner|gallery|memory-photo|highlight|performer|featured-performer|player-photo|auction-player-photo|season|section-photo|record):[A-Za-z0-9 ._-]{1,80}$/;
const allowedMediaKeys = new Set(['logo', 'trophy', 'stadium']);
const AUCTION_PHOTO_PATTERN = /^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/;

const json = (value, status = 200, headers = {}) => new Response(
  JSON.stringify(value),
  {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'same-origin',
      ...headers
    }
  }
);

const errorResponse = (message, status) => json({ error: message }, status);
const database = (env) => {
  if (!env.DB) throw new Error('The Cloudflare D1 binding "DB" is not configured.');
  return env.DB;
};
const first = (env, query, ...values) => database(env).prepare(query).bind(...values).first();
const all = async (env, query, ...values) => {
  const result = await database(env).prepare(query).bind(...values).all();
  return result.results || [];
};
const run = (env, query, ...values) => database(env).prepare(query).bind(...values).run();
const readSiteValue = async (env, key) => {
  const row = await first(env, 'SELECT value FROM npl_site_data WHERE data_key = ?', key);
  return row ? JSON.parse(row.value) : null;
};
const setSiteValue = (env, key, value) => run(
  env,
  `INSERT INTO npl_site_data (data_key, value) VALUES (?, ?)
   ON CONFLICT(data_key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
  key,
  JSON.stringify(value)
);

const publishAuctionUpdate = async (env, season, update, executionContext) => {
  const task = (async () => {
    if (!env.AUCTION_ROOMS) throw new Error('The Cloudflare Durable Object binding "AUCTION_ROOMS" is not configured.');
    const roomId = env.AUCTION_ROOMS.idFromName(season);
    const response = await env.AUCTION_ROOMS.get(roomId).fetch('https://auction-room/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ season, ...update })
    });
    if (!response.ok) throw new Error(`Auction room returned HTTP ${response.status}.`);
  })().catch((error) => {
    console.error('Auction state was saved, but its WebSocket broadcast failed:', error);
  });

  if (typeof executionContext?.waitUntil === 'function') executionContext.waitUntil(task);
  else await task;
};

const compactStoredAuction = async (env, season, state, executionContext) => {
  const playerId = state?.currentPlayer?.id;
  let photo = state?.currentPlayer?.photo || '';
  if (playerId && !photo) {
    const registration = await first(
      env,
      'SELECT value FROM npl_auction_registrations WHERE registration_id = ?',
      playerId
    );
    photo = registration ? JSON.parse(registration.value).photo || '' : '';
  }
  const photoUrl = playerId && photo.startsWith('data:image/')
    ? await ensureAuctionPlayerPhoto(env, playerId, photo, true)
    : playerId && photo.startsWith('/api/auction/player-photo?')
      ? await ensureAuctionPlayerPhoto(env, playerId, photo, true)
      : photo;
  if (photoUrl && photoUrl !== state?.currentPlayer?.photo) {
    state = { ...state, currentPlayer: { ...state.currentPlayer, photo: photoUrl } };
  }
  const compacted = compactAuctionState(state, photoUrl);
  if (!compacted) return state;

  const key = `auction-live:${season}`;
  const saved = await first(
    env,
    `UPDATE npl_site_data SET value = ?, updated_at = CURRENT_TIMESTAMP
     WHERE data_key = ? AND COALESCE(json_extract(value, '$.version'), 0) = ?
     RETURNING value`,
    JSON.stringify(compacted),
    key,
    Number.isSafeInteger(state.version) ? state.version : 0
  );
  if (!saved) return readSiteValue(env, key);

  const persistedState = JSON.parse(saved.value);
  await publishAuctionUpdate(env, season, {
    type: 'auction-state',
    state: publicAuctionState(persistedState)
  }, executionContext);
  return persistedState;
};

const randomBytes = (size) => crypto.getRandomValues(new Uint8Array(size));
const toHex = (bytes) => [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
const fromHex = (hex) => {
  if (typeof hex !== 'string' || !/^(?:[0-9a-f]{2})+$/i.test(hex)) {
    throw new Error('Stored binary data is invalid.');
  }
  return Uint8Array.from(hex.match(/.{2}/g), (byte) => Number.parseInt(byte, 16));
};
const toBase64Url = (bytes) => btoa(String.fromCharCode(...bytes))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromBase64Url = (value) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - base64.length % 4) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const passwordHash = async (password, salt = randomBytes(16)) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PASSWORD_ITERATIONS },
    key,
    256
  ));
  return { salt: toHex(salt), hash: toHex(hash) };
};

const verifyPassword = async (password, user) => {
  if (!user.salt || !user.password_hash || user.password_hash === 'supabase-auth') return false;
  const { hash } = await passwordHash(password, fromHex(user.salt));
  const actual = fromHex(hash);
  const expected = fromHex(user.password_hash);
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ expected[index];
  return difference === 0;
};

const loadSessionSecret = async (env) => {
  let row = await first(env, "SELECT secret_value FROM npl_app_secrets WHERE secret_key = 'session-signing'");
  if (!row) {
    await run(
      env,
      "INSERT OR IGNORE INTO npl_app_secrets (secret_key, secret_value) VALUES ('session-signing', ?)",
      randomBytes(48)
    );
    row = await first(env, "SELECT secret_value FROM npl_app_secrets WHERE secret_key = 'session-signing'");
  }
  if (!row?.secret_value) throw new Error('Could not initialize the admin session signing key.');
  return new Uint8Array(row.secret_value);
};

const signSession = async (user, secret) => {
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify({
    adminId: user.admin_id,
    authVersion: user.auth_version || 0,
    expiresAt: Date.now() + SESSION_SECONDS * 1000
  })));
  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
  return `${payload}.${toBase64Url(signature)}`;
};

const sessionPayload = async (request, secret) => {
  const cookie = request.headers.get('Cookie')?.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!cookie) return null;
  const [payload, signature] = cookie.slice(SESSION_COOKIE.length + 1).split('.');
  if (!payload || !signature) return null;
  try {
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('HMAC', key, fromBase64Url(signature), new TextEncoder().encode(payload));
    if (!valid) return null;
    const session = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
};

const publicUser = (user) => ({ adminId: user.admin_id, role: user.role });
const getUser = async (request, env, secret) => {
  const session = await sessionPayload(request, secret);
  if (!session || typeof session.adminId !== 'string') return null;
  const user = await first(
    env,
    'SELECT admin_id, role, email, created_at, salt, password_hash, auth_version FROM npl_admin_users WHERE admin_id = ?',
    session.adminId
  );
  return user && (user.auth_version || 0) === (session.authVersion || 0) ? user : null;
};
const createCookie = (token, secure) =>
  `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}${secure ? '; Secure' : ''}`;
const clearCookie = (secure) =>
  `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure ? '; Secure' : ''}`;
const readJson = async (request) => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};
const allowedMediaKey = (key) => allowedMediaKeys.has(key) || mediaKeyPattern.test(key);
const validAdminId = (adminId) => /^[a-z0-9._-]{3,32}$/.test(adminId);
const validEmail = (email) => typeof email === 'string' && email.length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getRateKey = async (request, prefix) => {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip)));
  return `${prefix}:${toHex(digest)}`;
};

const checkRateLimit = async (env, rateKey, limit, windowSeconds) => {
  const now = Math.floor(Date.now() / 1000);
  const row = await first(
    env,
    `INSERT INTO npl_api_rate_limits (rate_key, window_started_at, attempt_count)
     VALUES (?, ?, 1)
     ON CONFLICT(rate_key) DO UPDATE SET
       attempt_count = CASE
         WHEN ? - window_started_at >= ? THEN 1
         ELSE attempt_count + 1
       END,
       window_started_at = CASE
         WHEN ? - window_started_at >= ? THEN ?
         ELSE window_started_at
       END
     RETURNING attempt_count`,
    rateKey,
    now,
    now,
    windowSeconds,
    now,
    windowSeconds,
    now
  );
  return row.attempt_count <= limit;
};

const initializeOwner = async (env, password) => {
  let owner = await first(env, 'SELECT * FROM npl_admin_users WHERE admin_id = ?', 'developer');
  if (owner) return owner;
  const initialPassword = env.NPL_INITIAL_OWNER_PASSWORD;
  if (typeof initialPassword !== 'string' || initialPassword.length < 16) {
    throw new Error('Set NPL_INITIAL_OWNER_PASSWORD to a unique password of at least 16 characters in .dev.vars or Cloudflare Pages secrets.');
  }
  if (password !== initialPassword) return null;
  const credentials = await passwordHash(initialPassword);
  await run(
    env,
    `INSERT OR IGNORE INTO npl_admin_users (admin_id, role, salt, password_hash)
     VALUES ('developer', 'owner', ?, ?)`,
    credentials.salt,
    credentials.hash
  );
  owner = await first(env, 'SELECT * FROM npl_admin_users WHERE admin_id = ?', 'developer');
  return owner;
};

const listRegistrations = (env) => all(
  env,
  'SELECT value FROM npl_auction_registrations ORDER BY created_at DESC, rowid DESC'
).then(async (rows) => Promise.all(rows.map(async (row) => {
  const registration = JSON.parse(row.value);
  const photo = await ensureAuctionPlayerPhoto(env, registration.id, registration.photo, true);
  if (photo !== registration.photo) {
    registration.photo = photo;
    await run(env, 'UPDATE npl_auction_registrations SET value = ? WHERE registration_id = ?',
      JSON.stringify(registration), registration.id);
  }
  return registration;
})));

const saveAuctionPlayerPhoto = async (env, playerId, photo, maxBytes = MAX_AUCTION_PHOTO_BYTES) => {
  if (!photo) return '';
  if (typeof playerId !== 'string' || !/^[A-Za-z0-9._:-]{1,120}$/.test(playerId)) {
    throw new Error('Player registration ID is invalid.');
  }
  if (photo.startsWith('/api/media/auction-player-photo%3A')) return photo;
  const match = photo.match(AUCTION_PHOTO_PATTERN);
  if (!match) throw new Error('Player photo must be a supported JPEG, PNG, WebP, or GIF image.');
  if (auctionPhotoByteLength(match[2]) > maxBytes) {
    throw new Error(`Player photos must be ${Math.floor(maxBytes / 1024)} KB or smaller.`);
  }

  const mediaKey = `auction-player-photo:${playerId}`;
  const bytes = Uint8Array.from(atob(match[2]), (character) => character.charCodeAt(0));
  const chunkCount = Math.ceil(bytes.length / MEDIA_CHUNK_SIZE);
  const statements = [
    database(env).prepare('DELETE FROM npl_media_chunks WHERE media_key = ?').bind(mediaKey),
    database(env).prepare(
      `INSERT INTO npl_media (media_key, content_type, chunk_count)
       VALUES (?, ?, ?)
       ON CONFLICT(media_key) DO UPDATE SET
         content_type = excluded.content_type, chunk_count = excluded.chunk_count, updated_at = CURRENT_TIMESTAMP`
    ).bind(mediaKey, `image/${match[1]}`, chunkCount)
  ];
  for (let index = 0; index < chunkCount; index += 1) {
    statements.push(database(env).prepare(
      'INSERT INTO npl_media_chunks (media_key, chunk_index, content) VALUES (?, ?, ?)'
    ).bind(mediaKey, index, bytes.slice(index * MEDIA_CHUNK_SIZE, (index + 1) * MEDIA_CHUNK_SIZE)));
  }
  await database(env).batch(statements);
  return `/api/media/${encodeURIComponent(mediaKey)}?v=${toBase64Url(randomBytes(8))}`;
};

const ensureAuctionPlayerPhoto = async (env, playerId, photo, allowLegacyLarge = false) => {
  if (!playerId || typeof photo !== 'string' || !photo) return '';
  if (photo.startsWith('/api/media/auction-player-photo%3A')) return photo;

  let photoData = photo;
  if (photo.startsWith('/api/auction/player-photo?')) {
    const registration = await first(
      env,
      'SELECT value FROM npl_auction_registrations WHERE registration_id = ?',
      playerId
    );
    photoData = registration ? JSON.parse(registration.value).photo : '';
  }
  if (!photoData?.startsWith('data:image/')) return photoData;
  return saveAuctionPlayerPhoto(
    env,
    playerId,
    photoData,
    allowLegacyLarge ? 8 * 1024 * 1024 : MAX_AUCTION_PHOTO_BYTES
  );
};

const saveMedia = async (env, mediaKey, image) => {
  const bytes = new Uint8Array(await image.arrayBuffer());
  const chunkCount = Math.ceil(bytes.length / MEDIA_CHUNK_SIZE);
  const statements = [
    database(env).prepare('DELETE FROM npl_media_chunks WHERE media_key = ?').bind(mediaKey),
    database(env).prepare(
      `INSERT INTO npl_media (media_key, content_type, chunk_count)
       VALUES (?, ?, ?)
       ON CONFLICT(media_key) DO UPDATE SET
         content_type = excluded.content_type, chunk_count = excluded.chunk_count, updated_at = CURRENT_TIMESTAMP`
    ).bind(mediaKey, image.type, chunkCount)
  ];
  for (let index = 0; index < chunkCount; index += 1) {
    statements.push(database(env).prepare(
      'INSERT INTO npl_media_chunks (media_key, chunk_index, content) VALUES (?, ?, ?)'
    ).bind(mediaKey, index, bytes.slice(index * MEDIA_CHUNK_SIZE, (index + 1) * MEDIA_CHUNK_SIZE)));
  }
  await database(env).batch(statements);
  const mediaUrl = `/api/media/${encodeURIComponent(mediaKey)}?v=${toBase64Url(randomBytes(8))}`;
  await run(
    env,
    `INSERT INTO npl_site_data (data_key, value) VALUES ('site-media', ?)
     ON CONFLICT(data_key) DO UPDATE SET
       value = json_patch(npl_site_data.value, excluded.value), updated_at = CURRENT_TIMESTAMP`,
    JSON.stringify({ [mediaKey]: mediaUrl })
  );
  return mediaUrl;
};

const apiRequest = async (request, env, executionContext) => {
  database(env);
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = request.method.toUpperCase();
  const secure = url.protocol === 'https:';

  if (method === 'GET' && path === '/api/admin/session') {
    const secret = await loadSessionSecret(env);
    const user = await getUser(request, env, secret);
    return json({ user: user ? publicUser(user) : null });
  }

  if (method === 'GET' && path === '/api/site-media') {
    return json({ ...staticSiteMedia, ...(await readSiteValue(env, 'site-media') || {}) });
  }

  if (method === 'GET' && path === '/api/site-data') {
    const stored = await readSiteValue(env, 'public-content');
    return json(stored ? mergeOfficialSession5Content(
      mergeOfficialSession4Content(
        mergeOfficialSession3Content(
          mergeOfficialSession2Content(mergeOfficialSession1Content(stored))
        )
      )
    ) : null);
  }

  if (method === 'GET' && path.startsWith('/api/media/')) {
    const mediaKey = decodeURIComponent(path.slice('/api/media/'.length));
    const media = await first(env, 'SELECT content_type, chunk_count FROM npl_media WHERE media_key = ?', mediaKey);
    if (!media) return new Response(null, { status: 404 });
    const bytes = new Uint8Array(media.chunk_count * MEDIA_CHUNK_SIZE);
    let length = 0;
    for (let index = 0; index < media.chunk_count; index += 1) {
      const chunk = await first(
        env,
        'SELECT content FROM npl_media_chunks WHERE media_key = ? AND chunk_index = ?',
        mediaKey,
        index
      );
      if (!chunk?.content) throw new Error('Uploaded media is incomplete in D1.');
      const data = new Uint8Array(chunk.content);
      bytes.set(data, length);
      length += data.length;
    }
    return new Response(bytes.slice(0, length), {
      headers: {
        'Cache-Control': mediaKey.startsWith('auction-player-photo:')
          ? 'public, max-age=3600, stale-while-revalidate=86400'
          : 'no-store',
        'Content-Type': media.content_type,
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }

  if (method === 'GET' && path === '/api/auction/live') {
    const season = url.searchParams.get('season')?.trim() || '';
    if (!season || season.length > 60) return errorResponse('Choose a valid auction season.', 400);
    const state = await readSiteValue(env, `auction-live:${season}`);
    return json({ state: publicAuctionState(await compactStoredAuction(env, season, state, executionContext)) });
  }

  if (method === 'GET' && path === '/api/auction/live/ws') {
    const season = url.searchParams.get('season')?.trim() || '';
    if (!season || season.length > 60) return errorResponse('Choose a valid auction season.', 400);
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return errorResponse('A WebSocket connection is required.', 426);
    }
    if (!env.AUCTION_ROOMS) throw new Error('The Cloudflare Durable Object binding "AUCTION_ROOMS" is not configured.');
    const roomId = env.AUCTION_ROOMS.idFromName(season);
    return env.AUCTION_ROOMS.get(roomId).fetch(
      new Request(`https://auction-room/connect?season=${encodeURIComponent(season)}`, request)
    );
  }

  if (method === 'POST' && path === '/api/auction-registrations') {
    const rateKey = await getRateKey(request, 'registration');
    if (!await checkRateLimit(env, rateKey, 5, 3600)) {
      return errorResponse('Too many registrations. Try again later.', 429);
    }
    const body = await readJson(request);
    const seasonEdition = typeof body?.season === 'string' ? body.season.trim() : '';
    const publicContent = await readSiteValue(env, 'public-content');
    const season = publicContent?.seasons?.find((item) => item.edition === seasonEdition);
    const year = String(season?.year || season?.season || new Date().getFullYear()).replace(/\D/g, '').slice(0, 4);
    let registration;
    try {
      registration = createPublicRegistration(body, season, {
        id: `reg-${crypto.randomUUID()}`,
        registrationId: `NPL${year || new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
      });
    } catch (error) {
      if (error instanceof PlayerRegistrationError) return errorResponse(error.message, error.status);
      throw error;
    }
    let playerPhoto = '';
    try {
      playerPhoto = await saveAuctionPlayerPhoto(env, registration.id, registration.photo || '');
    } catch (error) {
      return errorResponse(error.message, 400);
    }
    registration.photo = playerPhoto;
    await run(
      env,
      `INSERT INTO npl_auction_registrations (registration_id, value, created_at)
       VALUES (?, ?, ?)`,
      registration.id,
      JSON.stringify(registration),
      Date.now()
    );
    return json({ id: registration.id, registrationId: registration.registrationId, status: registration.status }, 201);
  }

  if (method === 'POST' && path === '/api/auction-registrations/status') {
    const rateKey = await getRateKey(request, 'registration-status');
    if (!await checkRateLimit(env, rateKey, 10, 600)) {
      return errorResponse('Too many status checks. Try again later.', 429);
    }
    const body = await readJson(request);
    const registrationId = typeof body?.registrationId === 'string' ? body.registrationId.trim().toUpperCase() : '';
    const phone = typeof body?.phone === 'string' ? body.phone.replace(/\D/g, '') : '';
    if (!registrationId || registrationId.length > 40 || phone.length < 7 || phone.length > 15) {
      return errorResponse('Enter a valid registration ID and mobile number.', 400);
    }
    const row = await first(
      env,
      "SELECT value FROM npl_auction_registrations WHERE json_extract(value, '$.registrationId') = ?",
      registrationId
    );
    const registration = row ? JSON.parse(row.value) : null;
    if (!matchesRegistrationIdentity(registration, registrationId, phone)) {
      return errorResponse('No registration matches those details.', 404);
    }
    return json({
      registrationId: registration.registrationId,
      season: registration.season,
      status: registration.status
    });
  }

  if (method === 'POST' && path === '/api/admin/login') {
    const rateKey = await getRateKey(request, 'login');
    if (!await checkRateLimit(env, rateKey, 8, 900)) {
      return errorResponse('Too many sign-in attempts. Try again in 15 minutes.', 429);
    }
    const body = await readJson(request);
    const adminId = typeof body?.adminId === 'string' ? body.adminId.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!adminId || !password) return errorResponse('Enter your admin ID and password.', 400);
    let user = await first(env, 'SELECT * FROM npl_admin_users WHERE admin_id = ?', adminId);
    if (!user && adminId === 'developer') user = await initializeOwner(env, password);
    if (!user || !await verifyPassword(password, user)) {
      return errorResponse('Invalid admin ID or password.', 401);
    }
    await run(env, 'DELETE FROM npl_api_rate_limits WHERE rate_key = ?', rateKey);
    const secret = await loadSessionSecret(env);
    return json({ user: publicUser(user) }, 200, {
      'Set-Cookie': createCookie(await signSession(user, secret), secure)
    });
  }

  if (method === 'POST' && path === '/api/admin/logout') {
    return new Response(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store', 'Set-Cookie': clearCookie(secure) }
    });
  }

  const secret = await loadSessionSecret(env);
  const user = await getUser(request, env, secret);
  const requireAdmin = () => !user
    ? errorResponse('Sign in required.', 401)
    : user.role === 'owner' || user.role === 'admin'
      ? null
      : errorResponse('Administrator permission required.', 403);
  const requireOwner = () => user?.role === 'owner'
    ? null
    : errorResponse(user ? 'Only the developer owner can manage admin accounts.' : 'Sign in required.', user ? 403 : 401);

  if (method === 'GET' && path === '/api/admin/auction/audit') {
    const denied = requireAdmin();
    if (denied) return denied;
    const season = url.searchParams.get('season')?.trim() || '';
    if (!season || season.length > 60) return errorResponse('Choose a valid auction season.', 400);
    const state = await readSiteValue(env, `auction-live:${season}`);
    return json({ entries: state?.auditLog || [] });
  }

  if (method === 'GET' && path === '/api/matches/live/ws') {
    const season = url.searchParams.get('season')?.trim() || '';
    if (!season || season.length > 60) return errorResponse('Choose a valid scoring season.', 400);
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return errorResponse('A WebSocket connection is required.', 426);
    }
    if (!env.AUCTION_ROOMS) throw new Error('The Cloudflare Durable Object binding "AUCTION_ROOMS" is not configured.');
    const matchId = url.searchParams.get('matchId')?.trim() || '';
    if (matchId && !/^[A-Za-z0-9._:-]{1,120}$/.test(matchId)) {
      return errorResponse('Choose a valid match.', 400);
    }
    const channel = matchId ? 'scoring-match' : 'scoring';
    const roomId = env.AUCTION_ROOMS.idFromName(matchId ? `scoring-match:${matchId}` : `scoring:${season}`);
    return env.AUCTION_ROOMS.get(roomId).fetch(
      new Request(`https://scoring-room/connect?channel=${channel}&matchId=${encodeURIComponent(matchId)}&season=${encodeURIComponent(season)}`, request)
    );
  }

  const liveScoringResponse = await handleLiveScoringApi({ request, env, url, path, method, user });
  if (liveScoringResponse) return liveScoringResponse;

  if (method === 'POST' && path === '/api/admin/password') {
    const denied = requireAdmin();
    if (denied) return denied;
    const body = await readJson(request);
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';
    if (newPassword.length < 6) return errorResponse('New password must be at least 6 characters.', 400);
    const credentials = await passwordHash(newPassword);
    const update = await run(
      env,
      `UPDATE npl_admin_users SET salt = ?, password_hash = ?,
       auth_version = auth_version + 1, password_changed_at = CURRENT_TIMESTAMP
       WHERE admin_id = ?`,
      credentials.salt,
      credentials.hash,
      user.admin_id
    );
    if (!update.meta.changes) return errorResponse('Admin account not found.', 404);
    const updatedUser = { ...user, ...credentials, auth_version: user.auth_version + 1 };
    return json({ user: publicUser(updatedUser) }, 200, {
      'Set-Cookie': createCookie(await signSession(updatedUser, secret), secure)
    });
  }

  if (method === 'GET' && path === '/api/admin/users') {
    const denied = requireOwner();
    if (denied) return denied;
    const users = await all(env, 'SELECT admin_id, role, email, created_at FROM npl_admin_users ORDER BY created_at ASC');
    return json({ users: users.map((account) => ({
      ...publicUser(account),
      email: account.email,
      createdAt: account.created_at
    })) });
  }

  if (method === 'POST' && path === '/api/admin/users') {
    const denied = requireOwner();
    if (denied) return denied;
    const body = await readJson(request);
    const adminId = typeof body?.adminId === 'string' ? body.adminId.trim().toLowerCase() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const role = body?.role === 'scorer' ? 'scorer' : body?.role === 'admin' || body?.role === undefined
      ? 'admin'
      : '';
    if (!validAdminId(adminId)) {
      return errorResponse('Admin ID must be 3-32 letters, numbers, dots, underscores, or hyphens.', 400);
    }
    if (!role) return errorResponse('Choose administrator or scorer access.', 400);
    if (!validEmail(email)) return errorResponse('Enter a valid email address for this admin.', 400);
    if (password.length < 6) return errorResponse('Password must be at least 6 characters.', 400);
    const existing = await first(
      env,
      'SELECT admin_id FROM npl_admin_users WHERE admin_id = ? OR lower(email) = ?',
      adminId,
      email
    );
    if (existing) return errorResponse('That admin ID or email address is already in use.', 409);
    const credentials = await passwordHash(password);
    const created = await run(
      env,
      `INSERT OR IGNORE INTO npl_admin_users (admin_id, role, email, salt, password_hash)
       VALUES (?, ?, ?, ?, ?)`,
      adminId,
      role,
      email,
      credentials.salt,
      credentials.hash
    );
    if (!created.meta.changes) return errorResponse('That admin ID or email address is already in use.', 409);
    return json({ user: { adminId, role } }, 201);
  }

  const resetMatch = path.match(/^\/api\/admin\/users\/([^/]+)\/password$/);
  if (method === 'POST' && resetMatch) {
    const denied = requireOwner();
    if (denied) return denied;
    const adminId = decodeURIComponent(resetMatch[1]);
    const body = await readJson(request);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';
    if (!validEmail(email)) return errorResponse('Enter a valid email address for this admin.', 400);
    if (newPassword.length < 6) return errorResponse('New password must be at least 6 characters.', 400);
    const account = await first(env, 'SELECT admin_id, role FROM npl_admin_users WHERE admin_id = ?', adminId);
    if (!account) return errorResponse('Admin account not found.', 404);
    if (account.role === 'owner') return errorResponse('Use the owner password form to change the developer password.', 400);
    const emailInUse = await first(
      env,
      'SELECT admin_id FROM npl_admin_users WHERE lower(email) = ? AND admin_id != ?',
      email,
      adminId
    );
    if (emailInUse) return errorResponse('That email address is already assigned to another admin.', 409);
    const credentials = await passwordHash(newPassword);
    await run(
      env,
      `UPDATE npl_admin_users SET email = ?, salt = ?, password_hash = ?,
       auth_version = auth_version + 1, password_changed_at = CURRENT_TIMESTAMP
       WHERE admin_id = ?`,
      email,
      credentials.salt,
      credentials.hash,
      adminId
    );
    return json({ success: true });
  }

  if (method === 'PUT' && path === '/api/admin/site-data') {
    const denied = requireAdmin();
    if (denied) return denied;
    const body = await readJson(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return errorResponse('Site content must be an object.', 400);
    }
    await setSiteValue(env, 'public-content', body);
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  }

  if (method === 'GET' && path === '/api/admin/registrations') {
    const denied = requireAdmin();
    if (denied) return denied;
    return json({ registrations: await listRegistrations(env) });
  }

  if (method === 'PUT' && path === '/api/admin/registrations') {
    const denied = requireAdmin();
    if (denied) return denied;
    const body = await readJson(request);
    if (!Array.isArray(body?.registrations)) return errorResponse('Registrations must be a list.', 400);
    let storedRegistrations;
    try {
      storedRegistrations = await Promise.all(body.registrations.map(async (registration) => ({
        ...registration,
        photo: await ensureAuctionPlayerPhoto(env, registration.id, registration.photo)
      })));
    } catch (error) {
      return errorResponse(error.message, 400);
    }
    const registrations = JSON.stringify(storedRegistrations);
    await database(env).batch([
      database(env).prepare('DELETE FROM npl_auction_registrations'),
      database(env).prepare(
        `INSERT OR REPLACE INTO npl_auction_registrations (registration_id, value, created_at)
         SELECT json_extract(value, '$.id'), value,
           CAST(strftime('%s', 'now') AS INTEGER) * 1000 + json_array_length(?) - CAST(key AS INTEGER)
         FROM json_each(?)
         WHERE json_type(value, '$.id') = 'text'`
      ).bind(registrations, registrations)
    ]);
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  }

  if (method === 'POST' && path === '/api/admin/auction/bid') {
    const denied = requireAdmin();
    if (denied) return denied;
    const body = await readJson(request);
    const season = typeof body?.season === 'string' ? body.season.trim() : '';
    if (!season || season.length > 60) return errorResponse('Choose a valid auction season.', 400);

    const publicContent = await readSiteValue(env, 'public-content');
    const team = publicContent?.teams?.find((item) => item.id === body.teamId);
    if (!isAuctionTeamEligible(team, season)) {
      return errorResponse('Choose an active franchise assigned to this auction season.', 409);
    }

    const key = `auction-live:${season}`;
    let persistedState;
    try {
      persistedState = await commitAuctionBid({
        readState: () => readSiteValue(env, key),
        bid: { ...body, teamName: team.name },
        actor: publicUser(user),
        compareAndSet: async (nextState, expectedVersion) => {
          const saved = await first(
            env,
            `UPDATE npl_site_data SET value = ?, updated_at = CURRENT_TIMESTAMP
             WHERE data_key = ? AND COALESCE(json_extract(value, '$.version'), 0) = ?
             RETURNING value`,
            JSON.stringify(nextState),
            key,
            expectedVersion
          );
          return saved ? JSON.parse(saved.value) : null;
        }
      });
    } catch (error) {
      if (!(error instanceof AuctionBidError)) throw error;
      return json({
        error: error.message,
        bid: error.state ? auctionBidSnapshot(error.state) : null
      }, error.status);
    }

    await publishAuctionUpdate(env, season, {
      type: 'auction-bid',
      bid: auctionBidSnapshot(persistedState)
    }, executionContext);
    return json({ bid: auctionBidSnapshot(persistedState) });
  }

  if (method === 'PUT' && path === '/api/admin/auction/live') {
    const denied = requireAdmin();
    if (denied) return denied;
    const body = await readJson(request);
    const { season, state, expectedUpdatedAt } = body || {};
    if (typeof season !== 'string' || !season.trim() || season.length > 60) {
      return errorResponse('Choose a valid auction season.', 400);
    }
    if (!state || typeof state !== 'object' || Array.isArray(state) ||
      !['waiting', 'live', 'paused', 'completed'].includes(state.status) ||
      !Number.isSafeInteger(state.currentBid) || state.currentBid < 0 ||
      !(state.currentBiddingTeam === null || typeof state.currentBiddingTeam === 'string') ||
      !(state.currentPlayer === null || (typeof state.currentPlayer === 'object' && !Array.isArray(state.currentPlayer))) ||
      (state.currentPlayer && (typeof state.currentPlayer.id !== 'string' ||
        !(typeof state.currentPlayer.fullName === 'string' || typeof state.currentPlayer.name === 'string'))) ||
      !Array.isArray(state.bidHistory) || state.bidHistory.length > 100 ||
      !Array.isArray(state.soldPlayers) || state.soldPlayers.length > 500 ||
      !Array.isArray(state.unsoldPlayers) || state.unsoldPlayers.length > 500 ||
      !state.teamPurses || typeof state.teamPurses !== 'object' || Array.isArray(state.teamPurses) ||
      (state.teamPurseCaps !== undefined &&
        (!state.teamPurseCaps || typeof state.teamPurseCaps !== 'object' || Array.isArray(state.teamPurseCaps) ||
          Object.values(state.teamPurseCaps).some((purse) => !Number.isSafeInteger(purse) || purse <= 0))) ||
      (state.purseCap !== undefined && (!Number.isSafeInteger(state.purseCap) || state.purseCap <= 0)) ||
      (state.minimumBidIncrement !== undefined && (!Number.isSafeInteger(state.minimumBidIncrement) || state.minimumBidIncrement <= 0)) ||
      (state.minimumBidIncrement ?? 100) > (state.purseCap ?? 5000000) ||
      (state.maxSquadSize !== undefined && (!Number.isSafeInteger(state.maxSquadSize) || state.maxSquadSize < 1 || state.maxSquadSize > 30)) ||
      Object.values(state.teamPurses).some((purse) => !Number.isSafeInteger(purse) || purse < 0)) {
      return errorResponse('Auction state is invalid.', 400);
    }
    const currentPlayer = state.currentPlayer ? Object.fromEntries(
      ['id', 'registrationId', 'fullName', 'name', 'role', 'basePrice']
        .filter((key) => typeof state.currentPlayer[key] === 'string')
        .map((key) => [key, state.currentPlayer[key].slice(0, 2000)])
    ) : null;
    if (typeof state.currentPlayer?.photo === 'string' &&
      state.currentPlayer.photo.length <= 8 * 1024 * 1024 &&
      (state.currentPlayer.photo.startsWith('/uploads/') ||
        state.currentPlayer.photo.startsWith('/assets/') ||
        state.currentPlayer.photo.startsWith('/api/auction/player-photo?') ||
        isAuctionPlayerPhotoUrl(state.currentPlayer.photo) ||
        /^https?:\/\/[^/]+\/.{1,2048}$/i.test(state.currentPlayer.photo))) {
      currentPlayer.photo = state.currentPlayer.photo;
    }
    const safeState = {
      status: state.status,
      purseCap: state.purseCap ?? 5000000,
      minimumBidIncrement: state.minimumBidIncrement ?? 100,
      maxSquadSize: state.maxSquadSize ?? 13,
      currentPlayer,
      currentBid: state.currentBid,
      currentBiddingTeam: state.currentBiddingTeam,
      bidHistory: state.bidHistory.slice(0, 100).map((bid) => ({
        team: typeof bid.team === 'string' ? bid.team.slice(0, 120) : '',
        amount: Number.isSafeInteger(bid.amount) && bid.amount >= 0 ? bid.amount : 0,
        time: typeof bid.time === 'string' ? bid.time.slice(0, 40) : ''
      })),
      soldPlayers: state.soldPlayers.slice(0, 500),
      unsoldPlayers: state.unsoldPlayers.slice(0, 500),
      teamPurses: state.teamPurses,
      teamPurseCaps: state.teamPurseCaps || {}
    };
    const key = `auction-live:${season.trim()}`;
    const currentState = await readSiteValue(env, key);
    try {
      Object.assign(safeState, auditAuctionTransition(
        currentState || {
          status: safeState.status,
          purseCap: safeState.purseCap,
          minimumBidIncrement: safeState.minimumBidIncrement,
          maxSquadSize: safeState.maxSquadSize,
          currentPlayer: null,
          soldPlayers: [],
          unsoldPlayers: [],
          teamPurses: {},
          teamPurseCaps: {},
          auditLog: []
        },
        safeState,
        { actor: publicUser(user), exceptionReason: body.exceptionReason }
      ));
    } catch (error) {
      if (error instanceof AuctionBidError) return errorResponse(error.message, error.status);
      throw error;
    }
    safeState.version = (Number.isSafeInteger(currentState?.version) ? currentState.version : 0) + 1;
    safeState.updatedAt = new Date().toISOString();
    const saved = await first(
      env,
      `INSERT INTO npl_site_data (data_key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(data_key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
       WHERE json_extract(npl_site_data.value, '$.updatedAt') IS ?
       RETURNING value`,
      key,
      JSON.stringify(safeState),
      expectedUpdatedAt || null
    );
    if (!saved) {
      return json({
        error: 'The live auction changed in another session. Refreshing its latest state.',
        state: await readSiteValue(env, key)
      }, 409);
    }
    const persistedState = JSON.parse(saved.value);
    await publishAuctionUpdate(env, season.trim(), {
      type: 'auction-state',
      state: publicAuctionState(persistedState)
    }, executionContext);
    return json({ state: persistedState });
  }

  if (method === 'POST' && path === '/api/admin/media') {
    const denied = requireOwner();
    if (denied) return denied;
    const form = await request.formData();
    const mediaKey = typeof form.get('key') === 'string' ? form.get('key') : '';
    const image = form.get('image');
    if (!allowedMediaKey(mediaKey)) return errorResponse('Choose a supported site image slot.', 400);
    if (!(typeof File !== 'undefined' && image instanceof File) || image.size === 0) {
      return errorResponse('Choose an image to upload.', 400);
    }
    if (image.size > 8 * 1024 * 1024) return errorResponse('Images must be 8 MB or smaller.', 400);
    if (!mediaTypes.has(image.type)) return errorResponse('Choose a JPG, PNG, WebP, or GIF image.', 400);
    const mediaUrl = await saveMedia(env, mediaKey, image);
    return json({ key: mediaKey, url: mediaUrl }, 201);
  }

  const deleteMediaMatch = path.match(/^\/api\/admin\/media\/(.+)$/);
  if (method === 'DELETE' && deleteMediaMatch) {
    const denied = requireOwner();
    if (denied) return denied;
    const mediaKey = decodeURIComponent(deleteMediaMatch[1]);
    if (!allowedMediaKey(mediaKey)) return errorResponse('Choose a supported site image slot.', 400);
    await run(env, 'DELETE FROM npl_media WHERE media_key = ?', mediaKey);
    await run(
      env,
      `UPDATE npl_site_data SET value = json_remove(value, ?), updated_at = CURRENT_TIMESTAMP
       WHERE data_key = 'site-media'`,
      `$."${mediaKey}"`
    );
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  }

  return errorResponse('API endpoint not found.', 404);
};

export async function onRequest(context) {
  const { request, env } = context;
  if (!new URL(request.url).pathname.startsWith('/api/')) {
    return errorResponse('API endpoint not found.', 404);
  }
  try {
    return await apiRequest(request, env, context);
  } catch (error) {
    console.error('Cloudflare NPL API request failed:', error);
    const message = error instanceof Error ? error.message : 'Unexpected API error.';
    const status = message.includes('D1 binding "DB" is not configured') ? 503 : 500;
    return errorResponse(status === 503 ? message : 'The API could not complete the request.', status);
  }
}
