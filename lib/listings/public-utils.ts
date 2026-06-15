import type { FlatType, Listing } from "@/lib/listings/types";
import {
  computeAreaSqm,
  computePricePsf,
  formatSGD,
  NEGOTIABLE_LABELS,
} from "@/lib/listings/utils";

export type FlatTypeFilter = "All" | "HDB" | "Condo" | "Landed";

export function flatTypeBadgeLabel(flatType: FlatType): string {
  switch (flatType) {
    case "hdb":
      return "HDB";
    case "landed":
      return "Landed";
    case "condominium":
    case "apartment":
    default:
      return "Condo";
  }
}

export function flatTypeFilterMatches(listing: Listing, filter: FlatTypeFilter): boolean {
  if (filter === "All") return true;
  if (filter === "HDB") return listing.flat_type === "hdb";
  if (filter === "Landed") return listing.flat_type === "landed";
  return listing.flat_type === "condominium" || listing.flat_type === "apartment";
}

export function formatListingPrice(listing: Listing): string {
  const price = formatSGD(Number(listing.price));
  if (listing.negotiable === "starting_from") {
    return `From ${price}`;
  }
  return price;
}

export function formatListingSize(areaSqft: number): string {
  if (!areaSqft || areaSqft <= 0) return "—";
  return `${Math.round(areaSqft).toLocaleString()} sqft`;
}

export function getListingImage(listing: Listing): string {
  return (
    listing.featured_image_url ??
    listing.image_urls[0] ??
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"
  );
}

export function getListingGallery(listing: Listing): string[] {
  const urls = [
    ...(listing.featured_image_url ? [listing.featured_image_url] : []),
    ...listing.image_urls.filter((url) => url !== listing.featured_image_url),
  ];
  return urls.length > 0 ? urls : [getListingImage(listing)];
}

export function getListingPricePsf(listing: Listing): number | null {
  return computePricePsf(Number(listing.price), Number(listing.area_sqft));
}

export function getListingAreaSqm(listing: Listing): number | null {
  return computeAreaSqm(Number(listing.area_sqft));
}

export function formatTenure(listing: Listing): string {
  if (listing.is_freehold) return "Freehold";
  if (listing.tenure) return `${listing.tenure} years`;
  return "—";
}

export function listedAsLabel(listedAs: Listing["listed_as"]): string {
  return listedAs === "rent" ? "For Rent" : "For Sale";
}

export { NEGOTIABLE_LABELS };
