-- Each agent profile video gets a shareable homeup.sg/playbook/watch/[slug]
-- page, so agents can send clients a HomeUP link instead of a raw
-- TikTok/YouTube one. Nullable for now — backfilled by application code,
-- then a follow-up migration adds the uniqueness constraint.
ALTER TABLE agent_profile_videos
  ADD COLUMN IF NOT EXISTS slug text;
