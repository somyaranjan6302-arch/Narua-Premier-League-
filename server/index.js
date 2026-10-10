import { promisify } from 'node:util';
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import multer from 'multer';
import pg from 'pg';
import { mergeOfficialSession3Content } from '../src/data/session3Data.js';
import { mergeOfficialSession4Content } from '../src/data/session4Data.js';
import { mergeOfficialSession5Content } from '../src/data/session5Data.js';
import { mergeOfficialSession2Content } from '../src/data/session2Data.js';

const scrypt = promisify(scryptCallback);
const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.join(serverDirectory, 'data');
const usersFile = path.join(dataDirectory, 'admin-users.json');
const repositoryDirectory = path.resolve(serverDirectory, '..');
const publicDirectory = path.join(repositoryDirectory, 'public');
const mediaFile = path.join(publicDirectory, 'site-media.json');
const uploadsDirectory = path.join(publicDirectory, 'uploads');
const legacyMediaFile = path.join(dataDirectory, 'site-media.json');
const legacyUploadsDirectory = path.join(dataDirectory, 'uploads');
const secretFile = path.join(dataDirectory, 'session-secret');
const port = Number(process.env.PORT || 5173);
const sessionDurationSeconds = 8 * 60 * 60;
const loginAttempts = new Map();
const registrationAttempts = new Map();
const { Pool } = pg;
const database = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;
const imageExtensions = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
};

const migrateLegacyMediaToRepository = async (legacyMedia) => {
  const sharedMedia = await readJson(mediaFile, {});
  let migratedCount = 0;

  for (const [mediaKey, mediaUrl] of Object.entries(legacyMedia)) {
    if (sharedMedia[mediaKey] || typeof mediaUrl !== 'string' || !mediaUrl.startsWith('/uploads/')) continue;

    const filename = path.basename(mediaUrl);
    if (!filename || filename !== mediaUrl.slice('/uploads/'.length)) continue;

    try {
      await copyFile(path.join(legacyUploadsDirectory, filename), path.join(uploadsDirectory, filename));
      sharedMedia[mediaKey] = `/uploads/${filename}`;
      migratedCount += 1;
    } catch (error) {
      if (error.code !== 'ENOENT') console.error(`Could not migrate legacy image for ${mediaKey}:`, error.message);
    }
  }

  if (migratedCount > 0) {
    console.log(`Copied ${migratedCount} legacy image(s) into Git-trackable public/uploads.`);
  }

  await writeJson(mediaFile, sharedMedia);
  return sharedMedia;
};

const savePublicUpload = async (file, mediaKey) => {
  if (database) {
    const url = `/api/media/${encodeURIComponent(mediaKey)}`;
    await database.query(
      `INSERT INTO npl_media (media_key, content_type, content)
       VALUES ($1, $2, $3)
       ON CONFLICT (media_key) DO UPDATE SET content_type = EXCLUDED.content_type,
         content = EXCLUDED.content, updated_at = NOW()`,
      [mediaKey, file.mimetype, file.buffer]
    );
    const result = await database.query("SELECT value FROM npl_site_data WHERE data_key = 'site-media'");
    const media = { ...(await readJson(mediaFile, {})), ...(result.rows[0]?.value || {}) };
    media[mediaKey] = url;
    await database.query(
      `INSERT INTO npl_site_data (data_key, value) VALUES ('site-media', $1::jsonb)
       ON CONFLICT (data_key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [JSON.stringify(media)]
    );
    return url;
  }

  const filename = `${randomBytes(16).toString('hex')}${imageExtensions[file.mimetype]}`;
  await writeFile(path.join(uploadsDirectory, filename), file.buffer, { flag: 'wx', mode: 0o644 });
  const media = await readJson(mediaFile, {});
  media[mediaKey] = `/uploads/${filename}`;
  await writeJson(mediaFile, media);
  return media[mediaKey];
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
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
};

const createPasswordHash = async (password, salt = randomBytes(16).toString('hex')) => {
  const derivedKey = await scrypt(password, salt, 64);
  return { salt, hash: derivedKey.toString('hex') };
};

const verifyPassword = async (password, user) => {
  const { hash } = await createPasswordHash(password, user.salt);
  const expected = Buffer.from(user.hash, 'hex');
  const actual = Buffer.from(hash, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};

const initializeAuth = async () => {
  if (database) {
    await database.query(`
      CREATE TABLE IF NOT EXISTS npl_admin_users (
        admin_id TEXT PRIMARY KEY,
        role TEXT NOT NULL CHECK (role IN ('owner', 'admin')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        auth_version INTEGER NOT NULL DEFAULT 0,
        password_changed_at TIMESTAMPTZ
      );
      CREATE TABLE IF NOT EXISTS npl_site_data (
        data_key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS npl_media (
        media_key TEXT PRIMARY KEY,
        content_type TEXT NOT NULL,
        content BYTEA NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS npl_app_secrets (
        secret_key TEXT PRIMARY KEY,
        secret_value BYTEA NOT NULL
      );
    `);

    const secretResult = await database.query("SELECT secret_value FROM npl_app_secrets WHERE secret_key = 'session-signing'");
    let sessionSecret = secretResult.rows[0]?.secret_value;
    if (!sessionSecret) {
      sessionSecret = randomBytes(48);
      await database.query(
        "INSERT INTO npl_app_secrets (secret_key, secret_value) VALUES ('session-signing', $1) ON CONFLICT DO NOTHING",
        [sessionSecret]
      );
      const persistedSecret = await database.query("SELECT secret_value FROM npl_app_secrets WHERE secret_key = 'session-signing'");
      sessionSecret = persistedSecret.rows[0].secret_value;
    }

    const userResult = await database.query('SELECT * FROM npl_admin_users ORDER BY created_at');
    const users = userResult.rows.map((row) => ({
      adminId: row.admin_id,
      role: row.role,
      createdAt: row.created_at,
      salt: row.salt,
      hash: row.password_hash,
      authVersion: row.auth_version,
      passwordChangedAt: row.password_changed_at
    }));

    if (users.length === 0) {
      const initialPassword = process.env.NPL_INITIAL_OWNER_PASSWORD || randomBytes(24).toString('base64url');
      if (initialPassword.length < 16) throw new Error('NPL_INITIAL_OWNER_PASSWORD must be at least 16 characters.');
      const passwordHash = await createPasswordHash(initialPassword);
      const user = { adminId: 'developer', role: 'owner', createdAt: new Date().toISOString(), ...passwordHash };
      await database.query(
        `INSERT INTO npl_admin_users (admin_id, role, salt, password_hash)
         VALUES ($1, $2, $3, $4)`,
        [user.adminId, user.role, user.salt, user.hash]
      );
      users.push(user);
      if (!process.env.NPL_INITIAL_OWNER_PASSWORD) {
        console.log('\nInitial NPL developer admin account (save this password now):');
        console.log('Admin ID: developer');
        console.log(`Password: ${initialPassword}\n`);
      } else {
        console.log('\nInitial NPL developer admin account created from the configured secret.');
      }
    }

    return { users, sessionSecret, media: {} };
  }

  await mkdir(dataDirectory, { recursive: true, mode: 0o700 });
  await mkdir(publicDirectory, { recursive: true });
  await mkdir(uploadsDirectory, { recursive: true });
  const users = await readJson(usersFile, []);
  const legacyMedia = await readJson(legacyMediaFile, {});
  const trackedMedia = await readJson(mediaFile, {});
  const media = { ...legacyMedia, ...trackedMedia };
  let sessionSecret;

  try {
    sessionSecret = await readFile(secretFile);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    sessionSecret = randomBytes(48);
    await writeFile(secretFile, sessionSecret, { mode: 0o600, flag: 'wx' });
  }

  if (users.length === 0) {
    const initialPassword = randomBytes(24).toString('base64url');
    const passwordHash = await createPasswordHash(initialPassword);
    users.push({
      adminId: 'developer',
      role: 'owner',
      createdAt: new Date().toISOString(),
      ...passwordHash
    });
    await writeJson(usersFile, users);
    console.log('\nInitial NPL developer admin account (save this password now):');
    console.log('Admin ID: developer');
    console.log(`Password: ${initialPassword}\n`);
  }

  return { users, media, sessionSecret };
};

const createSessionToken = (user, sessionSecret) => {
  const payload = Buffer.from(JSON.stringify({
    adminId: user.adminId,
    authVersion: user.authVersion || 0,
    expiresAt: Date.now() + sessionDurationSeconds * 1000
  })).toString('base64url');
  const signature = createHmac('sha256', sessionSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
};

const getSessionUser = (req, users, sessionSecret) => {
  const cookie = req.headers.cookie?.split(';').map(value => value.trim())
    .find(value => value.startsWith('npl_admin_session='));
  if (!cookie) return null;

  const token = cookie.slice('npl_admin_session='.length);
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = createHmac('sha256', sessionSecret).update(payload).digest();
  let provided;
  try {
    provided = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (session.expiresAt <= Date.now()) return null;
    const user = users.find(account => account.adminId === session.adminId);
    if (!user || (session.authVersion || 0) !== (user.authVersion || 0)) return null;
    return user;
  } catch {
    return null;
  }
};

const publicUser = ({ adminId, role }) => ({ adminId, role });

const start = async () => {
  if (process.env.NODE_ENV === 'production' && !database) {
    throw new Error('DATABASE_URL is required in production so admin data and uploads are stored persistently.');
  }
  const auth = await initializeAuth();
  if (!database) auth.media = await migrateLegacyMediaToRepository(auth.media);
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '12mb' }));
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('Referrer-Policy', 'same-origin');
    next();
  });
  app.use('/uploads', express.static(uploadsDirectory, {
    fallthrough: false,
    immutable: true,
    maxAge: '1y',
    dotfiles: 'deny',
    setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff')
  }));

  const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, callback) => {
      callback(null, Object.hasOwn(imageExtensions, file.mimetype));
    }
  });

  const requireAdmin = (req, res, next) => {
    const user = getSessionUser(req, auth.users, auth.sessionSecret);
    if (!user) return res.status(401).json({ error: 'Sign in required.' });
    req.adminUser = user;
    next();
  };

  const requireOwner = (req, res, next) => {
    if (req.adminUser.role !== 'owner') {
      return res.status(403).json({ error: 'Only the developer owner can manage admin accounts.' });
    }
    next();
  };

  app.get('/api/admin/session', (req, res) => {
    const user = getSessionUser(req, auth.users, auth.sessionSecret);
    res.json({ user: user ? publicUser(user) : null });
  });

  app.get('/api/site-media', async (_req, res) => {
    if (database) {
      const result = await database.query("SELECT value FROM npl_site_data WHERE data_key = 'site-media'");
      return res.json({ ...(await readJson(mediaFile, {})), ...(result.rows[0]?.value || {}) });
    }
    return res.json(await readJson(mediaFile, auth.media));
  });

  app.get('/api/media/:key', async (req, res) => {
    if (!database) return res.status(404).end();
    const result = await database.query('SELECT content_type, content FROM npl_media WHERE media_key = $1', [req.params.key]);
    if (!result.rows[0]) return res.status(404).end();
    res.set('Cache-Control', 'public, max-age=300');
    res.set('X-Content-Type-Options', 'nosniff');
    return res.type(result.rows[0].content_type).send(result.rows[0].content);
  });

  app.get('/api/site-data', async (_req, res) => {
    if (!database) return res.json(null);
    const result = await database.query("SELECT value FROM npl_site_data WHERE data_key = 'public-content'");
    const storedContent = result.rows[0]?.value || null;
    return res.json(storedContent ? mergeOfficialSession5Content(mergeOfficialSession4Content(mergeOfficialSession3Content(mergeOfficialSession2Content(storedContent)))) : null);
  });

  app.put('/api/admin/site-data', requireAdmin, async (req, res) => {
    if (!database) return res.status(503).json({ error: 'Persistent database is not configured.' });
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Site content must be an object.' });
    }
    await database.query(
      `INSERT INTO npl_site_data (data_key, value) VALUES ('public-content', $1::jsonb)
       ON CONFLICT (data_key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [JSON.stringify(req.body)]
    );
    return res.status(204).end();
  });

  app.get('/api/admin/registrations', requireAdmin, async (_req, res) => {
    if (!database) return res.json({ registrations: null });
    const result = await database.query("SELECT value FROM npl_site_data WHERE data_key = 'auction-registrations'");
    return res.json({ registrations: result.rows[0]?.value || null });
  });

  app.put('/api/admin/registrations', requireAdmin, async (req, res) => {
    if (!database) return res.status(503).json({ error: 'Persistent database is not configured.' });
    if (!Array.isArray(req.body?.registrations)) return res.status(400).json({ error: 'Registrations must be a list.' });
    await database.query(
      `INSERT INTO npl_site_data (data_key, value) VALUES ('auction-registrations', $1::jsonb)
       ON CONFLICT (data_key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [JSON.stringify(req.body.registrations)]
    );
    return res.status(204).end();
  });

  app.post('/api/auction-registrations', async (req, res) => {
    if (!database) return res.status(503).json({ error: 'Player registration storage is not configured.' });
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress;
    const attempt = registrationAttempts.get(ip);
    if (attempt && attempt.count >= 5 && now - attempt.startedAt < 60 * 60 * 1000) {
      return res.status(429).json({ error: 'Too many registrations. Try again later.' });
    }
    if (!req.body || typeof req.body !== 'object' || typeof req.body.id !== 'string' ||
      typeof req.body.fullName !== 'string' || typeof req.body.phone !== 'string' || req.body.consent !== true) {
      return res.status(400).json({ error: 'Registration details are incomplete.' });
    }
    const currentResult = await database.query("SELECT value FROM npl_site_data WHERE data_key = 'auction-registrations'");
    const registrations = currentResult.rows[0]?.value || [];
    const existingIndex = registrations.findIndex((registration) => registration.id === req.body.id);
    if (existingIndex >= 0) registrations.splice(existingIndex, 1);
    registrations.unshift(req.body);
    await database.query(
      `INSERT INTO npl_site_data (data_key, value) VALUES ('auction-registrations', $1::jsonb)
       ON CONFLICT (data_key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [JSON.stringify(registrations)]
    );
    registrationAttempts.set(ip, { count: (attempt?.count || 0) + 1, startedAt: attempt?.startedAt || now });
    return res.status(201).json({ id: req.body.id });
  });

  app.post('/api/admin/login', async (req, res) => {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress;
    const attempt = loginAttempts.get(ip);
    if (attempt && attempt.count >= 8 && now - attempt.startedAt < 15 * 60 * 1000) {
      return res.status(429).json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' });
    }

    const adminId = typeof req.body.adminId === 'string' ? req.body.adminId.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = auth.users.find(account => account.adminId === adminId);
    const passwordIsValid = user && await verifyPassword(password, user);

    if (!passwordIsValid) {
      if (!attempt || now - attempt.startedAt >= 15 * 60 * 1000) {
        loginAttempts.set(ip, { count: 1, startedAt: now });
      } else {
        attempt.count += 1;
      }
      return res.status(401).json({ error: 'Invalid admin ID or password.' });
    }

    loginAttempts.delete(ip);
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.set('Set-Cookie', `npl_admin_session=${createSessionToken(user, auth.sessionSecret)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionDurationSeconds}${secure}`);
    return res.json({ user: publicUser(user) });
  });

  app.post('/api/admin/password', requireAdmin, async (req, res) => {
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const passwordHash = await createPasswordHash(newPassword);
    Object.assign(req.adminUser, passwordHash, {
      authVersion: (req.adminUser.authVersion || 0) + 1,
      passwordChangedAt: new Date().toISOString()
    });
    if (database) {
      await database.query(
        `UPDATE npl_admin_users SET salt = $2, password_hash = $3,
          auth_version = $4, password_changed_at = $5 WHERE admin_id = $1`,
        [req.adminUser.adminId, req.adminUser.salt, req.adminUser.hash, req.adminUser.authVersion, req.adminUser.passwordChangedAt]
      );
    } else {
      await writeJson(usersFile, auth.users);
    }

    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.set('Set-Cookie', `npl_admin_session=${createSessionToken(req.adminUser, auth.sessionSecret)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionDurationSeconds}${secure}`);
    return res.json({ user: publicUser(req.adminUser) });
  });

  app.post('/api/admin/logout', (_req, res) => {
    res.set('Set-Cookie', 'npl_admin_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
    res.status(204).end();
  });

  app.get('/api/admin/users', requireAdmin, requireOwner, (_req, res) => {
    res.json({ users: auth.users.map(user => ({
      ...publicUser(user),
      createdAt: user.createdAt
    })) });
  });

  app.post('/api/admin/users', requireAdmin, requireOwner, async (req, res) => {
    const adminId = typeof req.body.adminId === 'string' ? req.body.adminId.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!/^[a-z0-9._-]{3,32}$/.test(adminId)) {
      return res.status(400).json({ error: 'Admin ID must be 3-32 letters, numbers, dots, underscores, or hyphens.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (auth.users.some(user => user.adminId === adminId)) {
      return res.status(409).json({ error: 'That admin ID is already in use.' });
    }

    const passwordHash = await createPasswordHash(password);
    const user = {
      adminId,
      role: 'admin',
      createdAt: new Date().toISOString(),
      ...passwordHash
    };
    auth.users.push(user);
    if (database) {
      await database.query(
        'INSERT INTO npl_admin_users (admin_id, role, salt, password_hash) VALUES ($1, $2, $3, $4)',
        [user.adminId, user.role, user.salt, user.hash]
      );
    } else {
      await writeJson(usersFile, auth.users);
    }
    return res.status(201).json({ user: publicUser(user) });
  });

  app.post('/api/admin/media', requireAdmin, requireOwner, (req, res, next) => {
    imageUpload.single('image')(req, res, (error) => {
      if (!error) return next();
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'Images must be 8 MB or smaller.'
        : 'Choose a JPG, PNG, WebP, or GIF image.';
      return res.status(400).json({ error: message });
    });
  }, async (req, res) => {
    const mediaKey = typeof req.body.key === 'string' ? req.body.key : '';
    if (!['logo', 'trophy', 'stadium'].includes(mediaKey) && !/^(news|champion|team-logo|team|gallery|memory-photo|highlight|performer|player-photo):[A-Za-z0-9 ._-]{1,80}$/.test(mediaKey)) {
      return res.status(400).json({ error: 'Choose a supported site image slot.' });
    }
    if (!req.file) return res.status(400).json({ error: 'Choose an image to upload.' });

    const url = await savePublicUpload(req.file, mediaKey);
    auth.media[mediaKey] = url;
    return res.status(201).json({ key: mediaKey, url });
  });

  app.delete('/api/admin/media/:key', requireAdmin, requireOwner, async (req, res) => {
    const mediaKey = req.params.key;
    if (!['logo', 'trophy', 'stadium'].includes(mediaKey) && !/^(news|champion|team-logo|team|gallery|memory-photo|highlight|performer|player-photo):[A-Za-z0-9 ._-]{1,80}$/.test(mediaKey)) {
      return res.status(400).json({ error: 'Choose a supported site image slot.' });
    }

    delete auth.media[mediaKey];
    if (database) {
      await database.query('DELETE FROM npl_media WHERE media_key = $1', [mediaKey]);
      const result = await database.query("SELECT value FROM npl_site_data WHERE data_key = 'site-media'");
      const media = { ...(result.rows[0]?.value || {}) };
      delete media[mediaKey];
      await database.query(
        `INSERT INTO npl_site_data (data_key, value) VALUES ('site-media', $1::jsonb)
         ON CONFLICT (data_key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [JSON.stringify(media)]
      );
      const localMedia = await readJson(mediaFile, {});
      if (localMedia[mediaKey]) {
        delete localMedia[mediaKey];
        await writeJson(mediaFile, localMedia);
      }
    } else {
      const media = await readJson(mediaFile, auth.media);
      delete media[mediaKey];
      await writeJson(mediaFile, media);
    }

    return res.status(204).end();
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found.' }));

  if (process.env.NODE_ENV === 'production') {
    const distDirectory = path.resolve(serverDirectory, '..', 'dist');
    app.use(express.static(distDirectory));
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next();
      return res.sendFile(path.join(distDirectory, 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      configFile: path.resolve(serverDirectory, '..', 'vite.config.js'),
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`NPL server ready at http://localhost:${port}`);
  });
};

start().catch(error => {
  console.error('Unable to start NPL server:', error);
  process.exitCode = 1;
});
