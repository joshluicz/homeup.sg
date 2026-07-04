-- Landlord rental intake (separate from CMS listings table)
CREATE TABLE rental_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Attribution
  source_variant text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,

  -- Landlord contact
  landlord_name text NOT NULL,
  landlord_phone text NOT NULL,
  landlord_email text,

  -- Property
  property_type text NOT NULL CHECK (property_type IN (
    'hdb_room', 'hdb_whole', 'condo_room', 'condo_whole', 'other'
  )),
  district text,
  address_line text,
  rent_monthly numeric,
  room_or_unit text NOT NULL CHECK (room_or_unit IN ('room', 'unit')),
  bedrooms int,
  bathrooms int,
  sqft int,
  mrt_distance text,
  furnishing text CHECK (furnishing IS NULL OR furnishing IN ('unfurnished', 'partial', 'fully')),
  availability_date date,
  selling_points text[],
  notes text,

  -- Media
  photo_urls text[] NOT NULL DEFAULT '{}',

  -- Link to public CMS row when promoted (nullable v1)
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,

  -- Rental pipeline
  status text NOT NULL DEFAULT 'landlord_submitted' CHECK (status IN (
    'landlord_submitted',
    'intake_captured',
    'listing_ingested',
    'blueprint_generated',
    'video_rendered',
    'transcribed',
    'metadata_generated',
    'claims_checked',
    'published',
    'rejected'
  ))
);

CREATE INDEX rental_intakes_status_idx ON rental_intakes (status);
CREATE INDEX rental_intakes_source_variant_idx ON rental_intakes (source_variant);
CREATE INDEX rental_intakes_created_at_idx ON rental_intakes (created_at DESC);
CREATE INDEX rental_intakes_listing_id_idx ON rental_intakes (listing_id) WHERE listing_id IS NOT NULL;

CREATE OR REPLACE FUNCTION update_rental_intakes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rental_intakes_updated_at
  BEFORE UPDATE ON rental_intakes
  FOR EACH ROW
  EXECUTE FUNCTION update_rental_intakes_updated_at();

ALTER TABLE rental_intakes ENABLE ROW LEVEL SECURITY;

-- No public policies: all access via service role in API routes

INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-photos', 'listing-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for listing photos
CREATE POLICY "Public read listing photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'listing-photos');
