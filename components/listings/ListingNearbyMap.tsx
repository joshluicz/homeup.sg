"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Footprints,
  Home,
  MapPin,
  Train,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  buildGoogleMapsSearchUrl,
  buildMapEmbedUrl,
} from "@/lib/listings/map-embed";
import {
  categoryLabel,
  DEFAULT_SEARCH_RADIUS_M,
  NEARBY_CATEGORIES,
  SEARCH_RADIUS_OPTIONS,
  type NearbyCategory,
  type NearbyPlace,
  type SearchRadiusM,
} from "@/lib/listings/nearby-places";

type NearbyResponse = {
  coords: { lat: number; lng: number } | null;
  places: NearbyPlace[];
  radiusM: SearchRadiusM;
  resolvedQuery?: string;
};

const CATEGORY_ICONS: Record<NearbyCategory, typeof Train> = {
  nearest: MapPin,
  mrt: Train,
  bus: Train,
  schools: MapPin,
  shopping: MapPin,
  healthcare: MapPin,
  food: MapPin,
};

type Props = {
  locationQuery: string;
  displayAddress: string;
  title: string;
  initialCoords?: { lat: number; lng: number } | null;
};

export function ListingNearbyMap({
  locationQuery,
  displayAddress,
  title,
  initialCoords = null,
}: Props) {
  const [category, setCategory] = useState<NearbyCategory>("nearest");
  const [radiusM, setRadiusM] = useState<SearchRadiusM>(DEFAULT_SEARCH_RADIUS_M);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(initialCoords);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCoords) setCoords(initialCoords);
  }, [initialCoords]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      location: locationQuery,
      title,
      category,
      radius: String(radiusM),
    });

    fetch(`/api/listings/nearby?${params}`)
      .then((res) => res.json())
      .then((data: Partial<NearbyResponse> & { error?: string }) => {
        if (cancelled) return;
        const nextPlaces = Array.isArray(data.places) ? data.places : [];
        setCoords(data.coords ?? initialCoords ?? null);
        setPlaces(nextPlaces);
        setSelectedId(nextPlaces[0]?.id ?? null);
        if (data.error) setError("Could not load nearby places.");
      })
      .catch(() => {
        if (!cancelled) {
          setPlaces([]);
          setError("Could not load nearby places.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [locationQuery, title, category, radiusM, initialCoords]);

  const selected = places.find((place) => place.id === selectedId) ?? places[0] ?? null;

  const mapCoords = useMemo(() => {
    if (selected) return { lat: selected.lat, lng: selected.lng };
    return coords;
  }, [coords, selected]);

  const mapQuery = useMemo(() => {
    if (selected) return `${selected.name}, Singapore`;
    return locationQuery;
  }, [locationQuery, selected]);

  const mapSrc = buildMapEmbedUrl(mapQuery, mapCoords);
  const usesOsmFallback = !process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY && Boolean(mapCoords);

  const emptyLabel =
    category === "nearest"
      ? "nearest places"
      : categoryLabel(category).toLowerCase();

  return (
    <section aria-label="What's nearby" className="border-t border-neutral-100 bg-white py-10 sm:py-12">
      <div className="container-page">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display text-xl font-bold text-neutral-900 sm:text-2xl">What&apos;s nearby</h2>

          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">Search radius</span>
            <Select
              value={String(radiusM)}
              onValueChange={(value) => setRadiusM(Number(value) as SearchRadiusM)}
            >
              <SelectTrigger
                aria-label="Search radius"
                className="h-9 w-[6.5rem] rounded-xl border-neutral-200 bg-white text-sm font-medium text-neutral-700 shadow-sm focus:ring-primary-100"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-neutral-200 shadow-lg">
                {SEARCH_RADIUS_OPTIONS.map((option) => (
                  <SelectItem
                    key={option}
                    value={String(option)}
                    className="cursor-pointer rounded-lg text-sm focus:bg-primary-50 focus:text-primary-700"
                  >
                    {option >= 1000 ? `${option / 1000} km` : `${option} m`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <div className="flex flex-1 gap-2 overflow-x-auto pb-1 scrollbar-none">
            {NEARBY_CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                className={cn(
                  "shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200",
                  category === item.id
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-5 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-sm">
          <div className="relative aspect-[16/10] w-full sm:aspect-[16/9]">
            {mapCoords ? (
              <iframe
                title={`Map showing ${title}`}
                src={mapSrc}
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 px-6 text-center text-sm text-neutral-500">
                Map unavailable for this listing. Try opening the address in Google Maps below.
              </div>
            )}

            {panelOpen && (
              <div className="absolute left-3 top-3 z-10 w-[min(100%-1.5rem,20rem)] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg sm:left-4 sm:top-4">
                <div className="border-b border-neutral-100 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white">
                      <Home className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900">{title}</p>
                      <p className="truncate text-xs text-neutral-500">{displayAddress}</p>
                    </div>
                  </div>
                </div>

                <div className="max-h-52 overflow-y-auto">
                  {loading ? (
                    <div className="space-y-2 p-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-12 animate-pulse rounded-xl bg-neutral-100" />
                      ))}
                    </div>
                  ) : error ? (
                    <p className="p-4 text-sm text-neutral-500">{error}</p>
                  ) : places.length === 0 ? (
                    <p className="p-4 text-sm text-neutral-500">
                      No {emptyLabel} found within {radiusM >= 1000 ? `${radiusM / 1000} km` : `${radiusM} m`}.
                      Try increasing the search radius.
                    </p>
                  ) : (
                    places.map((place) => {
                      const Icon = CATEGORY_ICONS[place.category];
                      const active = selected?.id === place.id;
                      return (
                        <button
                          key={place.id}
                          type="button"
                          onClick={() => setSelectedId(place.id)}
                          className={cn(
                            "flex w-full cursor-pointer items-start gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-b-0",
                            active ? "bg-primary-50/60" : "hover:bg-neutral-50",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                              active ? "bg-primary-600 text-white" : "bg-blue-50 text-blue-600",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            {category === "nearest" && (
                              <span className="mb-0.5 block text-xs font-semibold uppercase tracking-wide text-primary-600">
                                {categoryLabel(place.category)}
                              </span>
                            )}
                            <span className="block truncate text-sm font-semibold text-neutral-900">
                              {place.name}
                            </span>
                            <span className="mt-0.5 flex items-center gap-2 text-xs text-neutral-500">
                              <Footprints className="h-3.5 w-3.5" />
                              {place.walkMins} mins · {place.distanceM} m
                            </span>
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-neutral-100 px-4 py-3">
                  <a
                    href={buildGoogleMapsSearchUrl(locationQuery, coords)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-primary-600 hover:underline"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </div>
            )}

            <button
              type="button"
              aria-label={panelOpen ? "Hide nearby panel" : "Show nearby panel"}
              onClick={() => setPanelOpen((open) => !open)}
              className="absolute bottom-4 left-[min(calc(100%-3rem),19rem)] z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-white shadow-md transition-colors hover:bg-neutral-50 sm:left-[21rem]"
            >
              {panelOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {usesOsmFallback && (
          <p className="mt-2 text-xs text-neutral-400">
            Map powered by OpenStreetMap. Add a Google Maps Embed API key for Google map tiles.
          </p>
        )}

        {coords && selected && !loading && (
          <p className="mt-3 text-sm text-neutral-500">
            {category === "nearest" ? "Closest overall" : `Nearest ${categoryLabel(category)}`}:{" "}
            <span className="font-semibold text-neutral-700">{selected.name}</span> ·{" "}
            {selected.walkMins} min walk ({selected.distanceM} m) within{" "}
            {radiusM >= 1000 ? `${radiusM / 1000} km` : `${radiusM} m`}
          </p>
        )}
      </div>
    </section>
  );
}
