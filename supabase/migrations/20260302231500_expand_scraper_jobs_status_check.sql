DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'scraper_jobs_status_check'
      AND conrelid = 'public.scraper_jobs'::regclass
  ) THEN
    ALTER TABLE public.scraper_jobs
      DROP CONSTRAINT scraper_jobs_status_check;
  END IF;
END $$;

ALTER TABLE public.scraper_jobs
  ADD CONSTRAINT scraper_jobs_status_check
  CHECK (status IN ('pending', 'queued', 'running', 'completed', 'failed'));
