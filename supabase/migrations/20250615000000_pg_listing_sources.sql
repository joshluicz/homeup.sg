-- Saved PropertyGuru listing URLs per agent (source of truth for sync)
CREATE TABLE pg_listing_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  agent_slug text NOT NULL,
  pg_url text NOT NULL,
  pg_listing_id text NOT NULL,
  CONSTRAINT pg_listing_sources_pg_url_unique UNIQUE (pg_url),
  CONSTRAINT pg_listing_sources_pg_listing_id_unique UNIQUE (pg_listing_id)
);

CREATE INDEX pg_listing_sources_agent_slug_idx ON pg_listing_sources (agent_slug);

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS source_pg_url text,
  ADD COLUMN IF NOT EXISTS source_pg_listing_id text;

CREATE UNIQUE INDEX listings_source_pg_listing_id_unique
  ON listings (source_pg_listing_id)
  WHERE source_pg_listing_id IS NOT NULL AND deleted_at IS NULL;

ALTER TABLE pg_listing_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access on pg_listing_sources"
  ON pg_listing_sources
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
