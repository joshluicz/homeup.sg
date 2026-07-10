-- =============================================================================
-- Manual apply: article_metrics + lead_events (Phase 2 GSC analytics cache)
-- =============================================================================
-- Paste this entire file into Supabase Dashboard → SQL Editor → Run.
-- Safe to re-run: uses IF NOT EXISTS / IF NOT EXISTS policies pattern.
--
-- Matches:
--   supabase/migrations/20250709100000_article_metrics.sql
--   lib/analytics/gsc.ts → cacheGscMetrics() upsert onConflict: "slug,date"
-- =============================================================================

-- ── GSC metrics cache ────────────────────────────────────────────────────────
-- One row per (slug, date). Refreshed by POST /api/admin/analytics/gsc.

create table if not exists public.article_metrics (
  slug        text        not null,
  date        date        not null,
  clicks      integer     not null default 0,
  impressions integer     not null default 0,
  position    numeric(6,2),             -- avg search position (lower = better)
  cached_at   timestamptz not null default now(),
  primary key (slug, date)
);

create index if not exists article_metrics_slug_date
  on public.article_metrics (slug, date desc);

alter table public.article_metrics enable row level security;

-- Service role (server-side upserts via SUPABASE_SERVICE_ROLE_KEY) bypasses RLS,
-- but these policies document intent and allow authenticated admin reads.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'article_metrics' and policyname = 'service_role_all'
  ) then
    create policy "service_role_all" on public.article_metrics
      for all using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'article_metrics' and policyname = 'auth_read'
  ) then
    create policy "auth_read" on public.article_metrics
      for select using (auth.role() = 'authenticated');
  end if;
end $$;

-- ── WhatsApp lead events (same Phase 2 migration) ────────────────────────────
-- Logged by /go/whatsapp?slug=... Used by the Article Analytics dashboard.

create table if not exists public.lead_events (
  id         uuid        primary key default gen_random_uuid(),
  slug       text        not null,
  created_at timestamptz not null default now()
);

create index if not exists lead_events_slug_created
  on public.lead_events (slug, created_at desc);

alter table public.lead_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lead_events' and policyname = 'public_insert'
  ) then
    create policy "public_insert" on public.lead_events
      for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lead_events' and policyname = 'auth_read'
  ) then
    create policy "auth_read" on public.lead_events
      for select using (auth.role() = 'authenticated');
  end if;
end $$;

-- Tell PostgREST to reload its schema cache so the API sees the new table immediately.
notify pgrst, 'reload schema';
