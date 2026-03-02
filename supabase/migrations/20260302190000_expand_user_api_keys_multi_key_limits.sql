ALTER TABLE public.user_api_keys
  DROP CONSTRAINT IF EXISTS user_api_keys_user_id_key;

ALTER TABLE public.user_api_keys
  ADD COLUMN IF NOT EXISTS key_name TEXT NOT NULL DEFAULT 'API Key',
  ADD COLUMN IF NOT EXISTS requests_limit INTEGER,
  ADD COLUMN IF NOT EXISTS requests_used BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_api_keys_requests_limit_check'
  ) THEN
    ALTER TABLE public.user_api_keys
      ADD CONSTRAINT user_api_keys_requests_limit_check
      CHECK (requests_limit IS NULL OR requests_limit > 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_api_keys_key_hash ON public.user_api_keys(key_hash);
