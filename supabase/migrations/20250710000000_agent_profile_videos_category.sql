-- Add category column to agent_profile_videos
-- Categories: home_tour, property_tips, landed, others
ALTER TABLE agent_profile_videos
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'others'
    CHECK (category IN ('home_tour', 'property_tips', 'landed', 'others'));

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS agent_profile_videos_category_idx
  ON agent_profile_videos (agent_slug, category);
