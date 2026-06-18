-- Add topic column for mapping articles/videos to the three PlaybookJourney stages.
-- topic is nullable: null means the article is not pinned to any specific stage.
alter table playbook_videos
  add column if not exists topic text
    check (topic in ('upgraders', 'buying_first', 'condo_tips'));

-- Add article, faq, meta_description columns if they were not applied yet.
alter table playbook_videos
  add column if not exists article text not null default '';

alter table playbook_videos
  add column if not exists faq jsonb not null default '[]';

alter table playbook_videos
  add column if not exists meta_description text not null default '';
