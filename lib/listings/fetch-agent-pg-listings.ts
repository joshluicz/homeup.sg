import {
  FETCH_BLOCK_PATTERNS,
  PG_USER_AGENT,
} from "@/lib/listings/import/types";
import {
  extractListingUrlsFromHtml,
  isPgBlockedHtml,
} from "@/lib/listings/extract-pg-listing-urls";
import type { ParsedPgListingUrl } from "@/lib/listings/pg-url";

const MAX_PAGES = 50;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    if (!res.ok || isPgBlockedHtml(body)) return null;
    return body;
  } catch {
    return null;
  }
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
    const pageListings = extractListingUrlsFromHtml(html);

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

/** HTTP fallback — often blocked by PropertyGuru. Prefer Playwright. */
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

/** HTTP fallback when listedById is unavailable. */
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

// Re-export for tests
export { FETCH_BLOCK_PATTERNS };
