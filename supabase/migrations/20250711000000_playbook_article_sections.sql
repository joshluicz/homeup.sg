-- Structured article sections for playbook articles (Phase 2).
-- Additive migration: existing article text blobs are untouched.

alter table playbook_videos
  add column if not exists article_sections jsonb;

comment on column playbook_videos.article_sections is
  'Structured article body: quickAnswer, introduction, sections[], homeup, conclusion (version 1). FAQs stay in faq jsonb.';
