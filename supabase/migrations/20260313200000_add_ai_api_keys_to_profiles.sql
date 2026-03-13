-- Add AI API key columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS openai_api_key TEXT,
  ADD COLUMN IF NOT EXISTS perplexity_api_key TEXT,
  ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

-- We don't need a search index on these as they are sensitive and private.
-- RLS should already be configured for profiles so users only see their own row.
