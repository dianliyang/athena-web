ALTER TABLE public.user_api_keys
  ADD COLUMN IF NOT EXISTS is_read_only BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_user_api_keys_read_only ON public.user_api_keys(is_read_only);

