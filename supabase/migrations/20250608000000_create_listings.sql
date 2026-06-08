-- Listings table for HomeUp CMS
CREATE TABLE listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Identity
  title text NOT NULL,
  slug text UNIQUE NOT NULL,

  -- Status
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
  listed_as text NOT NULL CHECK (listed_as IN ('rent', 'sell')),
  is_sold boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,

  -- Financials
  price numeric NOT NULL,
  negotiable text NOT NULL DEFAULT 'negotiable' CHECK (negotiable IN ('negotiable', 'starting_from')),
  area_sqft numeric NOT NULL,

  -- Property Details
  flat_type text NOT NULL CHECK (flat_type IN ('condominium', 'hdb', 'landed', 'apartment')),
  condition text NOT NULL DEFAULT 'no_furnishing' CHECK (condition IN ('no_furnishing', 'partial', 'fully_furnished')),
  rooms integer,
  bathrooms integer,
  tenure integer,
  is_freehold boolean NOT NULL DEFAULT false,
  address_line_1 text,

  -- Media
  featured_image_url text,
  image_urls text[] NOT NULL DEFAULT '{}',

  -- Soft delete
  deleted_at timestamptz
);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_listings_updated_at();

-- Row Level Security
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Authenticated admin users: full read/write access
CREATE POLICY "Authenticated users full access"
  ON listings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public API: read active, non-deleted listings only
CREATE POLICY "Public read active listings"
  ON listings
  FOR SELECT
  TO anon
  USING (status = 'active' AND deleted_at IS NULL);

-- Storage bucket for listing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload listing images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'listing-images');

CREATE POLICY "Authenticated users can update listing images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'listing-images');

CREATE POLICY "Authenticated users can delete listing images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'listing-images');

CREATE POLICY "Public read listing images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'listing-images');
