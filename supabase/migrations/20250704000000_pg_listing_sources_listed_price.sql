-- Store the latest price from the Google Sheet source of truth.
ALTER TABLE pg_listing_sources
  ADD COLUMN IF NOT EXISTS listed_price numeric;
