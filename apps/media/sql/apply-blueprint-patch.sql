-- Run this in Supabase Dashboard → SQL Editor
-- Safe to re-run: only adds blueprint support, skips existing tables.

-- 1. blueprints table (new)
CREATE TABLE IF NOT EXISTS public.blueprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id),
  property_name text NOT NULL,
  content_type text NOT NULL DEFAULT 'short',
  category text NOT NULL DEFAULT 'house_tour',
  script text,
  shot_list jsonb,
  edit_instructions jsonb,
  notes text,
  status text NOT NULL DEFAULT 'draft'
);

ALTER TABLE public.blueprints
  ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES auth.users(id);

DROP TRIGGER IF EXISTS blueprints_updated_at ON public.blueprints;
CREATE TRIGGER blueprints_updated_at
  BEFORE UPDATE ON public.blueprints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read blueprints" ON public.blueprints;
CREATE POLICY "Authenticated users can read blueprints"
  ON public.blueprints
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert blueprints" ON public.blueprints;
CREATE POLICY "Authenticated users can insert blueprints"
  ON public.blueprints
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update blueprints" ON public.blueprints;
CREATE POLICY "Authenticated users can update blueprints"
  ON public.blueprints
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete draft blueprints" ON public.blueprints;
CREATE POLICY "Authenticated users can delete draft blueprints"
  ON public.blueprints
  FOR DELETE
  TO authenticated
  USING (status = 'draft');

-- 2. media_files: allow blueprint clips (job_id = blueprint_id)
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

DROP POLICY IF EXISTS "Authenticated users can delete draft blueprint clips" ON public.media_files;
CREATE POLICY "Authenticated users can delete draft blueprint clips"
  ON public.media_files
  FOR DELETE
  TO authenticated
  USING (
    job_id IN (SELECT id FROM public.blueprints WHERE status = 'draft')
  );
