-- Optional PropertyGuru agent profile URL per agent (empty = skip on fetch)
CREATE TABLE pg_agent_profiles (
  agent_slug text PRIMARY KEY,
  pg_profile_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pg_agent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access on pg_agent_profiles"
  ON pg_agent_profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
