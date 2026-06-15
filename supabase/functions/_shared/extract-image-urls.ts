import { MAX_IMAGES } from "./types.ts";

/** PropertyGuru listing photo CDN — real listing images use this path shape. */
const PG_LISTING_PHOTO_RE =
  /https?:\/\/sg\d+-cdn\.pgimgs\.com\/listing\/\d+\/UPHO\.\d+\.[A-Z0-9]+\/[^"'\s<>\\)]+/gi;

const SKIP_PATTERNS = [
  /\/agent\//i,
  /\/avatar\//i,
  /\/logo/i,
  /\/icon/i,
  /\/badge/i,
  /placeholder/i,
  /spacer/i,
  /1x1/i,
  /pixel/i,
  /gravatar/i,
  /facebook\.com/i,
  /googleusercontent\.com\/.*=s\d{1,2}-/i,
  /nophoto/i,
  /sf2-search/i,
  /guruweblayout/i,
  /\/bundles\//i,
  /\/widgets\//i,
  /hive-ui/i,
  /listing-card/i,
  /\/assets\//i,
  /cdn\d*\.pgimgs\.com\/\d+\/sf2/i,
];

function resolveUrl(raw: string, baseUrl?: string): string | null {
  const trimmed = raw.trim().replace(/&amp;/g, "&");
  if (!trimmed || trimmed.startsWith("data:")) return null;

  try {
    if (trimmed.startsWith("//")) {
      return `https:${trimmed}`;
    }
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    if (baseUrl) {
      return new URL(trimmed, baseUrl).href;
    }
  } catch {
    return null;
  }

  return null;
}

function extractFromSrcset(srcset: string, baseUrl?: string): string[] {
  return srcset
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .map((url) => resolveUrl(url, baseUrl))
    .filter((url): url is string => url != null);
}

function shouldSkip(url: string): boolean {
  return SKIP_PATTERNS.some((pattern) => pattern.test(url));
}

/** Pull numeric PropertyGuru listing id from URL or page metadata. */
export function extractPropertyGuruListingId(
  html: string,
  urlHint?: string,
): string | null {
  if (urlHint) {
    const fromPath = urlHint.match(/-(\d{6,})(?:\?|#|$)/);
    if (fromPath) return fromPath[1];
  }

  const canonical =
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ??
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  if (canonical) {
    const id = canonical[1].match(/-(\d{6,})(?:\?|#|$)/);
    if (id) return id[1];
  }

  const ogUrl =
    html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:url["']/i);
  if (ogUrl) {
    const id = ogUrl[1].match(/-(\d{6,})(?:\?|#|$)/);
    if (id) return id[1];
  }

  return null;
}

/** Prefer higher-resolution variants when the CDN supports them. */
function upgradePgImageResolution(url: string): string {
  return url.replace(
    /\/UPHO\.(\d+)\.(V150|V550|R\d+X\d+|R\d+)\//i,
    "/UPHO.$1.V800/",
  );
}

function scoreUrl(url: string, listingId: string | null): number {
  let score = 0;

  if (listingId && url.includes(`/listing/${listingId}/`)) score += 20;
  if (/UPHO\.\d+\./i.test(url)) score += 10;
  if (/sg\d+-cdn\.pgimgs\.com\/listing\//i.test(url)) score += 8;
  if (/\.V800\//i.test(url) || /\.V1200\//i.test(url)) score += 3;
  if (/\.V150\//i.test(url) || /R400X300/i.test(url)) score -= 2;

  if (/cdn/i.test(url)) score += 1;
  if (/\.(jpe?g|png|webp)(\?|$)/i.test(url)) score += 1;

  return score;
}

function dedupeAndSort(urls: string[], listingId: string | null): string[] {
  const normalized = urls
    .map((url) => upgradePgImageResolution(url))
    .filter((url) => !shouldSkip(url));

  const listingPhotos = listingId
    ? normalized.filter((url) => url.includes(`/listing/${listingId}/`))
    : normalized.filter((url) => /sg\d+-cdn\.pgimgs\.com\/listing\/\d+\/UPHO\./i.test(url));

  const pool = listingPhotos.length > 0 ? listingPhotos : normalized;

  return [...new Set(pool)]
    .sort((a, b) => scoreUrl(b, listingId) - scoreUrl(a, listingId))
    .slice(0, MAX_IMAGES);
}

function extractPgListingPhotos(html: string): string[] {
  const found: string[] = [];
  const matches = html.matchAll(PG_LISTING_PHOTO_RE);
  for (const match of matches) {
    const url = resolveUrl(match[0]);
    if (url) found.push(url);
  }

  // Escaped JSON URLs inside script tags
  const jsonMatches = html.matchAll(
    /https?:\\?\/\\?\/sg\d+-cdn\.pgimgs\.com\\?\/listing\\?\/\d+\\?\/UPHO\.[^"'\s]+/gi,
  );
  for (const match of jsonMatches) {
    const unescaped = match[0].replace(/\\\//g, "/");
    const url = resolveUrl(unescaped);
    if (url) found.push(url);
  }

  return found;
}

function extractOgImage(html: string): string | null {
  const match =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (!match) return null;
  const url = resolveUrl(match[1]);
  if (!url || shouldSkip(url)) return null;
  return url;
}

function extractFromImgTags(html: string, baseUrl?: string): string[] {
  const found = new Set<string>();

  const imgTagPattern =
    /<img[^>]+(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = imgTagPattern.exec(html)) !== null) {
    const url = resolveUrl(match[1], baseUrl);
    if (url && !shouldSkip(url)) found.add(url);
  }

  const srcsetPattern = /srcset=["']([^"']+)["']/gi;
  while ((match = srcsetPattern.exec(html)) !== null) {
    for (const url of extractFromSrcset(match[1], baseUrl)) {
      if (!shouldSkip(url)) found.add(url);
    }
  }

  const dataSrcPattern = /data-(?:src|lazy-src|original)=["']([^"']+)["']/gi;
  while ((match = dataSrcPattern.exec(html)) !== null) {
    const url = resolveUrl(match[1], baseUrl);
    if (url && !shouldSkip(url)) found.add(url);
  }

  return [...found];
}

export function extractImageUrls(html: string, urlHint?: string): string[] {
  const listingId = extractPropertyGuruListingId(html, urlHint);

  const pgPhotos = extractPgListingPhotos(html);
  const ogImage = extractOgImage(html);
  const imgTags = extractFromImgTags(html, urlHint);

  const combined = [
    ...pgPhotos,
    ...(ogImage ? [ogImage] : []),
    ...imgTags.filter((url) => /UPHO\./i.test(url)),
    ...imgTags,
  ];

  return dedupeAndSort(combined, listingId);
}
