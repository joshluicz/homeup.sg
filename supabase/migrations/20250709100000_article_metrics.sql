-- Phase 2: GSC metrics cache + WhatsApp lead events

-- ── GSC metrics cache ──────────────────────────────────────────────────────────
-- One row per (slug, date). Refreshed by /api/admin/analytics/gsc (POST).
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

create policy "service_role_all" on public.article_metrics
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Allow authenticated admin reads
create policy "auth_read" on public.article_metrics
  for select using (auth.role() = 'authenticated');

-- ── WhatsApp lead events ────────────────────────────────────────────────────────
-- Logged by /go/whatsapp?slug=... No PII stored: no IP, no user-agent.
create table if not exists public.lead_events (
  id         uuid        primary key default gen_random_uuid(),
  slug       text        not null,
  created_at timestamptz not null default now()
);

create index if not exists lead_events_slug_created
  on public.lead_events (slug, created_at desc);

alter table public.lead_events enable row level security;

-- Public insert only (the redirect route does not require auth)
create policy "public_insert" on public.lead_events
  for insert with check (true);

create policy "auth_read" on public.lead_events
  for select using (auth.role() = 'authenticated');
