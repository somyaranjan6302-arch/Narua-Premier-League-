CREATE TABLE npl_admin_users_with_scorer_role (
  admin_id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'scorer')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  auth_version INTEGER NOT NULL DEFAULT 0,
  password_changed_at TEXT,
  email TEXT
);

INSERT INTO npl_admin_users_with_scorer_role (
  admin_id, role, created_at, salt, password_hash, auth_version, password_changed_at, email
)
SELECT admin_id, role, created_at, salt, password_hash, auth_version, password_changed_at, email
FROM npl_admin_users;

DROP TABLE npl_admin_users;
ALTER TABLE npl_admin_users_with_scorer_role RENAME TO npl_admin_users;

CREATE UNIQUE INDEX IF NOT EXISTS npl_admin_users_email_unique
  ON npl_admin_users (lower(email))
  WHERE email IS NOT NULL;
