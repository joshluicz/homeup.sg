import stations from "@/lib/data/sg-mrt-stations.json";
import { haversineDistanceM, walkMinutes } from "@/lib/listings/nearby-places";

export type MrtStation = {
  code: string;
  name: string;
  lat: number;
  lng: number;
};

export type NearestMrtResult = {
  station: MrtStation;
  distanceM: number;
  walkMins: number;
  label: string;
};

const MRT_STATIONS: MrtStation[] = (stations as MrtStation[]).map((station) => ({
  code: station.code,
  name: station.name,
  lat: station.lat,
  lng: station.lng,
}));

export function findNearestMrtStation(lat: number, lng: number): NearestMrtResult | null {
  if (!MRT_STATIONS.length) return null;

  let nearest: NearestMrtResult | null = null;

  for (const station of MRT_STATIONS) {
    const distanceM = Math.round(haversineDistanceM(lat, lng, station.lat, station.lng));
    if (!nearest || distanceM < nearest.distanceM) {
      nearest = {
        station,
        distanceM,
        walkMins: walkMinutes(distanceM),
        label: formatMrtProximityLabel(station, distanceM, walkMinutes(distanceM)),
      };
    }
  }

  return nearest;
}

export function formatMrtProximityLabel(
  station: MrtStation,
  distanceM: number,
  walkMins: number,
): string {
  return `${distanceM} m (${walkMins} mins) from ${station.code} ${station.name} MRT Station`;
}

export function findNearestMrtStations(
  lat: number,
  lng: number,
  limit = 8,
  maxDistanceM = 3000,
): NearestMrtResult[] {
  return MRT_STATIONS.map((station) => {
    const distanceM = Math.round(haversineDistanceM(lat, lng, station.lat, station.lng));
    return {
      station,
      distanceM,
      walkMins: walkMinutes(distanceM),
      label: formatMrtProximityLabel(station, distanceM, walkMinutes(distanceM)),
    };
  })
    .filter((item) => item.distanceM <= maxDistanceM)
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, limit);
}

export function mrtStationToNearbyPlace(result: NearestMrtResult) {
  return {
    id: `mrt-${result.station.code}`,
    name: `${result.station.code} ${result.station.name}`,
    lat: result.station.lat,
    lng: result.station.lng,
    distanceM: result.distanceM,
    walkMins: result.walkMins,
    category: "mrt" as const,
    tag: result.station.code,
  };
}
