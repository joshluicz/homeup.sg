"use client";

import { useEffect, useState } from "react";
import { MrtStationBadges } from "@/components/listings/MrtStationBadges";
import type { NearestMrtResult } from "@/lib/listings/mrt-proximity";
import { findNearestMrtStation, formatMrtHeroText, mrtStopFromPlaceName } from "@/lib/listings/mrt-proximity";
import type { NearbyPlace } from "@/lib/listings/nearby-places";

type Props = {
  nearestMrt: NearestMrtResult | null;
  locationQuery: string;
  title: string;
};

type HeroMrtState = {
  distanceM: number;
  walkMins: number;
  stop: NearestMrtResult["stop"];
};

export function ListingMrtProximity({ nearestMrt, locationQuery, title }: Props) {
  const [fallback, setFallback] = useState<HeroMrtState | null>(null);

  useEffect(() => {
    if (nearestMrt || fallback) return;

    const params = new URLSearchParams({
      location: locationQuery,
      title,
      category: "mrt",
      radius: "2000",
    });

    let cancelled = false;
    fetch(`/api/listings/nearby?${params}`)
      .then((res) => res.json())
      .then((data: { places?: NearbyPlace[]; coords?: { lat: number; lng: number } | null }) => {
        if (cancelled) return;

        if (data.coords) {
          const resolved = findNearestMrtStation(data.coords.lat, data.coords.lng);
          if (resolved) {
            setFallback({
              distanceM: resolved.distanceM,
              walkMins: resolved.walkMins,
              stop: resolved.stop,
            });
            return;
          }
        }

        const first = Array.isArray(data.places) ? data.places[0] : null;
        if (!first) return;

        const stop = mrtStopFromPlaceName(first.name);
        if (!stop) return;

        setFallback({
          distanceM: first.distanceM,
          walkMins: first.walkMins,
          stop,
        });
      })
      .catch(() => {
        // Keep the hero clean if location lookup fails.
      });

    return () => {
      cancelled = true;
    };
  }, [fallback, locationQuery, nearestMrt, title]);

  const hero = nearestMrt
    ? {
        distanceM: nearestMrt.distanceM,
        walkMins: nearestMrt.walkMins,
        stop: nearestMrt.stop,
      }
    : fallback;

  if (!hero) return null;

  const text = formatMrtHeroText(hero.distanceM, hero.walkMins, hero.stop);

  return (
    <div className="mt-4 rounded-2xl border border-neutral-200/80 bg-gradient-to-r from-neutral-50 to-white px-4 py-3 shadow-sm">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm leading-snug text-neutral-700">
        <span className="font-medium text-neutral-500">{text.prefix}</span>
        <MrtStationBadges stop={hero.stop} />
        <span className="font-semibold text-neutral-900">{text.stationName}</span>
      </p>
    </div>
  );
}
