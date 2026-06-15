const PG_LISTING_ID_RE = /-(\d{6,})(?:\?|#|$)/;

export type ParsedPgListingUrl = {
  pg_url: string;
  pg_listing_id: string;
};

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
  invalid: string[];
} {
  const valid: ParsedPgListingUrl[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parsed = parsePgListingUrl(trimmed);
    if (!parsed) {
      invalid.push(trimmed);
      continue;
    }
    if (seen.has(parsed.pg_listing_id)) continue;
    seen.add(parsed.pg_listing_id);
    valid.push(parsed);
  }

  return { valid, invalid };
}
