-- Store PropertyGuru listedById for reliable agent listing fetch
ALTER TABLE pg_agent_profiles
  ADD COLUMN IF NOT EXISTS pg_listed_by_id text;
