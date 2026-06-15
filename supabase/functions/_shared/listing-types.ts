export type ListingStatus = "active" | "draft" | "archived";
export type ListedAs = "rent" | "sell";
export type Negotiable = "negotiable" | "starting_from";
export type FlatType = "condominium" | "hdb" | "landed" | "apartment";
export type Condition = "no_furnishing" | "partial" | "fully_furnished";

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
}
