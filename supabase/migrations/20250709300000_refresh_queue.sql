-- Phase 5: article freshness / refresh queue
-- Populated by /api/cron/freshness; surfaced in the Article Analytics dashboard.

create table if not exists public.refresh_queue (
  id           uuid        primary key default gen_random_uuid(),
  slug         text        not null,
  reason       text        not null,   -- 'stale_year' | 'stale_figure' | 'ranking_drop' | 'age'
  detail       text,                   -- human-readable detail, e.g. "mentions 2023 but now 2026"
  detected_at  timestamptz not null default now(),
  status       text        not null default 'pending'  -- 'pending' | 'dismissed' | 'refreshed'
                           check (status in ('pending', 'dismissed', 'refreshed'))
);

create index if not exists refresh_queue_slug_status
  on public.refresh_queue (slug, status, detected_at desc);

alter table public.refresh_queue enable row level security;

create policy "service_role_all" on public.refresh_queue
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "auth_read" on public.refresh_queue
  for select using (auth.role() = 'authenticated');

create policy "auth_update" on public.refresh_queue
  for update using (auth.role() = 'authenticated');
