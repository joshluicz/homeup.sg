-- Agent profile page videos: Display B (all) + optional Display A (featured_in_display_a)
CREATE TABLE IF NOT EXISTS agent_profile_videos (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_slug            text NOT NULL,
  title                 text NOT NULL,
  video_url             text NOT NULL,
  thumbnail             text NOT NULL DEFAULT '',
  featured_in_display_a boolean NOT NULL DEFAULT false,
  sort_order            int NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_profile_videos_agent_slug_idx
  ON agent_profile_videos (agent_slug, sort_order, created_at DESC);

ALTER TABLE agent_profile_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read agent_profile_videos"
  ON agent_profile_videos FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage agent_profile_videos"
  ON agent_profile_videos FOR ALL USING (auth.role() = 'authenticated');

-- Seed Dennis Lim's existing TikTok clips (Display B + Display A)
INSERT INTO agent_profile_videos (agent_slug, title, video_url, featured_in_display_a, sort_order)
SELECT * FROM (VALUES
  (
    'dennis-lim',
    'Should you sell before you buy?',
    'https://www.tiktok.com/@homeup_dennis/video/7638950012826799380',
    true,
    0
  ),
  (
    'dennis-lim',
    'Upgrade planning for HDB owners',
    'https://www.tiktok.com/@homeup_dennis/video/7631940560378465557',
    true,
    1
  ),
  (
    'dennis-lim',
    'Private property upgrade tips',
    'https://www.tiktok.com/@homeup_dennis/video/7638994457123360021',
    true,
    2
  )
) AS seed(agent_slug, title, video_url, featured_in_display_a, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM agent_profile_videos WHERE agent_slug = 'dennis-lim'
);
