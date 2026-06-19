-- Media app: files attached to upload jobs

CREATE TABLE public.media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.media_jobs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  file_name text NOT NULL,
  file_size bigint,
  r2_key text NOT NULL,
  r2_url text NOT NULL,
  duration_seconds integer,
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'done', 'error'))
);

ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Presenters and agents can insert files for own jobs"
  ON public.media_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.media_jobs
      WHERE media_jobs.id = job_id
        AND media_jobs.uploaded_by = auth.uid()
    )
    AND public.get_my_role() IN ('presenter', 'agent')
  );

CREATE POLICY "Users can read files for own jobs"
  ON public.media_files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.media_jobs
      WHERE media_jobs.id = job_id
        AND media_jobs.uploaded_by = auth.uid()
    )
  );

CREATE POLICY "Admins and batam can read all files"
  ON public.media_files
  FOR SELECT
  TO authenticated
  USING (public.get_my_role() IN ('admin', 'batam'));
