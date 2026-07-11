-- Cached Google URL Inspection results for the admin indexing monitor.
-- Populated in batches (GSC quota: 2,000 inspections/day per site).

create table if not exists public.url_index_checks (
  url text primary key,
  slug text not null default '',
  kind text not null default 'core',
  label text not null default '',
  verdict text,
  coverage_state text,
  page_fetch_state text,
  last_crawl_time timestamptz,
  reason text,
  needs_attention boolean not null default true,
  checked_at timestamptz not null default now()
);

create index if not exists url_index_checks_attention_idx
  on public.url_index_checks (needs_attention, checked_at desc);

create index if not exists url_index_checks_kind_idx
  on public.url_index_checks (kind);
