-- Media app: production blueprints (written by n8n, read by media app)

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
