-- Track submitter IP hash for rate limiting (hashed, not raw IP)
ALTER TABLE rental_intakes ADD COLUMN IF NOT EXISTS client_ip_hash text;

CREATE INDEX IF NOT EXISTS rental_intakes_ip_created_idx
  ON rental_intakes (client_ip_hash, created_at DESC)
  WHERE client_ip_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS rental_intakes_phone_created_idx
  ON rental_intakes (landlord_phone, created_at DESC);
