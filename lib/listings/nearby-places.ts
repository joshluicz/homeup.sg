import type { Listing } from "@/lib/listings/types";
import { findBusStopsWithinRadius } from "@/lib/listings/bus-proximity";

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

const OVERPASS_TIMEOUT_MS = 3_500;

export function limitPlacesForList(
  places: NearbyPlace[],
  category: NearbyCategory,
): NearbyPlace[] {
  if (category === "bus") return places;
  return places.slice(0, 12);
}

function filterWithinRadius(places: NearbyPlace[], radiusM: number): NearbyPlace[] {
  return places.filter((place) => place.distanceM <= radiusM);
}

function sortPlacesByDistance(places: NearbyPlace[]): NearbyPlace[] {
  return [...places].sort((a, b) => a.distanceM - b.distanceM);
}

function categoryFilter(
  category: Exclude<NearbyCategory, "nearest">,
  lat: number,
  lng: number,
  radiusM: number,
): string {
  const r = Math.round(radiusM);

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
      return `
        node["highway"="bus_stop"](around:${r},${lat},${lng});
        node["public_transport"="platform"]["bus"="yes"](around:${r},${lat},${lng});
        node["public_transport"="stop_position"]["bus"="yes"](around:${r},${lat},${lng});
      `;
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
  const timeout = category === "bus" ? 25 : 20;
  // Bus: no output cap — Overpass's numeric limit returns an arbitrary subset, which
  // drops the nearest stops when the search radius is large. We sort client-side.
  const output = category === "bus" ? "out center;" : "out center 80;";
  return `[out:json][timeout:${timeout}];(${categoryFilter(category, lat, lng, radiusM)});${output}`;
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
  if (tags.public_transport === "platform" && tags.bus === "yes") return "bus";
  if (tags.public_transport === "stop_position" && tags.bus === "yes") return "bus";
  if (tags.amenity === "school") return "schools";
  if (["mall", "supermarket", "department_store"].includes(tags.shop ?? "")) return "shopping";
  if (["hospital", "clinic", "doctors"].includes(tags.amenity ?? "")) return "healthcare";
  if (["restaurant", "cafe", "fast_food"].includes(tags.amenity ?? "")) return "food";
  return null;
}

async function runOverpassQuery(
  query: string,
  timeoutMs = OVERPASS_TIMEOUT_MS,
): Promise<OverpassElement[]> {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "HomeUP/1.0 (homeup.sg; listings nearby map)",
        },
        body: `data=${encodeURIComponent(query)}`,
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) continue;
      const text = await response.text();
      if (!text.trimStart().startsWith("{")) continue;
      const data = JSON.parse(text) as { elements?: OverpassElement[] };
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

  const busStopCode = tags.ref ?? tags.local_ref ?? tags["ref:SG:bus"];
  const name =
    category === "bus"
      ? (tags.name ??
        tags["name:en"] ??
        (busStopCode ? `Bus Stop ${busStopCode}` : "Bus stop"))
      : (tags.name ??
        tags["name:en"] ??
        tags.operator ??
        tags.brand ??
        tags.amenity ??
        tags.shop ??
        "Unnamed place");

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
    const key =
      place.category === "bus"
        ? place.id
        : `${place.name.toLowerCase()}|${Math.round(place.lat * 1000)}|${Math.round(place.lng * 1000)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

type NominatimPlace = {
  place_id: number;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
};

const NOMINATIM_QUERIES: Record<Exclude<NearbyCategory, "nearest">, string[]> = {
  mrt: [],
  bus: ["bus stop"],
  schools: ["school"],
  shopping: ["shopping mall", "supermarket"],
  healthcare: ["clinic", "hospital"],
  food: ["restaurant", "cafe"],
};

function bboxForRadius(lat: number, lng: number, radiusM: number): string {
  const latDelta = radiusM / 111_320;
  const lngDelta = radiusM / (111_320 * Math.cos((lat * Math.PI) / 180));
  return [
    lng - lngDelta,
    lat + latDelta,
    lng + lngDelta,
    lat - latDelta,
  ].join(",");
}

function nameFromDisplayName(displayName: string): string {
  return displayName.split(",")[0]?.trim() || "Nearby place";
}

async function fetchNominatimPlacesForCategory(
  lat: number,
  lng: number,
  category: Exclude<NearbyCategory, "nearest">,
  radiusM: number,
): Promise<NearbyPlace[]> {
  const queries = NOMINATIM_QUERIES[category];
  if (queries.length === 0) return [];

  const places: NearbyPlace[] = [];
  const viewbox = bboxForRadius(lat, lng, radiusM);

  for (const query of queries) {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "10");
    url.searchParams.set("countrycodes", "sg");
    url.searchParams.set("bounded", "1");
    url.searchParams.set("viewbox", viewbox);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3_500);
    try {
      const response = await fetch(url.toString(), {
        headers: {
          "User-Agent": "HomeUP/1.0 (homeup.sg listings nearby fallback)",
          Accept: "application/json",
        },
        next: { revalidate: 86400 },
        signal: controller.signal,
      });
      if (!response.ok) continue;

      const results = (await response.json()) as NominatimPlace[];
      for (const result of results) {
        const placeLat = Number(result.lat);
        const placeLng = Number(result.lon);
        if (!Number.isFinite(placeLat) || !Number.isFinite(placeLng)) continue;

        const distanceM = Math.round(haversineDistanceM(lat, lng, placeLat, placeLng));
        if (distanceM > radiusM) continue;

        places.push({
          id: `nominatim-${result.place_id}`,
          name: result.name || nameFromDisplayName(result.display_name),
          lat: placeLat,
          lng: placeLng,
          distanceM,
          walkMins: walkMinutes(distanceM),
          category,
          tag: result.type ?? result.class,
        });
      }
    } catch {
      // Try the next query term.
    } finally {
      clearTimeout(timeout);
    }
  }

  return dedupePlaces(places).sort((a, b) => a.distanceM - b.distanceM);
}

function fetchBusStopsNearby(
  lat: number,
  lng: number,
  radiusM: number,
): NearbyPlace[] {
  return findBusStopsWithinRadius(lat, lng, radiusM);
}

function fetchOverpassPlacesForCategory(
  lat: number,
  lng: number,
  category: Exclude<NearbyCategory, "nearest">,
  radiusM: number,
): Promise<NearbyPlace[]> {
  const elements = runOverpassQuery(buildOverpassQuery(category, lat, lng, radiusM));
  return elements.then((resolved) =>
    sortPlacesByDistance(
      filterWithinRadius(
        dedupePlaces(
          resolved
            .map((element) => mapOverpassElement(element, lat, lng, category))
            .filter((place): place is NearbyPlace => place != null),
        ),
        radiusM,
      ),
    ),
  );
}

export async function fetchPlacesForCategory(
  lat: number,
  lng: number,
  category: Exclude<NearbyCategory, "nearest">,
  radiusM: number,
): Promise<NearbyPlace[]> {
  if (category === "bus") {
    return fetchBusStopsNearby(lat, lng, radiusM);
  }

  const nominatimPlaces = await fetchNominatimPlacesForCategory(lat, lng, category, radiusM);
  const overpassPlaces = await fetchOverpassPlacesForCategory(lat, lng, category, radiusM);

  if (overpassPlaces.length > 0) return overpassPlaces;
  return nominatimPlaces;
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
  const nearestByCategory = new Map<Exclude<NearbyCategory, "nearest">, NearbyPlace>();
  const categories: Exclude<NearbyCategory, "nearest">[] = [
    "bus",
    "schools",
    "shopping",
    "healthcare",
    "food",
  ];

  for (const category of categories) {
    if (category === "bus") {
      const busStops = fetchBusStopsNearby(lat, lng, radiusM);
      if (busStops[0]) nearestByCategory.set(category, busStops[0]);
      continue;
    }

    const fallback = await fetchNominatimPlacesForCategory(lat, lng, category, radiusM);
    if (fallback[0]) nearestByCategory.set(category, fallback[0]);
  }

  if (nearestByCategory.size === 0) {
    const elements = await runOverpassQuery(buildCombinedOverpassQuery(lat, lng, radiusM));
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
  }

  return [...nearestByCategory.values()].sort((a, b) => a.distanceM - b.distanceM);
}

export {
  buildGoogleMapsEmbedUrl,
  buildGoogleMapsSearchUrl,
  buildMapEmbedUrl,
} from "@/lib/listings/map-embed";

export function categoryLabel(category: NearbyCategory): string {
  return NEARBY_CATEGORIES.find((item) => item.id === category)?.label ?? category;
}
