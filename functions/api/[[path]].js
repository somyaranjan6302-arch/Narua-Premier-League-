import { mergeOfficialSession1Content } from '../../src/data/session1Performers.js';
import { mergeOfficialSession2Content } from '../../src/data/session2Data.js';
import { mergeOfficialSession3Content } from '../../src/data/session3Data.js';
import { mergeOfficialSession4Content } from '../../src/data/session4Data.js';
import { mergeOfficialSession5Content } from '../../src/data/session5Data.js';
import staticSiteMedia from '../../public/site-media.json';

const SESSION_COOKIE = 'npl_admin_session';
const SESSION_SECONDS = 8 * 60 * 60;
const mediaTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const mediaKeyPattern = /^(news|champion|team-logo|team|match-banner|gallery|memory-photo|highlight|performer|featured-performer|player-photo|section-photo|record):[A-Za-z0-9 ._-]{1,80}$/;
const allowedMediaKeys = new Set(['logo', 'trophy', 'stadium']);

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

const db = async (env, resource, { method = 'GET', body, prefer } = {}) => {
  const base = env.SUPABASE_URL?.replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key || new URL(base).protocol !== 'https:') {
    throw new Error('Cloudflare API is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  const url = new URL(`${base}/rest/v1/${resource}`);
  const headers = new Headers({
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: 'application/json'
  });
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (prefer) headers.set('Prefer', prefer);

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${details.slice(0, 500)}`);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const rpc = (env, name, parameters) => db(env, `rpc/${name}`, {
  method: 'POST',
  body: parameters
});

const supabaseAuthAdmin = async (env, endpoint, method, body) => {
  const base = env.SUPABASE_URL?.replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key || new URL(base).protocol !== 'https:') {
    throw new Error('Cloudflare API is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  const response = await fetch(`${base}/auth/v1/${endpoint}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  const result = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`Supabase Auth request failed (${response.status}): ${result?.msg || result?.message || result?.error_description || text}`);
  }
  return result;
};

const createAuthUser = async (env, adminId, email, password) => {
  const result = await supabaseAuthAdmin(env, 'admin/users', 'POST', {
    email,
    password,
    email_confirm: true,
    user_metadata: { npl_admin_id: adminId }
  });
  const authUser = result?.user || result;
  if (!authUser?.id) throw new Error('Supabase Auth did not return the new admin user ID.');
  return authUser;
};

const updateAuthUser = (env, authUserId, body) => supabaseAuthAdmin(
  env,
  `admin/users/${encodeURIComponent(authUserId)}`,
  'PUT',
  body
);

const signInAuthUser = async (env, email, password) => {
  const base = env.SUPABASE_URL?.replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key || new URL(base).protocol !== 'https:') {
    throw new Error('Cloudflare API is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  const response = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (response.status === 400 || response.status === 401) return null;
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase sign-in failed (${response.status}): ${text.slice(0, 500)}`);
  }
  return text ? JSON.parse(text) : null;
};

const getSiteValue = async (env, key) => {
  const rows = await db(env, `npl_site_data?data_key=eq.${encodeURIComponent(key)}&select=value&limit=1`);
  return rows[0]?.value ?? null;
};

const setSiteValue = async (env, key, value) => {
  await db(env, 'npl_site_data?on_conflict=data_key', {
    method: 'POST',
    body: { data_key: key, value },
    prefer: 'resolution=merge-duplicates,return=minimal'
  });
};

const randomBytes = (size) => crypto.getRandomValues(new Uint8Array(size));
const toHex = (bytes) => [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
const fromHex = (hex) => {
  if (typeof hex !== 'string' || !/^(?:[0-9a-f]{2})+$/i.test(hex)) {
    throw new Error('Supabase returned an invalid binary value.');
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

const loadSessionSecret = async (env) => {
  const rows = await db(env, 'npl_app_secrets?secret_key=eq.session-signing&select=secret_value&limit=1');
  if (rows[0]?.secret_value) {
    const stored = rows[0].secret_value;
    return fromHex(stored.startsWith('\\x') ? stored.slice(2) : stored);
  }

  await db(env, 'npl_app_secrets?on_conflict=secret_key', {
    method: 'POST',
    body: { secret_key: 'session-signing', secret_value: `\\x${toHex(randomBytes(48))}` },
    prefer: 'resolution=ignore-duplicates,return=minimal'
  });
  const persisted = await db(env, 'npl_app_secrets?secret_key=eq.session-signing&select=secret_value&limit=1');
  if (!persisted[0]?.secret_value) throw new Error('Could not initialize the admin session signing key.');
  const stored = persisted[0].secret_value;
  return fromHex(stored.startsWith('\\x') ? stored.slice(2) : stored);
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

const currentUser = async (request, env, secret) => {
  const session = await sessionPayload(request, secret);
  if (!session || typeof session.adminId !== 'string') return null;
  const rows = await db(env, `npl_admin_users?admin_id=eq.${encodeURIComponent(session.adminId)}&select=admin_id,role,email,auth_user_id,created_at,auth_version&limit=1`);
  const user = rows[0];
  return user && (user.auth_version || 0) === (session.authVersion || 0) ? user : null;
};

const createCookie = (token) => `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}; Secure`;
const clearCookie = () => `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0; Secure`;
const publicUser = (user) => ({ adminId: user.admin_id, role: user.role });
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
const initializeOwner = async (env, password) => {
  const rows = await db(env, 'npl_admin_users?admin_id=eq.developer&select=admin_id,role,email,auth_user_id,auth_version&limit=1');
  const owner = rows[0];
  const initialPassword = env.NPL_INITIAL_OWNER_PASSWORD;
  if (!initialPassword || initialPassword.length < 16) {
    throw new Error('Set NPL_INITIAL_OWNER_PASSWORD to a unique password of at least 16 characters in Cloudflare.');
  }
  if (password !== initialPassword) return owner;
  const email = env.NPL_OWNER_EMAIL?.trim().toLowerCase();
  if (!validEmail(email)) {
    throw new Error('Set NPL_OWNER_EMAIL to a valid owner email address in Cloudflare.');
  }
  if (!owner) {
    const authUser = await createAuthUser(env, 'developer', email, initialPassword);
    try {
      const created = await db(env, 'npl_admin_users', {
        method: 'POST',
        body: {
          admin_id: 'developer',
          role: 'owner',
          email,
          auth_user_id: authUser.id,
          salt: '',
          password_hash: 'supabase-auth',
          auth_version: 0
        },
        prefer: 'return=representation'
      });
      return created[0];
    } catch (error) {
      await supabaseAuthAdmin(env, `admin/users/${encodeURIComponent(authUser.id)}`, 'DELETE');
      throw error;
    }
  }
  if (owner.role !== 'owner') throw new Error('The developer admin account does not have owner permissions.');
  if (owner.auth_user_id) {
    if (owner.email) return owner;
    await updateAuthUser(env, owner.auth_user_id, { email, email_confirm: true });
    const updated = await db(env, 'npl_admin_users?admin_id=eq.developer', {
      method: 'PATCH',
      body: { email, auth_version: (owner.auth_version || 0) + 1 },
      prefer: 'return=representation'
    });
    return updated[0] || { ...owner, email };
  }

  const authUser = await createAuthUser(env, 'developer', email, initialPassword);
  try {
    const updated = await db(env, 'npl_admin_users?admin_id=eq.developer', {
      method: 'PATCH',
      body: { email, auth_user_id: authUser.id, auth_version: (owner.auth_version || 0) + 1 },
      prefer: 'return=representation'
    });
    return updated[0] || { ...owner, email, auth_user_id: authUser.id };
  } catch (error) {
    await supabaseAuthAdmin(env, `admin/users/${encodeURIComponent(authUser.id)}`, 'DELETE');
    throw error;
  }
};

const listUsers = async (env) => db(
  env,
  'npl_admin_users?select=admin_id,role,email,created_at&order=created_at.asc'
);

const apiRequest = async (request, env) => {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = request.method.toUpperCase();

  if (method === 'GET' && path === '/api/admin/session') {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ user: null });
    const secret = await loadSessionSecret(env);
    const user = await currentUser(request, env, secret);
    return json({ user: user ? publicUser(user) : null });
  }

  if (method === 'GET' && path === '/api/site-media') {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json(staticSiteMedia);
    return json(await getSiteValue(env, 'site-media') || staticSiteMedia);
  }

  if (method === 'GET' && path === '/api/site-data') {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json(null);
    const stored = await getSiteValue(env, 'public-content');
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
    const rows = await db(env, `npl_media?media_key=eq.${encodeURIComponent(mediaKey)}&select=content_type,content&limit=1`);
    if (!rows[0]) return new Response(null, { status: 404 });
    const stored = rows[0].content;
    const binary = fromHex(stored.startsWith('\\x') ? stored.slice(2) : stored);
    return new Response(binary, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': rows[0].content_type,
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }

  if (method === 'GET' && path === '/api/auction/live') {
    const season = url.searchParams.get('season')?.trim() || '';
    if (!season || season.length > 60) return errorResponse('Choose a valid auction season.', 400);
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ state: null });
    return json({ state: await getSiteValue(env, `auction-live:${season}`) });
  }

  if (method === 'POST' && path === '/api/auction-registrations') {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return errorResponse('Player registration storage is not configured.', 503);
    }
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const ipDigest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip)));
    if (!await rpc(env, 'npl_cf_check_rate_limit', {
      p_rate_key: `registration:${toHex(ipDigest)}`,
      p_limit: 5,
      p_window_seconds: 3600
    })) {
      return errorResponse('Too many registrations. Try again later.', 429);
    }
    const body = await readJson(request);
    if (!body || typeof body !== 'object' || typeof body.id !== 'string' ||
      typeof body.fullName !== 'string' || typeof body.phone !== 'string' || body.consent !== true) {
      return errorResponse('Registration details are incomplete.', 400);
    }
    await rpc(env, 'npl_cf_register_player', { p_registration: body });
    return json({ id: body.id }, 201);
  }

  if (method === 'POST' && path === '/api/admin/login') {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const ipDigest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip)));
    const rateKey = `login:${toHex(ipDigest)}`;
    if (!await rpc(env, 'npl_cf_check_rate_limit', {
      p_rate_key: rateKey,
      p_limit: 8,
      p_window_seconds: 900
    })) {
      return errorResponse('Too many sign-in attempts. Try again in 15 minutes.', 429);
    }
    const body = await readJson(request);
    const adminId = typeof body?.adminId === 'string' ? body.adminId.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!adminId || !password) return errorResponse('Enter your admin ID and password.', 400);
    let rows = await db(env, `npl_admin_users?admin_id=eq.${encodeURIComponent(adminId)}&select=admin_id,role,email,auth_user_id,auth_version&limit=1`);
    let user = rows[0];
    if (adminId === 'developer' && (!user?.auth_user_id || !user.email)) {
      user = await initializeOwner(env, password);
      rows = user ? [user] : [];
    }
    user = rows[0];
    if (!user) return errorResponse('Invalid admin ID or password.', 401);
    if (!user.auth_user_id || !user.email) {
      return errorResponse('This account needs an email and new password from the developer owner before it can sign in on Cloudflare.', 401);
    }
    const authResult = await signInAuthUser(env, user.email, password);
    if (!authResult?.user?.id || authResult.user.id !== user.auth_user_id) {
      return errorResponse('Invalid admin ID or password.', 401);
    }
    await rpc(env, 'npl_cf_clear_rate_limit', { p_rate_key: rateKey });
    return json({ user: publicUser(user) }, 200, {
      'Set-Cookie': createCookie(await signSession(user, await loadSessionSecret(env)))
    });
  }

  if (method === 'POST' && path === '/api/admin/logout') {
    return new Response(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store', 'Set-Cookie': clearCookie() }
    });
  }

  const secret = await loadSessionSecret(env);
  const user = await currentUser(request, env, secret);
  const requireAdmin = () => user
    ? null
    : errorResponse('Sign in required.', 401);
  const requireOwner = () => user?.role === 'owner'
    ? null
    : errorResponse(user ? 'Only the developer owner can manage admin accounts.' : 'Sign in required.', user ? 403 : 401);

  if (method === 'POST' && path === '/api/admin/password') {
    const denied = requireAdmin();
    if (denied) return denied;
    const body = await readJson(request);
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';
    if (newPassword.length < 6) return errorResponse('New password must be at least 6 characters.', 400);
    if (!user.auth_user_id) return errorResponse('This account is not linked to Supabase Auth yet.', 409);
    await updateAuthUser(env, user.auth_user_id, { password: newPassword });
    const userRows = await db(env, `npl_admin_users?admin_id=eq.${encodeURIComponent(user.admin_id)}&select=auth_version&limit=1`);
    const authVersion = (userRows[0]?.auth_version || 0) + 1;
    await db(env, `npl_admin_users?admin_id=eq.${encodeURIComponent(user.admin_id)}`, {
      method: 'PATCH',
      body: { auth_version: authVersion, password_changed_at: new Date().toISOString() },
      prefer: 'return=minimal'
    });
    const updatedUser = { ...user, auth_version: authVersion };
    return json({ user: publicUser(updatedUser) }, 200, {
      'Set-Cookie': createCookie(await signSession(updatedUser, secret))
    });
  }

  if (method === 'GET' && path === '/api/admin/users') {
    const denied = requireOwner();
    if (denied) return denied;
    const users = await listUsers(env);
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
    if (!validAdminId(adminId)) {
      return errorResponse('Admin ID must be 3-32 letters, numbers, dots, underscores, or hyphens.', 400);
    }
    if (!validEmail(email)) return errorResponse('Enter a valid email address for this admin.', 400);
    if (password.length < 6) return errorResponse('Password must be at least 6 characters.', 400);
    const existing = await db(env, `npl_admin_users?admin_id=eq.${encodeURIComponent(adminId)}&select=admin_id&limit=1`);
    if (existing.length) return errorResponse('That admin ID is already in use.', 409);
    const authUser = await createAuthUser(env, adminId, email, password);
    let created;
    try {
      created = await db(env, 'npl_admin_users', {
        method: 'POST',
        body: {
          admin_id: adminId,
          role: 'admin',
          email,
          auth_user_id: authUser.id,
          salt: '',
          password_hash: 'supabase-auth'
        },
        prefer: 'return=representation'
      });
    } catch (error) {
      await supabaseAuthAdmin(env, `admin/users/${encodeURIComponent(authUser.id)}`, 'DELETE');
      throw error;
    }
    return json({ user: publicUser(created[0]) }, 201);
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
    const rows = await db(env, `npl_admin_users?admin_id=eq.${encodeURIComponent(adminId)}&select=admin_id,role,email,auth_user_id,auth_version&limit=1`);
    if (!rows[0]) return errorResponse('Admin account not found.', 404);
    if (rows[0].role === 'owner') return errorResponse('Use the owner password form to change the developer password.', 400);
    let authUserId = rows[0].auth_user_id;
    let createdAuthUserId;
    if (authUserId) {
      await updateAuthUser(env, authUserId, { email, email_confirm: true, password: newPassword });
    } else {
      const authUser = await createAuthUser(env, adminId, email, newPassword);
      authUserId = authUser.id;
      createdAuthUserId = authUser.id;
    }
    const authVersion = (rows[0].auth_version || 0) + 1;
    try {
      await db(env, `npl_admin_users?admin_id=eq.${encodeURIComponent(adminId)}`, {
        method: 'PATCH',
        body: {
          email,
          auth_user_id: authUserId,
          auth_version: authVersion,
          password_changed_at: new Date().toISOString()
        },
        prefer: 'return=minimal'
      });
    } catch (error) {
      if (createdAuthUserId) {
        await supabaseAuthAdmin(env, `admin/users/${encodeURIComponent(createdAuthUserId)}`, 'DELETE');
      }
      throw error;
    }
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
    return json({ registrations: await getSiteValue(env, 'auction-registrations') });
  }

  if (method === 'PUT' && path === '/api/admin/registrations') {
    const denied = requireAdmin();
    if (denied) return denied;
    const body = await readJson(request);
    if (!Array.isArray(body?.registrations)) return errorResponse('Registrations must be a list.', 400);
    await setSiteValue(env, 'auction-registrations', body.registrations);
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
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
        /^data:image\/(?:jpeg|png|webp|gif);base64,/.test(state.currentPlayer.photo))) {
      currentPlayer.photo = state.currentPlayer.photo;
    }
    const safeState = {
      status: state.status,
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
      teamPurses: state.teamPurses
    };
    const result = await rpc(env, 'npl_cf_save_auction', {
      p_season: season.trim(),
      p_state: safeState,
      p_expected_updated_at: expectedUpdatedAt || null
    });
    if (result?.conflict) {
      return json({
        error: 'The live auction changed in another session. Refreshing its latest state.',
        state: result.state
      }, 409);
    }
    return json({ state: result.state });
  }

  if (method === 'POST' && path === '/api/admin/media') {
    const denied = requireOwner();
    if (denied) return denied;
    const form = await request.formData();
    const mediaKey = typeof form.get('key') === 'string' ? form.get('key') : '';
    const image = form.get('image');
    if (!allowedMediaKey(mediaKey)) return errorResponse('Choose a supported site image slot.', 400);
    if (!(image instanceof File) || image.size === 0) return errorResponse('Choose an image to upload.', 400);
    if (image.size > 8 * 1024 * 1024) return errorResponse('Images must be 8 MB or smaller.', 400);
    if (!mediaTypes.has(image.type)) return errorResponse('Choose a JPG, PNG, WebP, or GIF image.', 400);
    const bytes = new Uint8Array(await image.arrayBuffer());
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    const mediaUrl = `/api/media/${encodeURIComponent(mediaKey)}?v=${toBase64Url(randomBytes(8))}`;
    await rpc(env, 'npl_cf_save_media', {
      p_media_key: mediaKey,
      p_content_type: image.type,
      p_content_base64: btoa(binary),
      p_media_url: mediaUrl
    });
    return json({ key: mediaKey, url: mediaUrl }, 201);
  }

  const deleteMediaMatch = path.match(/^\/api\/admin\/media\/(.+)$/);
  if (method === 'DELETE' && deleteMediaMatch) {
    const denied = requireOwner();
    if (denied) return denied;
    const mediaKey = decodeURIComponent(deleteMediaMatch[1]);
    if (!allowedMediaKey(mediaKey)) return errorResponse('Choose a supported site image slot.', 400);
    await rpc(env, 'npl_cf_delete_media', { p_media_key: mediaKey });
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  }

  return errorResponse('API endpoint not found.', 404);
};

export async function onRequest({ request, env }) {
  if (!new URL(request.url).pathname.startsWith('/api/')) {
    return errorResponse('API endpoint not found.', 404);
  }
  try {
    return await apiRequest(request, env);
  } catch (error) {
    console.error('Cloudflare NPL API request failed:', error);
    const message = error instanceof Error ? error.message : 'Unexpected API error.';
    return errorResponse(message, 500);
  }
}
