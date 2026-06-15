import { FETCH_BLOCK_PATTERNS } from "@/lib/listings/import/types";
import { parsePgListingUrl, type ParsedPgListingUrl } from "@/lib/listings/pg-url";

const LISTING_PATH_RE = /listing\/([a-z0-9-]+-\d+)/gi;

/** Used for server-side HTTP fetch — whole response is a block page. */
export function isPgBlockedHtml(html: string): boolean {
  return FETCH_BLOCK_PATTERNS.some((pattern) => pattern.test(html));
}

/**
 * Cloudflare / bot challenge in Playwright. If listings are already in the HTML,
 * the page is usable even when scripts mention captcha or cloudflare.
 */
export function isPgChallengePage(html: string): boolean {
  if (extractListingUrlsFromHtml(html).length > 0) return false;

  return (
    /just a moment/i.test(html) ||
    /cf-challenge/i.test(html) ||
    /<title>\s*attention required/i.test(html) ||
    /access denied/i.test(html) ||
    /challenge-platform/i.test(html) ||
    /cf-turnstile/i.test(html) ||
    /id="challenge-form"/i.test(html)
  );
}

export function extractListingUrlsFromHtml(html: string): ParsedPgListingUrl[] {
  const found: ParsedPgListingUrl[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(LISTING_PATH_RE)) {
    const parsed = parsePgListingUrl(
      `https://www.propertyguru.com.sg/listing/${match[1]}`,
    );
    if (parsed && !seen.has(parsed.pg_listing_id)) {
      seen.add(parsed.pg_listing_id);
      found.push(parsed);
    }
  }

  const jsonMatches = html.matchAll(/listing\\\/([a-z0-9-]+-\d+)/gi);
  for (const match of jsonMatches) {
    const slug = match[1].replace(/\\\//g, "/");
    const parsed = parsePgListingUrl(
      `https://www.propertyguru.com.sg/listing/${slug}`,
    );
    if (parsed && !seen.has(parsed.pg_listing_id)) {
      seen.add(parsed.pg_listing_id);
      found.push(parsed);
    }
  }

  return found;
}

/** Dedupe by pg_listing_id — canonical key for fetch/sync. */
export function mergeParsedListings(
  ...groups: Array<Iterable<ParsedPgListingUrl>>
): Map<string, ParsedPgListingUrl> {
  const merged = new Map<string, ParsedPgListingUrl>();
  for (const group of groups) {
    for (const listing of group) {
      merged.set(listing.pg_listing_id, listing);
    }
  }
  return merged;
}

export function parseListingHrefs(hrefs: string[]): ParsedPgListingUrl[] {
  const found: ParsedPgListingUrl[] = [];
  const seen = new Set<string>();

  for (const href of hrefs) {
    if (!href.includes("/listing/")) continue;
    const absolute = href.startsWith("http")
      ? href
      : `https://www.propertyguru.com.sg${href.startsWith("/") ? href : `/${href}`}`;
    const parsed = parsePgListingUrl(absolute);
    if (parsed && !seen.has(parsed.pg_listing_id)) {
      seen.add(parsed.pg_listing_id);
      found.push(parsed);
    }
  }

  return found;
}
