import {
  FETCH_BLOCK_PATTERNS,
  PG_USER_AGENT,
} from "@/lib/listings/import/types";
import { parsePgListingUrl, type ParsedPgListingUrl } from "@/lib/listings/pg-url";

const LISTING_PATH_RE = /listing\/([a-z0-9-]+-\d+)/gi;

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

  return found;
}

/** Fetch active sale + rent listings for a HomeUP agent via their CEA number. */
export async function fetchAgentPgListingsByCea(
  cea: string,
): Promise<{ listings: ParsedPgListingUrl[]; error?: "FETCH_BLOCKED" | string }> {
  const seen = new Set<string>();
  const listings: ParsedPgListingUrl[] = [];
  let gotAnyPage = false;
  const MAX_PAGES = 40;

  for (const type of ["sell", "rent"] as const) {
    const section = type === "rent" ? "property-for-rent" : "property-for-sale";
    let emptyPages = 0;

    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = `https://www.propertyguru.com.sg/${section}?agentCea=${encodeURIComponent(cea)}&page=${page}`;
      let html = await fetchText(url);

      if (!html) {
        await sleep(1200);
        html = await fetchText(url);
      }

      if (!html) {
        if (!gotAnyPage && page === 1 && listings.length === 0) {
          return { listings: [], error: "FETCH_BLOCKED" };
        }
        break;
      }

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
  }

  return { listings };
}
