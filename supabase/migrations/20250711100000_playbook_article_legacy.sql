-- Backup of the original article blob before structured backfill (Phase 3).
-- Never overwritten once set — reversible via article_legacy column.

alter table playbook_videos
  add column if not exists article_legacy text;

comment on column playbook_videos.article_legacy is
  'Original article text/html before structured backfill. Set once; not overwritten on re-backfill.';
