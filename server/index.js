import { promisify } from 'node:util';
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import multer from 'multer';

const scrypt = promisify(scryptCallback);
const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.join(serverDirectory, 'data');
const usersFile = path.join(dataDirectory, 'admin-users.json');
const mediaFile = path.join(dataDirectory, 'site-media.json');
const uploadsDirectory = path.join(dataDirectory, 'uploads');
const secretFile = path.join(dataDirectory, 'session-secret');
const port = Number(process.env.PORT || 5173);
const sessionDurationSeconds = 8 * 60 * 60;
const loginAttempts = new Map();

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
  await mkdir(dataDirectory, { recursive: true, mode: 0o700 });
  await mkdir(uploadsDirectory, { recursive: true, mode: 0o700 });
  const users = await readJson(usersFile, []);
  const media = await readJson(mediaFile, {});
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
  const auth = await initializeAuth();
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));
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

  const imageExtensions = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif'
  };
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

  app.get('/api/site-media', (_req, res) => {
    res.json(auth.media);
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
    await writeJson(usersFile, auth.users);

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
    await writeJson(usersFile, auth.users);
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
    if (!['logo', 'trophy', 'stadium'].includes(mediaKey) && !/^(news|champion|team|gallery|highlight|performer):[A-Za-z0-9_-]{1,40}$/.test(mediaKey)) {
      return res.status(400).json({ error: 'Choose a supported site image slot.' });
    }
    if (!req.file) return res.status(400).json({ error: 'Choose an image to upload.' });

    const filename = `${randomBytes(16).toString('hex')}${imageExtensions[req.file.mimetype]}`;
    await writeFile(path.join(uploadsDirectory, filename), req.file.buffer, { flag: 'wx', mode: 0o600 });
    auth.media[mediaKey] = `/uploads/${filename}`;
    await writeJson(mediaFile, auth.media);
    return res.status(201).json({ key: mediaKey, url: auth.media[mediaKey] });
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