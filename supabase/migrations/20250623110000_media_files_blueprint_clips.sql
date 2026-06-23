-- Blueprint room clips use job_id = blueprint_id (not media_jobs)

ALTER TABLE public.media_files
  DROP CONSTRAINT IF EXISTS media_files_job_id_fkey;

ALTER TABLE public.media_files
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS error_message text;

DROP POLICY IF EXISTS "Authenticated users can read blueprint room clips" ON public.media_files;

CREATE POLICY "Authenticated users can read blueprint room clips"
  ON public.media_files
  FOR SELECT
  TO authenticated
  USING (
    job_id IN (SELECT id FROM public.blueprints)
  );
