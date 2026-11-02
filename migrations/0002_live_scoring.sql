-- Cloudflare D1 live scoring state. Each match is stored as one JSON aggregate so
-- scoring actions can be persisted with an atomic compare-and-swap update.
CREATE TABLE IF NOT EXISTS npl_live_scoring_matches (
  match_id TEXT PRIMARY KEY,
  value TEXT NOT NULL CHECK (json_valid(value)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_npl_live_scoring_updated
  ON npl_live_scoring_matches (updated_at);
