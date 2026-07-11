import type { Listing } from "@/lib/listings/types";

export type NearbyCategory =
  | "nearest"
  | "mrt"
  | "bus"
  | "schools"
  | "shopping"
  | "healthcare"
  | "food";

export type NearbyPlace = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceM: number;
  walkMins: number;
  category: NearbyCategory;
  tag?: string;
};

export const NEARBY_CATEGORIES: {
  id: NearbyCategory;
  label: string;
}[] = [
  { id: "nearest", label: "Nearest" },
  { id: "mrt", label: "MRT/LRT" },
  { id: "bus", label: "Bus" },
  { id: "schools", label: "Schools" },
  { id: "shopping", label: "Shopping" },
  { id: "healthcare", label: "Healthcare" },
  { id: "food", label: "Food & Drink" },
];

export const SEARCH_RADIUS_OPTIONS = [500, 1000, 2000, 5000] as const;
export type SearchRadiusM = (typeof SEARCH_RADIUS_OPTIONS)[number];
export const DEFAULT_SEARCH_RADIUS_M: SearchRadiusM = 2000;

const PLACE_CATEGORIES: Exclude<NearbyCategory, "nearest">[] = [
  "mrt",
  "bus",
  "schools",
  "shopping",
  "healthcare",
  "food",
];

const WALK_SPEED_M_PER_MIN = 80;

export function buildListingLocationQuery(listing: Pick<Listing, "title" | "address_line_1">): string {
  const address = listing.address_line_1?.trim();
  if (address) return `${address}, Singapore`;
  return `${listing.title.trim()}, Singapore`;
}

export function defaultRadiusForCategory(category: NearbyCategory): SearchRadiusM {
  if (category === "nearest") return DEFAULT_SEARCH_RADIUS_M;
  if (category === "mrt") return 2000;
  if (category === "bus") return 1000;
  return DEFAULT_SEARCH_RADIUS_M;
}

export function haversineDistanceM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadius = 6_371_000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function walkMinutes(distanceM: number): number {
  return Math.max(1, Math.round(distanceM / WALK_SPEED_M_PER_MIN));
}

/**
 * Public Overpass mirrors, tried in order. The main endpoint is frequently
 * rate-limited/slow, so we fail over to mirrors.
 */
export const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const OVERPASS_TIMEOUT_MS = 12_000;

function categoryFilter(
  category: Exclude<NearbyCategory, "nearest">,
  lat: number,
  lng: number,
  radiusM: number,
): string {
  const r = Math.round(radiusM);
  const busR = Math.round(Math.min(radiusM, 1200));

  switch (category) {
    case "mrt":
      // Railway stations/halts only (anchored) — never railway line relations,
      // which are huge and cause Overpass timeouts.
      return `
        node["railway"~"^(station|halt)$"](around:${r},${lat},${lng});
        way["railway"~"^(station|halt)$"](around:${r},${lat},${lng});
        node["station"="light_rail"](around:${r},${lat},${lng});
      `;
    case "bus":
      return `node["highway"="bus_stop"](around:${busR},${lat},${lng});`;
    case "schools":
      return `
        node["amenity"="school"](around:${r},${lat},${lng});
        way["amenity"="school"](around:${r},${lat},${lng});
      `;
    case "shopping":
      return `
        node["shop"~"^(mall|supermarket|department_store)$"](around:${r},${lat},${lng});
        way["shop"~"^(mall|supermarket|department_store)$"](around:${r},${lat},${lng});
      `;
    case "healthcare":
      return `
        node["amenity"~"^(hospital|clinic|doctors)$"](around:${r},${lat},${lng});
        way["amenity"~"^(hospital|clinic|doctors)$"](around:${r},${lat},${lng});
      `;
    case "food":
      return `
        node["amenity"~"^(restaurant|cafe|fast_food)$"](around:${r},${lat},${lng});
        way["amenity"~"^(restaurant|cafe|fast_food)$"](around:${r},${lat},${lng});
      `;
  }
}

export function buildOverpassQuery(
  category: Exclude<NearbyCategory, "nearest">,
  lat: number,
  lng: number,
  radiusM: number,
): string {
  return `[out:json][timeout:20];(${categoryFilter(category, lat, lng, radiusM)});out center 40;`;
}

/** Single combined query across every category (used by the "Nearest" tab). */
export function buildCombinedOverpassQuery(lat: number, lng: number, radiusM: number): string {
  const body = PLACE_CATEGORIES.map((category) =>
    categoryFilter(category, lat, lng, radiusM),
  ).join("\n");
  return `[out:json][timeout:20];(${body});out center 200;`;
}

/** Derive which category a raw OSM element belongs to (for combined queries). */
export function classifyElement(tags: Record<string, string>): Exclude<NearbyCategory, "nearest"> | null {
  if (tags.railway === "station" || tags.railway === "halt" || tags.station === "light_rail") {
    return "mrt";
  }
  if (tags.highway === "bus_stop") return "bus";
  if (tags.amenity === "school") return "schools";
  if (["mall", "supermarket", "department_store"].includes(tags.shop ?? "")) return "shopping";
  if (["hospital", "clinic", "doctors"].includes(tags.amenity ?? "")) return "healthcare";
  if (["restaurant", "cafe", "fast_food"].includes(tags.amenity ?? "")) return "food";
  return null;
}

async function runOverpassQuery(query: string): Promise<OverpassElement[]> {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) continue;
      const data = (await response.json()) as { elements?: OverpassElement[] };
      return data.elements ?? [];
    } catch {
      clearTimeout(timeout);
      // Try the next mirror.
    }
  }
  return [];
}

type OverpassElement = {
  id: number;
  type?: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export function mapOverpassElement(
  element: OverpassElement,
  originLat: number,
  originLng: number,
  category: NearbyCategory,
): NearbyPlace | null {
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (lat == null || lng == null) return null;

  const tags = element.tags ?? {};

  const name =
    tags.name ??
    tags["name:en"] ??
    tags.operator ??
    tags.brand ??
    tags.amenity ??
    tags.shop ??
    "Unnamed place";

  const distanceM = Math.round(haversineDistanceM(originLat, originLng, lat, lng));

  return {
    id: `${element.type ?? "node"}-${element.id}`,
    name,
    lat,
    lng,
    distanceM,
    walkMins: walkMinutes(distanceM),
    category,
    tag: tags.ref ?? tags.network ?? tags.railway ?? tags.station ?? undefined,
  };
}

export function dedupePlaces(places: NearbyPlace[]): NearbyPlace[] {
  const seen = new Set<string>();
  return places.filter((place) => {
    const key = `${place.name.toLowerCase()}|${Math.round(place.lat * 1000)}|${Math.round(place.lng * 1000)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchPlacesForCategory(
  lat: number,
  lng: number,
  category: Exclude<NearbyCategory, "nearest">,
  radiusM: number,
): Promise<NearbyPlace[]> {
  const elements = await runOverpassQuery(buildOverpassQuery(category, lat, lng, radiusM));
  return dedupePlaces(
    elements
      .map((element) => mapOverpassElement(element, lat, lng, category))
      .filter((place): place is NearbyPlace => place != null)
      .sort((a, b) => a.distanceM - b.distanceM),
  );
}

/**
 * One combined Overpass request, then pick the closest place in each category.
 * Avoids firing six parallel requests (which gets the endpoint to rate-limit us).
 */
export async function fetchNearestAcrossCategories(
  lat: number,
  lng: number,
  radiusM: number,
): Promise<NearbyPlace[]> {
  const elements = await runOverpassQuery(buildCombinedOverpassQuery(lat, lng, radiusM));

  const nearestByCategory = new Map<Exclude<NearbyCategory, "nearest">, NearbyPlace>();

  for (const element of elements) {
    const category = classifyElement(element.tags ?? {});
    if (!category) continue;
    const place = mapOverpassElement(element, lat, lng, category);
    if (!place) continue;
    const existing = nearestByCategory.get(category);
    if (!existing || place.distanceM < existing.distanceM) {
      nearestByCategory.set(category, place);
    }
  }

  return [...nearestByCategory.values()].sort((a, b) => a.distanceM - b.distanceM);
}

export function buildGoogleMapsEmbedUrl(query: string): string {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const q = encodeURIComponent(query);
  if (key) {
    return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${q}&zoom=15`;
  }
  return `https://maps.google.com/maps?q=${q}&hl=en&z=15&output=embed`;
}

export function buildGoogleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function categoryLabel(category: NearbyCategory): string {
  return NEARBY_CATEGORIES.find((item) => item.id === category)?.label ?? category;
}
