CREATE TABLE IF NOT EXISTS public.npl_admin_users (
  admin_id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  salt TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  auth_version INTEGER NOT NULL DEFAULT 0,
  password_changed_at TIMESTAMPTZ,
  email TEXT,
  auth_user_id UUID
);

ALTER TABLE public.npl_admin_users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.npl_admin_users ADD COLUMN IF NOT EXISTS auth_user_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS npl_admin_users_email_unique
  ON public.npl_admin_users (LOWER(email))
  WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS npl_admin_users_auth_user_unique
  ON public.npl_admin_users (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.npl_site_data (
  data_key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.npl_media (
  media_key TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  content BYTEA NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.npl_app_secrets (
  secret_key TEXT PRIMARY KEY,
  secret_value BYTEA NOT NULL
);

CREATE TABLE IF NOT EXISTS public.npl_api_rate_limits (
  rate_key TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL,
  attempt_count INTEGER NOT NULL CHECK (attempt_count >= 0)
);

ALTER TABLE public.npl_admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npl_site_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npl_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npl_app_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npl_api_rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON
  public.npl_admin_users,
  public.npl_site_data,
  public.npl_media,
  public.npl_app_secrets,
  public.npl_api_rate_limits
FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.npl_admin_users,
  public.npl_site_data,
  public.npl_media,
  public.npl_app_secrets,
  public.npl_api_rate_limits
TO service_role;

CREATE OR REPLACE FUNCTION public.npl_cf_save_auction(
  p_season TEXT,
  p_state JSONB,
  p_expected_updated_at TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key TEXT := 'auction-live:' || p_season;
  v_current JSONB;
  v_saved JSONB;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(v_key, 0));
  SELECT value INTO v_current
  FROM public.npl_site_data
  WHERE data_key = v_key
  FOR UPDATE;

  IF (v_current ->> 'updatedAt') IS DISTINCT FROM p_expected_updated_at THEN
    RETURN jsonb_build_object('conflict', TRUE, 'state', v_current);
  END IF;

  v_saved := jsonb_set(
    p_state,
    '{updatedAt}',
    to_jsonb(clock_timestamp()::TEXT),
    TRUE
  );

  INSERT INTO public.npl_site_data (data_key, value)
  VALUES (v_key, v_saved)
  ON CONFLICT (data_key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = NOW();

  RETURN jsonb_build_object('state', v_saved);
END;
$$;

CREATE OR REPLACE FUNCTION public.npl_cf_register_player(
  p_registration JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing JSONB;
  v_retained JSONB;
  v_registration_id TEXT := p_registration ->> 'id';
BEGIN
  IF v_registration_id IS NULL OR v_registration_id = '' THEN
    RAISE EXCEPTION 'Registration id is required';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('auction-registrations', 0));

  SELECT value INTO v_existing
  FROM public.npl_site_data
  WHERE data_key = 'auction-registrations'
  FOR UPDATE;

  SELECT COALESCE(jsonb_agg(entry.value ORDER BY entry.ordinality), '[]'::JSONB)
  INTO v_retained
  FROM jsonb_array_elements(COALESCE(v_existing, '[]'::JSONB))
    WITH ORDINALITY AS entry(value, ordinality)
  WHERE entry.value ->> 'id' IS DISTINCT FROM v_registration_id;

  INSERT INTO public.npl_site_data (data_key, value)
  VALUES ('auction-registrations', jsonb_build_array(p_registration) || v_retained)
  ON CONFLICT (data_key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = NOW();

  RETURN jsonb_build_object('id', v_registration_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.npl_cf_save_media(
  p_media_key TEXT,
  p_content_type TEXT,
  p_content_base64 TEXT,
  p_media_url TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_media JSONB;
BEGIN
  INSERT INTO public.npl_media (media_key, content_type, content)
  VALUES (p_media_key, p_content_type, decode(p_content_base64, 'base64'))
  ON CONFLICT (media_key) DO UPDATE
    SET content_type = EXCLUDED.content_type,
        content = EXCLUDED.content,
        updated_at = NOW();

  PERFORM pg_advisory_xact_lock(hashtextextended('site-media', 0));
  SELECT value INTO v_media
  FROM public.npl_site_data
  WHERE data_key = 'site-media'
  FOR UPDATE;

  v_media := COALESCE(v_media, '{}'::JSONB) || jsonb_build_object(p_media_key, p_media_url);
  INSERT INTO public.npl_site_data (data_key, value)
  VALUES ('site-media', v_media)
  ON CONFLICT (data_key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = NOW();

  RETURN jsonb_build_object('key', p_media_key, 'url', p_media_url);
END;
$$;

CREATE OR REPLACE FUNCTION public.npl_cf_delete_media(
  p_media_key TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_media JSONB;
BEGIN
  DELETE FROM public.npl_media WHERE media_key = p_media_key;

  PERFORM pg_advisory_xact_lock(hashtextextended('site-media', 0));
  SELECT value INTO v_media
  FROM public.npl_site_data
  WHERE data_key = 'site-media'
  FOR UPDATE;

  IF v_media IS NOT NULL THEN
    v_media := v_media - p_media_key;
    INSERT INTO public.npl_site_data (data_key, value)
    VALUES ('site-media', v_media)
    ON CONFLICT (data_key) DO UPDATE
      SET value = EXCLUDED.value, updated_at = NOW();
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.npl_cf_check_rate_limit(
  p_rate_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt_count INTEGER;
BEGIN
  INSERT INTO public.npl_api_rate_limits (rate_key, window_started_at, attempt_count)
  VALUES (p_rate_key, clock_timestamp(), 1)
  ON CONFLICT (rate_key) DO UPDATE
    SET window_started_at = CASE
          WHEN clock_timestamp() - npl_api_rate_limits.window_started_at >=
            make_interval(secs => p_window_seconds)
          THEN clock_timestamp()
          ELSE npl_api_rate_limits.window_started_at
        END,
        attempt_count = CASE
          WHEN clock_timestamp() - npl_api_rate_limits.window_started_at >=
            make_interval(secs => p_window_seconds)
          THEN 1
          ELSE npl_api_rate_limits.attempt_count + 1
        END
  RETURNING attempt_count INTO v_attempt_count;

  RETURN v_attempt_count <= p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.npl_cf_clear_rate_limit(
  p_rate_key TEXT
) RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.npl_api_rate_limits WHERE rate_key = p_rate_key;
$$;

REVOKE ALL ON FUNCTION public.npl_cf_save_auction(TEXT, JSONB, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.npl_cf_register_player(JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.npl_cf_save_media(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.npl_cf_delete_media(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.npl_cf_check_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.npl_cf_clear_rate_limit(TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.npl_cf_save_auction(TEXT, JSONB, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.npl_cf_register_player(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.npl_cf_save_media(TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.npl_cf_delete_media(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.npl_cf_check_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.npl_cf_clear_rate_limit(TEXT) TO service_role;

NOTIFY pgrst, 'reload schema';
