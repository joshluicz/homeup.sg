-- Allow listing_type-only inserts; legacy columns kept for backfill/transition
ALTER TABLE rental_intakes ALTER COLUMN property_type DROP NOT NULL;
ALTER TABLE rental_intakes ALTER COLUMN room_or_unit DROP NOT NULL;
