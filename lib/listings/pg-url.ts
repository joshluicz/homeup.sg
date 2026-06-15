const PG_LISTING_ID_RE = /-(\d{6,})(?:\?|#|$)/;

export type ParsedPgListingUrl = {
  pg_url: string;
  pg_listing_id: string;
};

/** Property slug from a PG listing URL, e.g. for-sale-tembusu-grand-500044866 → tembusu-grand */
export function propertySlugFromPgUrl(raw: string): string | null {
  let pathname: string;
  try {
    pathname = new URL(raw.trim()).pathname;
  } catch {
    return null;
  }
  const m = pathname.match(/\/listing\/(.+)-(\d{6,})$/);
  if (!m) return null;
  let slug = m[1];
  slug = slug.replace(/^hdb-for-(?:sale|rent)-/, "");
  slug = slug.replace(/^for-(?:sale|rent)-/, "");
  return slug;
}

export function listedAsFromPgUrl(raw: string): "rent" | "sell" {
  return /for-rent/i.test(raw) ? "rent" : "sell";
}

export type InvalidPgLine = {
  line: string;
  reason: string;
};

export function describeInvalidPgUrl(raw: string): string {
  const trimmed = raw.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return "Not a valid web address — paste the full https:// link.";
  }

  if (!parsed.hostname.endsWith("propertyguru.com.sg")) {
    return "Must be a propertyguru.com.sg link.";
  }

  if (parsed.pathname.includes("/agent/")) {
    return "This is an agent profile link. Paste individual property listing links instead (see instructions above).";
  }

  if (
    parsed.pathname.includes("/property-for-sale") ||
    parsed.pathname.includes("/property-for-rent")
  ) {
    return "This is a search results page. Open each property and copy its listing link.";
  }

  if (!parsed.pathname.includes("/listing/")) {
    return "Must be a listing page — the URL should contain /listing/.";
  }

  return "Could not read the listing ID from this URL. Check the link is complete.";
}

export function parsePgAgentProfileUrl(raw: string): string | null {
  const source = parsePgAgentSourceInput(raw);
  return source?.pg_profile_url ?? null;
}

/** Agent profile URL or property-for-sale?listedById=… search URL. */
export function parsePgAgentSourceInput(raw: string): {
  pg_listed_by_id: string;
  pg_profile_url: string | null;
} | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (!parsed.hostname.endsWith("propertyguru.com.sg")) return null;

  const listedByFromQuery = parsed.searchParams.get("listedById");
  if (listedByFromQuery && /^\d+$/.test(listedByFromQuery)) {
    let profileUrl: string | null = null;
    if (parsed.pathname.includes("/agent/")) {
      parsed.hash = "";
      parsed.search = "";
      profileUrl = parsed.href.replace(/\/$/, "");
    }
    return {
      pg_listed_by_id: listedByFromQuery,
      pg_profile_url: profileUrl,
    };
  }

  if (parsed.pathname.includes("/agent/")) {
    const idMatch = parsed.pathname.match(/-(\d+)\/?$/);
    if (!idMatch) return null;
    parsed.hash = "";
    parsed.search = "";
    return {
      pg_listed_by_id: idMatch[1],
      pg_profile_url: parsed.href.replace(/\/$/, ""),
    };
  }

  return null;
}

export function parsePgListingUrl(raw: string): ParsedPgListingUrl | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (!parsed.hostname.endsWith("propertyguru.com.sg")) return null;
  if (!parsed.pathname.includes("/listing/")) return null;

  const idMatch = parsed.pathname.match(PG_LISTING_ID_RE);
  if (!idMatch) return null;

  parsed.hash = "";
  parsed.search = "";

  return {
    pg_url: parsed.href.replace(/\/$/, ""),
    pg_listing_id: idMatch[1],
  };
}

export function parsePgListingUrlLines(text: string): {
  valid: ParsedPgListingUrl[];
  invalid: InvalidPgLine[];
} {
  const valid: ParsedPgListingUrl[] = [];
  const invalid: InvalidPgLine[] = [];
  const seen = new Set<string>();

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parsed = parsePgListingUrl(trimmed);
    if (!parsed) {
      invalid.push({ line: trimmed, reason: describeInvalidPgUrl(trimmed) });
      continue;
    }
    if (seen.has(parsed.pg_listing_id)) continue;
    seen.add(parsed.pg_listing_id);
    valid.push(parsed);
  }

  return { valid, invalid };
}
