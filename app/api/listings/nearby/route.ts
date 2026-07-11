import { NextRequest, NextResponse } from "next/server";
import { geocodeLocation } from "@/lib/listings/geocode";
import {
  findNearestMrtStation,
  findNearestMrtStations,
  mrtStationToNearbyPlace,
} from "@/lib/listings/mrt-proximity";
import {
  categoryLabel,
  DEFAULT_SEARCH_RADIUS_M,
  fetchNearestAcrossCategories,
  fetchPlacesForCategory,
  SEARCH_RADIUS_OPTIONS,
  type NearbyCategory,
  type NearbyPlace,
  type SearchRadiusM,
} from "@/lib/listings/nearby-places";

const VALID_CATEGORIES = new Set<NearbyCategory>([
  "nearest",
  "mrt",
  "bus",
  "schools",
  "shopping",
  "healthcare",
  "food",
]);

function parseRadius(value: string | null): SearchRadiusM {
  const parsed = Number(value);
  return SEARCH_RADIUS_OPTIONS.includes(parsed as SearchRadiusM)
    ? (parsed as SearchRadiusM)
    : DEFAULT_SEARCH_RADIUS_M;
}

function mergeStaticMrtIntoNearest(
  places: NearbyPlace[],
  lat: number,
  lng: number,
): NearbyPlace[] {
  const nearestMrt = findNearestMrtStation(lat, lng);
  if (!nearestMrt) return places;

  const staticMrt = mrtStationToNearbyPlace(nearestMrt);
  const withoutMrt = places.filter((place) => place.category !== "mrt");
  return [...withoutMrt, staticMrt].sort((a, b) => a.distanceM - b.distanceM);
}

export async function GET(request: NextRequest) {
  const location = request.nextUrl.searchParams.get("location")?.trim();
  const legacyAddress = request.nextUrl.searchParams.get("address")?.trim();
  const title = request.nextUrl.searchParams.get("title")?.trim();
  const category = request.nextUrl.searchParams.get("category") as NearbyCategory | null;
  const radiusM = parseRadius(request.nextUrl.searchParams.get("radius"));

  const searchLocation = location ?? legacyAddress;

  if (!searchLocation) {
    return NextResponse.json({ error: "location is required" }, { status: 400 });
  }

  if (!category || !VALID_CATEGORIES.has(category)) {
    return NextResponse.json({ error: "invalid category" }, { status: 400 });
  }

  try {
    const geocoded = await geocodeLocation(searchLocation, title);
    if (!geocoded) {
      return NextResponse.json({
        coords: null,
        places: [],
        location: searchLocation,
        category,
        radiusM,
      });
    }

    const places =
      category === "mrt"
        ? findNearestMrtStations(geocoded.lat, geocoded.lng, 12, radiusM).map(mrtStationToNearbyPlace)
        : category === "nearest"
          ? mergeStaticMrtIntoNearest(
              await fetchNearestAcrossCategories(geocoded.lat, geocoded.lng, radiusM),
              geocoded.lat,
              geocoded.lng,
            )
          : (await fetchPlacesForCategory(geocoded.lat, geocoded.lng, category, radiusM)).slice(0, 12);

    const nearestMrt = findNearestMrtStation(geocoded.lat, geocoded.lng);

    return NextResponse.json({
      coords: { lat: geocoded.lat, lng: geocoded.lng },
      resolvedQuery: geocoded.resolvedQuery,
      places,
      nearestMrt,
      location: searchLocation,
      category,
      radiusM,
      categoryLabel: categoryLabel(category),
    });
  } catch {
    // Degrade gracefully — the client shows a "try a wider radius" empty state
    // rather than surfacing a hard error when the map data source is unavailable.
    return NextResponse.json({
      coords: null,
      places: [],
      location: searchLocation,
      category,
      radiusM,
      error: "Failed to load nearby places",
    });
  }
}
