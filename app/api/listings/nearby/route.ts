import { NextRequest, NextResponse } from "next/server";
import {
  categoryLabel,
  DEFAULT_SEARCH_RADIUS_M,
  fetchNearestAcrossCategories,
  fetchPlacesForCategory,
  SEARCH_RADIUS_OPTIONS,
  type NearbyCategory,
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

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

async function geocodeQuery(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "sg");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "HomeUP/1.0 (homeup.sg listings nearby)",
        Accept: "application/json",
      },
      next: { revalidate: 86400 },
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const results = (await response.json()) as NominatimResult[];
    const hit = results[0];
    if (!hit) return null;

    return { lat: Number(hit.lat), lng: Number(hit.lon) };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function geocodeLocation(
  location: string,
  title?: string | null,
): Promise<{ lat: number; lng: number; resolvedQuery: string } | null> {
  const attempts = [
    location.includes("Singapore") ? location : `${location}, Singapore`,
    title ? `${title}, Singapore` : null,
    title && location !== title ? `${title} ${location}, Singapore` : null,
  ].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);

  for (const query of attempts) {
    const coords = await geocodeQuery(query);
    if (coords) return { ...coords, resolvedQuery: query };
  }

  return null;
}

function parseRadius(value: string | null): SearchRadiusM {
  const parsed = Number(value);
  return SEARCH_RADIUS_OPTIONS.includes(parsed as SearchRadiusM)
    ? (parsed as SearchRadiusM)
    : DEFAULT_SEARCH_RADIUS_M;
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
      category === "nearest"
        ? await fetchNearestAcrossCategories(geocoded.lat, geocoded.lng, radiusM)
        : (await fetchPlacesForCategory(geocoded.lat, geocoded.lng, category, radiusM)).slice(0, 12);

    return NextResponse.json({
      coords: { lat: geocoded.lat, lng: geocoded.lng },
      resolvedQuery: geocoded.resolvedQuery,
      places,
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
