-- Phase 3: AI citation tracker
-- One row per (slug, question, check run).
-- citation_score per article = cited_count / total_questions (computed at query time).

create table if not exists public.ai_citations (
  id              uuid        primary key default gen_random_uuid(),
  slug            text        not null,
  question        text        not null,
  cited           boolean     not null default false,
  answer_excerpt  text,                         -- first 400 chars of AI response
  checked_at      timestamptz not null default now()
);

-- Fast lookups: all checks for a slug, ordered newest-first
create index if not exists ai_citations_slug_checked
  on public.ai_citations (slug, checked_at desc);

alter table public.ai_citations enable row level security;

create policy "service_role_all" on public.ai_citations
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "auth_read" on public.ai_citations
  for select using (auth.role() = 'authenticated');
