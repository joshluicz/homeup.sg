import stops from "@/lib/data/sg-bus-stops.json";
import type { NearbyPlace } from "@/lib/listings/nearby-places";

export type BusStop = {
  code: string | null;
  name: string | null;
  lat: number;
  lng: number;
};

const BUS_STOPS: BusStop[] = stops as BusStop[];
const WALK_SPEED_M_PER_MIN = 80;

function haversineDistanceM(
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

function walkMinutes(distanceM: number): number {
  return Math.max(1, Math.round(distanceM / WALK_SPEED_M_PER_MIN));
}

export function findBusStopsWithinRadius(
  lat: number,
  lng: number,
  radiusM: number,
): NearbyPlace[] {
  return BUS_STOPS.map((stop) => {
    const distanceM = Math.round(haversineDistanceM(lat, lng, stop.lat, stop.lng));
    return { stop, distanceM };
  })
    .filter((item) => item.distanceM <= radiusM)
    .sort((a, b) => a.distanceM - b.distanceM)
    .map(({ stop, distanceM }) => busStopToNearbyPlace(stop, distanceM));
}

function busStopToNearbyPlace(stop: BusStop, distanceM: number): NearbyPlace {
  const label =
    stop.name?.trim() ||
    (stop.code ? `Bus Stop ${stop.code}` : "Bus stop");

  const idKey = stop.code ?? `${stop.lat.toFixed(6)}-${stop.lng.toFixed(6)}`;

  return {
    id: `bus-${idKey}`,
    name: label,
    lat: stop.lat,
    lng: stop.lng,
    distanceM,
    walkMins: walkMinutes(distanceM),
    category: "bus",
    tag: stop.code ?? undefined,
  };
}
