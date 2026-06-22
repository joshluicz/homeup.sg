/** Display sizes for listing images — tuned for card grid and gallery layouts. */
export type ListingImageVariant = "card" | "compact" | "thumb" | "gallery";

const VARIANT_DIMENSIONS: Record<ListingImageVariant, { width: number; height: number }> = {
  card: { width: 640, height: 480 },
  compact: { width: 480, height: 360 },
  thumb: { width: 160, height: 120 },
  gallery: { width: 1200, height: 900 },
};

const SUPABASE_OBJECT_PATH =
  /^https:\/\/([^.]+)\.supabase\.co\/storage\/v1\/object\/public\/(.+)$/i;

const SUPABASE_RENDER_PATH =
  /^https:\/\/([^.]+)\.supabase\.co\/storage\/v1\/render\/image\/public\/(.+?)(?:\?.*)?$/i;

function isUnsplashUrl(url: string): boolean {
  return url.includes("images.unsplash.com");
}

function unsplashWithSize(url: string, width: number): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("w", String(width));
    parsed.searchParams.set("q", "80");
    parsed.searchParams.set("auto", "format");
    return parsed.toString();
  } catch {
    return url;
  }
}

/** Use the direct public object URL — Next.js Image handles resizing on Vercel. */
function supabaseObjectUrl(origin: string, path: string): string {
  return `https://${origin}.supabase.co/storage/v1/object/public/${path}`;
}

/**
 * Returns a display-appropriate image URL.
 * Supabase storage URLs are served directly; resizing is done by next/image (not Supabase transforms).
 */
export function getListingImageSrc(
  url: string,
  variant: ListingImageVariant = "card",
): string {
  if (!url) return url;

  if (isUnsplashUrl(url)) {
    return unsplashWithSize(url, VARIANT_DIMENSIONS[variant].width);
  }

  const objectMatch = url.match(SUPABASE_OBJECT_PATH);
  if (objectMatch) {
    return supabaseObjectUrl(objectMatch[1], objectMatch[2]);
  }

  const renderMatch = url.match(SUPABASE_RENDER_PATH);
  if (renderMatch) {
    return supabaseObjectUrl(renderMatch[1], renderMatch[2]);
  }

  return url;
}

export function getListingGallerySrcs(
  urls: string[],
  variant: ListingImageVariant = "gallery",
): string[] {
  return urls.map((url) => getListingImageSrc(url, variant));
}
