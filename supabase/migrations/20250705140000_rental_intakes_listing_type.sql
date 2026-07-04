-- Add listing_type as source of truth for rental intake form
ALTER TABLE rental_intakes
  ADD COLUMN IF NOT EXISTS listing_type text;

-- Backfill from legacy property_type + room_or_unit columns
UPDATE rental_intakes
SET listing_type = CASE
  WHEN property_type = 'hdb_room' THEN 'hdb_room'
  WHEN property_type = 'hdb_whole' THEN 'hdb_whole'
  WHEN property_type = 'condo_room' THEN 'condo_room'
  WHEN property_type = 'condo_whole' THEN 'condo_whole'
  WHEN property_type LIKE 'hdb%' AND room_or_unit = 'room' THEN 'hdb_room'
  WHEN property_type LIKE 'hdb%' AND room_or_unit = 'unit' THEN 'hdb_whole'
  WHEN property_type LIKE 'condo%' AND room_or_unit = 'room' THEN 'condo_room'
  WHEN property_type LIKE 'condo%' AND room_or_unit = 'unit' THEN 'condo_whole'
  WHEN property_type = 'other' THEN 'other'
  ELSE COALESCE(property_type, 'other')
END
WHERE listing_type IS NULL;

ALTER TABLE rental_intakes
  ADD CONSTRAINT rental_intakes_listing_type_check
  CHECK (listing_type IS NULL OR listing_type IN (
    'hdb_room', 'hdb_whole', 'condo_room', 'condo_whole', 'landed_whole', 'other'
  ));

CREATE INDEX IF NOT EXISTS rental_intakes_listing_type_idx ON rental_intakes (listing_type);
