-- Agent profile page videos (Property insights section on /agents/[slug])
CREATE TABLE IF NOT EXISTS agent_profile_videos (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_slug            text NOT NULL,
  title                 text NOT NULL,
  video_url             text NOT NULL,
  thumbnail             text NOT NULL DEFAULT '',
  featured_in_display_a boolean NOT NULL DEFAULT true,
  sort_order            int NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_profile_videos_agent_slug_idx
  ON agent_profile_videos (agent_slug, sort_order, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS agent_profile_videos_agent_url_idx
  ON agent_profile_videos (agent_slug, video_url);

ALTER TABLE agent_profile_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read agent_profile_videos" ON agent_profile_videos;
CREATE POLICY "Public can read agent_profile_videos"
  ON agent_profile_videos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage agent_profile_videos" ON agent_profile_videos;
CREATE POLICY "Authenticated users can manage agent_profile_videos"
  ON agent_profile_videos FOR ALL USING (auth.role() = 'authenticated');

-- Seed existing TikTok clips from lib/data/agents.ts (idempotent)
INSERT INTO agent_profile_videos (agent_slug, title, video_url, featured_in_display_a, sort_order)
SELECT * FROM (VALUES
  ('dennis-lim', 'Should you sell before you buy?', 'https://www.tiktok.com/@homeup_dennis/video/7638950012826799380', true, 0),
  ('dennis-lim', 'Upgrade planning for HDB owners', 'https://www.tiktok.com/@homeup_dennis/video/7631940560378465557', true, 1),
  ('dennis-lim', 'Private property upgrade tips', 'https://www.tiktok.com/@homeup_dennis/video/7638994457123360021', true, 2),
  ('yeo-tong-boon', 'Property tip from Tong Boon', 'https://www.tiktok.com/@homeup_tongboon/video/7631845291800481032', true, 0),
  ('yeo-tong-boon', 'Property tip from Tong Boon', 'https://www.tiktok.com/@homeup_tongboon/video/7620785028812836103', true, 1),
  ('yeo-tong-boon', 'Property tip from Tong Boon', 'https://www.tiktok.com/@homeup_tongboon/video/7642310615293316370', true, 2),
  ('edmund-lee', 'Property tip from Edmund', 'https://www.tiktok.com/@edmundleesiewwah/video/7649749005693406482', true, 0),
  ('edmund-lee', 'Property tip from Edmund', 'https://www.tiktok.com/@edmundleesiewwah/video/7639603282712792328', true, 1),
  ('edmund-lee', 'Property tip from Edmund', 'https://www.tiktok.com/@edmundleesiewwah/video/7651599442377706760', true, 2),
  ('kenji-ching', 'Property tip from Kenji', 'https://www.tiktok.com/@homeup_kenji/video/7625629127298616594', true, 0),
  ('kenji-ching', 'Property tip from Kenji', 'https://www.tiktok.com/@homeup_kenji/video/7634066326482341128', true, 1),
  ('kenji-ching', 'Property tip from Kenji', 'https://www.tiktok.com/@homeup_kenji/video/7593327782197759240', true, 2),
  ('olivia-neo', 'Property tip from Olivia', 'https://www.tiktok.com/@homeup_olivia/video/7647084977745612039', true, 0),
  ('olivia-neo', 'Property tip from Olivia', 'https://www.tiktok.com/@homeup_olivia/video/7637547101282389256', true, 1),
  ('olivia-neo', 'Property tip from Olivia', 'https://www.tiktok.com/@homeup_olivia/video/7638154827150757138', true, 2)
) AS seed(agent_slug, title, video_url, featured_in_display_a, sort_order)
ON CONFLICT (agent_slug, video_url) DO NOTHING;
