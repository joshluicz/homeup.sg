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

export async function geocodeLocation(
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
