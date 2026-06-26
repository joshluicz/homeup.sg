-- Display B (agent profile page) is no longer implicit — agents opt a video
-- into it explicitly, same as Display A. Existing rows default to true so
-- nothing currently showing on a profile page disappears.
ALTER TABLE agent_profile_videos
  ADD COLUMN IF NOT EXISTS featured_in_display_b boolean NOT NULL DEFAULT true;
