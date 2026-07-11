import type { Listing } from "@/lib/listings/types";
import { buildListingLocationQuery } from "@/lib/listings/nearby-places";
import { geocodeLocation } from "@/lib/listings/geocode";
import {
  findNearestMrtStation,
  type NearestMrtResult,
} from "@/lib/listings/mrt-proximity";

export type ListingLocationContext = {
  locationQuery: string;
  mapCoords: { lat: number; lng: number } | null;
  nearestMrt: NearestMrtResult | null;
};

export async function getListingLocationContext(
  listing: Pick<Listing, "title" | "address_line_1">,
): Promise<ListingLocationContext> {
  const locationQuery = buildListingLocationQuery(listing);
  const geocoded = await geocodeLocation(locationQuery, listing.title);

  return {
    locationQuery,
    mapCoords: geocoded ? { lat: geocoded.lat, lng: geocoded.lng } : null,
    nearestMrt: geocoded ? findNearestMrtStation(geocoded.lat, geocoded.lng) : null,
  };
}
