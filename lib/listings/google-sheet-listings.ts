import { AGENTS } from "@/lib/data/agents";
import { listingsSheetCsvUrl } from "@/lib/listings/google-sheet-constants";
import { parseCsv } from "@/lib/listings/parse-csv";
import { parsePgListingUrl } from "@/lib/listings/pg-url";

export type SheetListingRow = {
  pg_url: string;
  pg_listing_id: string;
  agent_slug: string;
  agent_name: string;
  client_name: string;
  status: string;
};

export type FetchSheetListingsResult = {
  active: SheetListingRow[];
  skipped: {
    sold: number;
    delisted: number;
    held_off_website: number;
    no_url: number;
    invalid_url: number;
    unknown_agent: number;
    duplicate_id: number;
  };
  sheet_total_rows: number;
};

/** Exact SOLD / DELISTED — off the sheet's active set. */
function isInactiveStatus(raw: string): boolean {
  const status = raw.trim().toUpperCase();
  return status === "SOLD" || status === "DELISTED";
}

/** On sheet for ops but not on HomeUP (temporarily off PG / relisting later). */
function isHeldOffWebsite(raw: string): boolean {
  const status = raw.trim().toUpperCase();
  if (!status) return false;
  if (status.includes("DELISTED") && status !== "DELISTED") return true;
  if (status === "WILL RELIST AGAIN") return true;
  return false;
}

/** Map sheet agent label → HomeUP agent slug. */
const AGENT_SLUG_BY_LABEL: Record<string, string> = {
  dennis: "dennis-lim",
  "tong boon": "yeo-tong-boon",
  tongboon: "yeo-tong-boon",
  tong: "yeo-tong-boon",
  yeo: "yeo-tong-boon",
  edmund: "edmund-lee",
  kenji: "kenji-ching",
  olivia: "olivia-neo",
  isaac: "isaac-tay",
};

function normalizeAgentLabel(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function agentSlugFromSheetLabels(...labels: string[]): string | null {
  for (const raw of labels) {
    const label = normalizeAgentLabel(raw);
    if (!label) continue;

    const mapped = AGENT_SLUG_BY_LABEL[label];
    if (mapped) return mapped;

    const bySlug = AGENTS.find((a) => a.slug === label || a.slug.replace(/-/g, " ") === label);
    if (bySlug) return bySlug.slug;

    const byName = AGENTS.find((a) => {
      const first = a.name.split(/\s+/)[0]?.toLowerCase();
      const last = a.name.split(/\s+/).slice(-2).join(" ").toLowerCase();
      return label === first || label === last || a.name.toLowerCase().includes(label);
    });
    if (byName) return byName.slug;
  }
  return null;
}

function headerIndexMap(headerRow: string[]): Map<string, number> {
  const map = new Map<string, number>();
  headerRow.forEach((cell, i) => {
    const key = cell.trim().toLowerCase();
    if (key) map.set(key, i);
  });
  return map;
}

function cell(row: string[], map: Map<string, number>, ...keys: string[]): string {
  for (const key of keys) {
    const idx = map.get(key.toLowerCase());
    if (idx !== undefined) return (row[idx] ?? "").trim();
  }
  return "";
}

function normalizePgUrl(raw: string, pgListingId: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const parsed = parsePgListingUrl(trimmed);
  if (parsed) return parsed.pg_url;

  if (/^\d{6,}$/.test(trimmed)) {
    return `https://www.propertyguru.com.sg/listing/${trimmed}`;
  }

  if (trimmed.includes("propertyguru.com.sg/listing/")) {
    const withId = trimmed.replace(
      /\/listing\/(\d{6,})$/,
      `/listing/for-sale-listing-${pgListingId}`,
    );
    const retry = parsePgListingUrl(withId);
    if (retry) return retry.pg_url;
    return `https://www.propertyguru.com.sg/listing/${pgListingId}`;
  }

  return null;
}

export function parseListingsSheetCsv(csvText: string): FetchSheetListingsResult {
  const rows = parseCsv(csvText);
  const headerRowIdx = rows.findIndex((row) =>
    row.some((cell) => cell.trim().toLowerCase() === "prtyguru id"),
  );
  if (headerRowIdx < 0) {
    throw new Error("Could not find header row (PrtyGuru ID column) in Google Sheet.");
  }

  const col = headerIndexMap(rows[headerRowIdx]);
  const result: FetchSheetListingsResult = {
    active: [],
    skipped: {
      sold: 0,
      delisted: 0,
      held_off_website: 0,
      no_url: 0,
      invalid_url: 0,
      unknown_agent: 0,
      duplicate_id: 0,
    },
    sheet_total_rows: 0,
  };

  const seenIds = new Set<string>();

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const pgListingId = cell(row, col, "prtyguru id");
    if (!pgListingId || !/^\d+$/.test(pgListingId)) continue;

    result.sheet_total_rows++;

    const remarksStatus = cell(row, col, "remarks");
    const unitStatus = cell(row, col, "unit status");
    if (isInactiveStatus(remarksStatus) || isInactiveStatus(unitStatus)) {
      const upper = `${remarksStatus} ${unitStatus}`.toUpperCase();
      if (upper.includes("SOLD")) result.skipped.sold++;
      else result.skipped.delisted++;
      continue;
    }
    if (isHeldOffWebsite(remarksStatus) || isHeldOffWebsite(unitStatus)) {
      result.skipped.held_off_website++;
      continue;
    }

    const rawUrl = cell(row, col, "propertygutu link", "propertyguru link");
    const pgUrl = normalizePgUrl(rawUrl, pgListingId);
    if (!pgUrl) {
      result.skipped.no_url++;
      continue;
    }

    const parsed = parsePgListingUrl(pgUrl);
    if (!parsed) {
      result.skipped.invalid_url++;
      continue;
    }

    if (seenIds.has(parsed.pg_listing_id)) {
      result.skipped.duplicate_id++;
      continue;
    }
    seenIds.add(parsed.pg_listing_id);

    const agentSlug = agentSlugFromSheetLabels(
      cell(row, col, "agent"),
      cell(row, col, "months since listing"),
      cell(row, col, "lo"),
    );

    if (!agentSlug) {
      result.skipped.unknown_agent++;
      continue;
    }

    const agent = AGENTS.find((a) => a.slug === agentSlug);

    result.active.push({
      pg_url: parsed.pg_url,
      pg_listing_id: parsed.pg_listing_id,
      agent_slug: agentSlug,
      agent_name: agent?.name ?? agentSlug,
      client_name: cell(row, col, "client name"),
      status: remarksStatus || unitStatus,
    });
  }

  return result;
}

export async function fetchListingsFromGoogleSheet(
  csvUrl: string = listingsSheetCsvUrl(),
): Promise<FetchSheetListingsResult> {
  const res = await fetch(csvUrl, {
    headers: { Accept: "text/csv" },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Google Sheet fetch failed (${res.status}). Is the sheet shared publicly?`);
  }

  return parseListingsSheetCsv(await res.text());
}
