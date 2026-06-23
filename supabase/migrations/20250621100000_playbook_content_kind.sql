-- Separate playbook entries into standalone articles vs standalone videos.
alter table playbook_videos
  add column if not exists content_kind text not null default 'article'
    check (content_kind in ('article', 'video'));

-- Backfill: rows with video but no article body are short-form videos.
update playbook_videos
set content_kind = 'video'
where coalesce(trim(video_url), '') <> ''
  and coalesce(trim(article), '') = '';
