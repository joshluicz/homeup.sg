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
