export function getGoogleMapsJsApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || undefined;
}

export function getGoogleMapsEmbedKey(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY?.trim() || undefined;
}

/** Prefer the JS API key; embed key is iframe-only. */
export function getGoogleMapsApiKey(): string | undefined {
  return getGoogleMapsJsApiKey() ?? getGoogleMapsEmbedKey();
}
