-- ==============================================================================
-- NARUA PREMIER LEAGUE (NPL) - LIVE SCORING & TOURNAMENT MANAGEMENT SCHEMA
-- Safe PostgreSQL migration: Adds tables for matches, squads, innings, deliveries,
-- commentary, scorer assignments, audit logs, and updates admin user roles.
-- ==============================================================================

-- 1. Upgrade npl_admin_users role constraint to support 'scorer'
DO $$
BEGIN
  -- Drop existing role check constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'npl_admin_users_role_check'
  ) THEN
    ALTER TABLE public.npl_admin_users DROP CONSTRAINT npl_admin_users_role_check;
  END IF;

  -- Add updated check constraint allowing owner, admin, and scorer
  ALTER TABLE public.npl_admin_users 
    ADD CONSTRAINT npl_admin_users_role_check 
    CHECK (role IN ('owner', 'admin', 'scorer'));
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- 2. Tournament Configuration & Seasons table
CREATE TABLE IF NOT EXISTS public.npl_tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  season TEXT NOT NULL,
  edition TEXT NOT NULL,
  year TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'Limited Overs',
  status TEXT NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'ONGOING', 'COMPLETED')),
  points_rules JSONB NOT NULL DEFAULT '{"win": 2, "loss": 0, "tie": 1, "no_result": 1}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Live Tournament Matches table
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
  toss_winner_id TEXT,
  toss_decision TEXT CHECK (toss_decision IN ('BAT', 'BOWL')),
  assigned_scorer_id TEXT,
  status TEXT NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'TOSS', 'LIVE', 'INNINGS_BREAK', 'COMPLETED', 'ABANDONED', 'POSTPONED')),
  current_innings_number INTEGER DEFAULT 1,
  current_batting_team_id TEXT,
  current_bowling_team_id TEXT,
  result TEXT,
  winner_team_id TEXT,
  win_margin TEXT,
  player_of_match JSONB,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_npl_matches_season ON public.npl_matches(season);
CREATE INDEX IF NOT EXISTS idx_npl_matches_status ON public.npl_matches(status);
CREATE INDEX IF NOT EXISTS idx_npl_matches_scorer ON public.npl_matches(assigned_scorer_id);

-- 4. Match Squads & Playing XI table
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

CREATE INDEX IF NOT EXISTS idx_match_squads_match ON public.npl_match_squads(match_id);

-- 5. Match Innings table
CREATE TABLE IF NOT EXISTS public.npl_innings (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES public.npl_matches(id) ON DELETE CASCADE,
  innings_number INTEGER NOT NULL CHECK (innings_number IN (1, 2, 3, 4)),
  batting_team_id TEXT NOT NULL,
  bowling_team_id TEXT NOT NULL,
  total_runs INTEGER NOT NULL DEFAULT 0,
  wickets INTEGER NOT NULL DEFAULT 0,
  legal_balls INTEGER NOT NULL DEFAULT 0,
  overs_limit NUMERIC(4,1) NOT NULL DEFAULT 20.0,
  target_runs INTEGER,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'DECLARED')),
  current_striker_id TEXT,
  current_non_striker_id TEXT,
  current_bowler_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_match_innings UNIQUE (match_id, innings_number)
);

CREATE INDEX IF NOT EXISTS idx_npl_innings_match ON public.npl_innings(match_id);

-- 6. Ball-by-ball Deliveries table
CREATE TABLE IF NOT EXISTS public.npl_deliveries (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES public.npl_matches(id) ON DELETE CASCADE,
  innings_id TEXT NOT NULL REFERENCES public.npl_innings(id) ON DELETE CASCADE,
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
  extra_type TEXT CHECK (extra_type IN (NULL, 'WIDE', 'NO_BALL', 'BYE', 'LEG_BYE', 'PENALTY')),
  total_runs INTEGER NOT NULL DEFAULT 0,
  is_legal BOOLEAN NOT NULL DEFAULT TRUE,
  is_wicket BOOLEAN NOT NULL DEFAULT FALSE,
  wicket_type TEXT CHECK (wicket_type IN (NULL, 'BOWLED', 'CAUGHT', 'CAUGHT_AND_BOWLED', 'LBW', 'RUN_OUT', 'STUMPED', 'HIT_WICKET', 'RETIRED_OUT', 'OBSTRUCTING_FIELD', 'TIMED_OUT', 'HIT_BALL_TWICE', 'RETIRED_HURT')),
  dismissed_player_id TEXT,
  dismissed_player_name TEXT,
  fielder_id TEXT,
  fielder_name TEXT,
  score_after_ball TEXT,
  commentary TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_innings_sequence UNIQUE (innings_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_deliveries_innings ON public.npl_deliveries(innings_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_match ON public.npl_deliveries(match_id);

-- 7. Scorer Assignments table
CREATE TABLE IF NOT EXISTS public.npl_scorer_assignments (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES public.npl_matches(id) ON DELETE CASCADE,
  scorer_id TEXT NOT NULL REFERENCES public.npl_admin_users(admin_id) ON DELETE CASCADE,
  assigned_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_match_scorer UNIQUE (match_id, scorer_id)
);

-- 8. Scoring Audit Log table (tracks delivery additions, corrections, and undos)
CREATE TABLE IF NOT EXISTS public.npl_scoring_audit_logs (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  innings_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('ADD_DELIVERY', 'UNDO_DELIVERY', 'CORRECT_DELIVERY', 'START_INNINGS', 'END_INNINGS', 'TOSS', 'COMPLETE_MATCH')),
  delivery_id TEXT,
  previous_state JSONB,
  new_state JSONB,
  user_id TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_match ON public.npl_scoring_audit_logs(match_id);
