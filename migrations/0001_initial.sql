CREATE TABLE IF NOT EXISTS npl_admin_users (
  admin_id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'scorer')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  auth_version INTEGER NOT NULL DEFAULT 0,
  password_changed_at TEXT,
  email TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS npl_admin_users_email_unique
  ON npl_admin_users (lower(email))
  WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS npl_site_data (
  data_key TEXT PRIMARY KEY,
  value TEXT NOT NULL CHECK (json_valid(value)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS npl_media (
  media_key TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  chunk_count INTEGER NOT NULL CHECK (chunk_count > 0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS npl_media_chunks (
  media_key TEXT NOT NULL REFERENCES npl_media(media_key) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
  content BLOB NOT NULL,
  PRIMARY KEY (media_key, chunk_index)
);

CREATE TABLE IF NOT EXISTS npl_app_secrets (
  secret_key TEXT PRIMARY KEY,
  secret_value BLOB NOT NULL
);

CREATE TABLE IF NOT EXISTS npl_api_rate_limits (
  rate_key TEXT PRIMARY KEY,
  window_started_at INTEGER NOT NULL,
  attempt_count INTEGER NOT NULL CHECK (attempt_count >= 0)
);

CREATE TABLE IF NOT EXISTS npl_auction_registrations (
  registration_id TEXT PRIMARY KEY,
  value TEXT NOT NULL CHECK (json_valid(value)),
  created_at INTEGER NOT NULL
);
