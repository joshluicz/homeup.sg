-- Lets admins explicitly set the byline author for a Playbook article instead
-- of relying on best-effort inference from the video URL/title/tags.
ALTER TABLE playbook_videos
  ADD COLUMN IF NOT EXISTS agent_slug text;
