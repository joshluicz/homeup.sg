import { MAX_IMAGES } from "./types.ts";

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
];

const PREFER_PATTERNS = [
  /cdn/i,
  /img/i,
  /photo/i,
  /media/i,
  /propertyguru/i,
  /pgimgs/i,
  /cloudfront/i,
];

function resolveUrl(raw: string, baseUrl?: string): string | null {
  const trimmed = raw.trim();
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

function scoreUrl(url: string): number {
  let score = 0;
  if (PREFER_PATTERNS.some((p) => p.test(url))) score += 2;
  if (/\.(jpe?g|png|webp)(\?|$)/i.test(url)) score += 1;
  if (/\d{3,4}x\d{3,4}/.test(url)) score += 1;
  return score;
}

export function extractImageUrls(html: string, baseUrl?: string): string[] {
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

  return [...found]
    .sort((a, b) => scoreUrl(b) - scoreUrl(a))
    .slice(0, MAX_IMAGES);
}
