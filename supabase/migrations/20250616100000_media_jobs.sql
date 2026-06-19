-- Media app: upload jobs

CREATE TABLE public.media_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  property_name text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('short', 'long')),
  category text NOT NULL CHECK (category IN ('house_tour', 'lifestyle', 'educational')),
  keywords text[] NOT NULL DEFAULT '{}',
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready_for_qc', 'approved', 'flagged', 'published'))
);

CREATE TRIGGER media_jobs_updated_at
  BEFORE UPDATE ON public.media_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.media_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Presenters and agents can insert own jobs"
  ON public.media_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND public.get_my_role() IN ('presenter', 'agent')
  );

CREATE POLICY "Users can read own jobs"
  ON public.media_jobs
  FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "Admins and batam can read all jobs"
  ON public.media_jobs
  FOR SELECT
  TO authenticated
  USING (public.get_my_role() IN ('admin', 'batam'));
