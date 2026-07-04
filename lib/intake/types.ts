export type RentalIntakeStatus =
  | "landlord_submitted"
  | "intake_captured"
  | "listing_ingested"
  | "blueprint_generated"
  | "video_rendered"
  | "transcribed"
  | "metadata_generated"
  | "claims_checked"
  | "published"
  | "rejected";

export type ListingType =
  | "hdb_room"
  | "hdb_whole"
  | "condo_room"
  | "condo_whole"
  | "landed_whole"
  | "other";

export type Furnishing = "unfurnished" | "partial" | "fully";

export interface IntakeAttribution {
  source_variant: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
}

export interface RentalIntakeInsert {
  landlord_name: string;
  landlord_phone: string;
  landlord_email: string | null;
  listing_type: ListingType;
  district: string;
  address_line: string | null;
  rent_monthly: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number | null;
  mrt_distance: string | null;
  furnishing: Furnishing | null;
  availability_date: string | null;
  selling_points: string[];
  notes: string | null;
  photo_urls: string[];
  status: "landlord_submitted";
  source_variant: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
}

export interface IntakeSummary {
  id: string;
  listing_type: ListingType;
  district: string;
  rent_monthly: number;
  photo_count: number;
  submitted_at: string;
}
