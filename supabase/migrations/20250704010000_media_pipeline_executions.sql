-- Media app: internal pipeline execution log for n8n-style observability

CREATE TABLE IF NOT EXISTS public.media_pipeline_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow text NOT NULL,
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'success', 'error')),
  uploaded_by uuid REFERENCES auth.users(id),
  subject_type text,
  subject_id uuid,
  title text,
  input_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_summary jsonb,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.media_pipeline_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.media_pipeline_runs(id) ON DELETE CASCADE,
  step_key text NOT NULL,
  step_name text NOT NULL,
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'success', 'error', 'skipped')),
  attempt integer NOT NULL DEFAULT 1,
  input_summary jsonb,
  output_summary jsonb,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_pipeline_runs_started_at_idx
  ON public.media_pipeline_runs (started_at DESC);

CREATE INDEX IF NOT EXISTS media_pipeline_runs_uploaded_by_idx
  ON public.media_pipeline_runs (uploaded_by, started_at DESC);

CREATE INDEX IF NOT EXISTS media_pipeline_steps_run_id_idx
  ON public.media_pipeline_steps (run_id, started_at);

DROP TRIGGER IF EXISTS media_pipeline_runs_updated_at ON public.media_pipeline_runs;
CREATE TRIGGER media_pipeline_runs_updated_at
  BEFORE UPDATE ON public.media_pipeline_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.media_pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_pipeline_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own pipeline runs" ON public.media_pipeline_runs;
CREATE POLICY "Users can read own pipeline runs"
  ON public.media_pipeline_runs
  FOR SELECT
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR public.get_my_role() IN ('admin', 'batam')
  );

DROP POLICY IF EXISTS "Users can read own pipeline steps" ON public.media_pipeline_steps;
CREATE POLICY "Users can read own pipeline steps"
  ON public.media_pipeline_steps
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.media_pipeline_runs
      WHERE media_pipeline_runs.id = media_pipeline_steps.run_id
        AND (
          media_pipeline_runs.uploaded_by = auth.uid()
          OR public.get_my_role() IN ('admin', 'batam')
        )
    )
  );
