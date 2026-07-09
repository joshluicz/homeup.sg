-- HomeUP proprietary transaction data
-- Aggregate-only stats from HomeUP's own sales — never expose individual rows.
-- min-5 sampling is enforced at QUERY TIME in lib/pipeline/transactions.ts.

create table if not exists public.transactions (
  id              uuid primary key default gen_random_uuid(),
  property_type   text not null,          -- 'HDB' | 'Condo' | 'EC' | 'Landed'
  town            text not null,          -- e.g. 'Tampines', 'Woodlands'
  segment         text,                   -- optional sub-type, e.g. '4-room', 'High-floor'
  sold_price      integer not null,       -- SGD, e.g. 520000
  days_on_market  integer not null,       -- calendar days from list to OTP
  net_vs_valuation numeric(6,2),          -- % above/below HDB/bank valuation, e.g. 3.50 or -1.20
  year            smallint not null,      -- transaction year, e.g. 2024
  created_at      timestamptz not null default now()
);

-- Index for the aggregate query pattern
create index if not exists transactions_type_town_year
  on public.transactions (property_type, town, year);

-- RLS: read via service role only; no public read
alter table public.transactions enable row level security;

-- Allow service role full access (used by the import route and pipeline)
create policy "service_role_all" on public.transactions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
