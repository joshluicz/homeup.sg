import {
  FETCH_BLOCK_PATTERNS,
  PG_USER_AGENT,
} from "@/lib/listings/import/types";
import { parsePgListingUrl, type ParsedPgListingUrl } from "@/lib/listings/pg-url";

const LISTING_PATH_RE = /listing\/([a-z0-9-]+-\d+)/gi;
const MAX_PAGES = 50;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isBlockedBody(body: string): boolean {
  return FETCH_BLOCK_PATTERNS.some((pattern) => pattern.test(body));
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": PG_USER_AGENT,
        "Accept-Language": "en-SG,en;q=0.9",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    const body = await res.text();
    if (!res.ok || isBlockedBody(body)) return null;
    return body;
  } catch {
    return null;
  }
}

function extractListingUrls(html: string): ParsedPgListingUrl[] {
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

  // Escaped URLs inside JSON payloads
  const jsonMatches = html.matchAll(
    /listing\\\/([a-z0-9-]+-\d+)/gi,
  );
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

async function fetchSectionPages(
  buildUrl: (page: number) => string,
  seen: Set<string>,
  listings: ParsedPgListingUrl[],
): Promise<boolean> {
  let gotAnyPage = false;
  let emptyPages = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = buildUrl(page);
    let html = await fetchText(url);

    if (!html) {
      await sleep(1200);
      html = await fetchText(url);
    }

    if (!html) break;

    gotAnyPage = true;
    const pageListings = extractListingUrls(html);

    if (pageListings.length === 0) {
      emptyPages += 1;
      if (emptyPages >= 2) break;
      await sleep(600);
      continue;
    }

    emptyPages = 0;
    for (const entry of pageListings) {
      if (!seen.has(entry.pg_listing_id)) {
        seen.add(entry.pg_listing_id);
        listings.push(entry);
      }
    }

    await sleep(800);
  }

  return gotAnyPage;
}

/** Fetch all sale + rent listings for an agent using PropertyGuru listedById. */
export async function fetchAgentPgListingsByListedById(
  listedById: string,
): Promise<{ listings: ParsedPgListingUrl[]; error?: "FETCH_BLOCKED" | string }> {
  const seen = new Set<string>();
  const listings: ParsedPgListingUrl[] = [];
  let anySectionOk = false;

  for (const section of ["property-for-sale", "property-for-rent"] as const) {
    const ok = await fetchSectionPages(
      (page) =>
        `https://www.propertyguru.com.sg/${section}?listedById=${encodeURIComponent(listedById)}&page=${page}`,
      seen,
      listings,
    );
    if (ok) anySectionOk = true;
  }

  if (!anySectionOk && listings.length === 0) {
    return { listings: [], error: "FETCH_BLOCKED" };
  }

  return { listings };
}

/** Fallback when listedById is unavailable. */
export async function fetchAgentPgListingsByCea(
  cea: string,
): Promise<{ listings: ParsedPgListingUrl[]; error?: "FETCH_BLOCKED" | string }> {
  const seen = new Set<string>();
  const listings: ParsedPgListingUrl[] = [];
  let anySectionOk = false;

  for (const section of ["property-for-sale", "property-for-rent"] as const) {
    const ok = await fetchSectionPages(
      (page) =>
        `https://www.propertyguru.com.sg/${section}?agentCea=${encodeURIComponent(cea)}&page=${page}`,
      seen,
      listings,
    );
    if (ok) anySectionOk = true;
  }

  if (!anySectionOk && listings.length === 0) {
    return { listings: [], error: "FETCH_BLOCKED" };
  }

  return { listings };
}
