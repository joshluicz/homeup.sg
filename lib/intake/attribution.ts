import type { IntakeAttribution } from "./types";

export const ATTRIBUTION_STORAGE_KEY = "homeup-rent-attribution";

export function parseAttributionFromSearchParams(
  params: URLSearchParams,
): IntakeAttribution {
  const v = params.get("v")?.trim() || null;
  return {
    source_variant: v,
    utm_source: params.get("utm_source")?.trim() || null,
    utm_medium: params.get("utm_medium")?.trim() || null,
    utm_campaign: params.get("utm_campaign")?.trim() || null,
    utm_content: params.get("utm_content")?.trim() || null,
  };
}

export function hasAttribution(attribution: IntakeAttribution): boolean {
  return Object.values(attribution).some((v) => v !== null && v !== "");
}

export function saveAttributionToSession(attribution: IntakeAttribution): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // sessionStorage unavailable
  }
}

export function loadAttributionFromSession(): IntakeAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as IntakeAttribution;
  } catch {
    return null;
  }
}

export function getAttributionForSubmit(
  searchParams: URLSearchParams,
): IntakeAttribution {
  const fromUrl = parseAttributionFromSearchParams(searchParams);
  if (hasAttribution(fromUrl)) {
    saveAttributionToSession(fromUrl);
    return fromUrl;
  }
  return loadAttributionFromSession() ?? fromUrl;
}
