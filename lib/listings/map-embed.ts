export type MapCoords = {
  lat: number;
  lng: number;
};

export function buildOsmEmbedUrl(coords: MapCoords, zoom = 15): string {
  const latDelta = 0.006;
  const lngDelta = 0.008;
  const bbox = [
    coords.lng - lngDelta,
    coords.lat - latDelta,
    coords.lng + lngDelta,
    coords.lat + latDelta,
  ].join(",");
  const marker = `${coords.lat},${coords.lng}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(marker)}`;
}

export function buildGoogleMapsEmbedUrl(query: string, coords?: MapCoords | null): string {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY?.trim();
  if (key) {
    const q = coords ? `${coords.lat},${coords.lng}` : query;
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}&zoom=15`;
  }
  if (coords) return buildOsmEmbedUrl(coords);
  const q = encodeURIComponent(query);
  return `https://maps.google.com/maps?q=${q}&hl=en&z=15&output=embed`;
}

export function buildMapEmbedUrl(query: string, coords?: MapCoords | null): string {
  return buildGoogleMapsEmbedUrl(query, coords);
}

export function buildGoogleMapsSearchUrl(query: string, coords?: MapCoords | null): string {
  const q = coords ? `${coords.lat},${coords.lng}` : query;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
