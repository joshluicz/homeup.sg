export type ListingStatus = "active" | "draft" | "archived";
export type ListedAs = "rent" | "sell";
export type Negotiable = "negotiable" | "starting_from";
export type FlatType = "condominium" | "hdb" | "landed" | "apartment";
export type Condition = "no_furnishing" | "partial" | "fully_furnished";

export interface Listing {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  slug: string;
  status: ListingStatus;
  listed_as: ListedAs;
  is_sold: boolean;
  is_featured: boolean;
  price: number;
  negotiable: Negotiable;
  area_sqft: number;
  flat_type: FlatType;
  condition: Condition;
  rooms: number | null;
  bathrooms: number | null;
  tenure: number | null;
  is_freehold: boolean;
  address_line_1: string | null;
  featured_image_url: string | null;
  image_urls: string[];
  deleted_at: string | null;
  source_pg_url: string | null;
  source_pg_listing_id: string | null;
}

export type ListingInsert = Omit<
  Listing,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;

export type ListingUpdate = Partial<ListingInsert>;

export interface ListingFormData {
  title: string;
  slug: string;
  status: ListingStatus;
  listed_as: ListedAs;
  is_sold: boolean;
  is_featured: boolean;
  price: number;
  negotiable: Negotiable;
  area_sqft: number;
  flat_type: FlatType;
  condition: Condition;
  rooms: number | null;
  bathrooms: number | null;
  tenure: number | null;
  is_freehold: boolean;
  address_line_1: string;
  featured_image_url: string | null;
  image_urls: string[];
  source_pg_url?: string | null;
  source_pg_listing_id?: string | null;
}

export type ListingFilter = "all" | "active" | "draft" | "sold";
