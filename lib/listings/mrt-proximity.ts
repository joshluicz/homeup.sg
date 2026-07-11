import stations from "@/lib/data/sg-mrt-stations.json";
import { haversineDistanceM, walkMinutes } from "@/lib/listings/nearby-places";

export type MrtStation = {
  code: string;
  name: string;
  lat: number;
  lng: number;
};

export type MrtTransferType = "single" | "standard" | "tap_out";

export type MrtStopGroup = {
  name: string;
  stations: MrtStation[];
  transferType: MrtTransferType;
  lat: number;
  lng: number;
};

export type NearestMrtResult = {
  station: MrtStation;
  stop: MrtStopGroup;
  distanceM: number;
  walkMins: number;
};

const MRT_STATIONS: MrtStation[] = stations as MrtStation[];

const TAP_OUT_DISTANCE_M = 120;

function compareStationCodes(a: MrtStation, b: MrtStation): number {
  return a.code.localeCompare(b.code, undefined, { numeric: true });
}

export function getMrtStopGroup(station: MrtStation): MrtStopGroup {
  const siblings = MRT_STATIONS.filter((candidate) => candidate.name === station.name).sort(
    compareStationCodes,
  );

  if (siblings.length <= 1) {
    return {
      name: station.name,
      stations: [station],
      transferType: "single",
      lat: station.lat,
      lng: station.lng,
    };
  }

  const anchor = siblings[0];
  const maxSpreadM = Math.max(
    ...siblings.map((candidate) =>
      haversineDistanceM(anchor.lat, anchor.lng, candidate.lat, candidate.lng),
    ),
  );

  return {
    name: station.name,
    stations: siblings,
    transferType: maxSpreadM > TAP_OUT_DISTANCE_M ? "tap_out" : "standard",
    lat: anchor.lat,
    lng: anchor.lng,
  };
}

export function findNearestMrtStation(lat: number, lng: number): NearestMrtResult | null {
  if (!MRT_STATIONS.length) return null;

  let nearestStation: MrtStation | null = null;
  let nearestDistanceM = Number.POSITIVE_INFINITY;

  for (const station of MRT_STATIONS) {
    const distanceM = Math.round(haversineDistanceM(lat, lng, station.lat, station.lng));
    if (distanceM < nearestDistanceM) {
      nearestDistanceM = distanceM;
      nearestStation = station;
    }
  }

  if (!nearestStation) return null;

  const stop = getMrtStopGroup(nearestStation);
  return {
    station: nearestStation,
    stop,
    distanceM: nearestDistanceM,
    walkMins: walkMinutes(nearestDistanceM),
  };
}

export function findNearestMrtStations(
  lat: number,
  lng: number,
  limit = 8,
  maxDistanceM = 3000,
): NearestMrtResult[] {
  const seenStops = new Set<string>();

  return MRT_STATIONS.map((station) => {
    const distanceM = Math.round(haversineDistanceM(lat, lng, station.lat, station.lng));
    return { station, distanceM };
  })
    .filter((item) => item.distanceM <= maxDistanceM)
    .sort((a, b) => a.distanceM - b.distanceM)
    .reduce<NearestMrtResult[]>((results, item) => {
      const stop = getMrtStopGroup(item.station);
      if (seenStops.has(stop.name)) return results;
      seenStops.add(stop.name);
      results.push({
        station: item.station,
        stop,
        distanceM: item.distanceM,
        walkMins: walkMinutes(item.distanceM),
      });
      return results;
    }, [])
    .slice(0, limit);
}

export function mrtStationToNearbyPlace(result: NearestMrtResult) {
  const codeLabel = result.stop.stations.map((station) => station.code).join(" / ");
  return {
    id: `mrt-${result.stop.name.toLowerCase().replace(/\s+/g, "-")}`,
    name: `${codeLabel} ${result.stop.name}`,
    lat: result.stop.lat,
    lng: result.stop.lng,
    distanceM: result.distanceM,
    walkMins: result.walkMins,
    category: "mrt" as const,
    tag: codeLabel,
  };
}

export function formatMrtHeroText(
  distanceM: number,
  walkMins: number,
  stop: MrtStopGroup,
): { prefix: string; stationName: string } {
  return {
    prefix: `${distanceM} m (${walkMins} mins) from`,
    stationName: `${stop.name} MRT Station`,
  };
}

export function mrtStopFromPlaceName(name: string): MrtStopGroup | null {
  const withoutCodes = name
    .replace(/^(?:[A-Z]{2}\d+(?:\s*\/\s*[A-Z]{2}\d+)*\s+)+/i, "")
    .trim();

  const station =
    MRT_STATIONS.find((item) => item.name.toLowerCase() === withoutCodes.toLowerCase()) ??
    MRT_STATIONS.find((item) => name.toLowerCase().includes(item.name.toLowerCase()));

  if (!station) return null;
  return getMrtStopGroup(station);
}
