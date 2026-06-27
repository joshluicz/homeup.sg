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

export type SheetFormatFix = {
  pg_listing_id: string;
  client_name: string;
  /** Agent name currently in Months Since Listing (or LO) — move to Agent column B. */
  misplaced_agent_label: string;
  remarks: string;
};

export type FetchSheetListingsResult = {
  active: SheetListingRow[];
  /** Rent listings (PropertyGuru for-rent URL). */
  rent_on_sheet: number;
  /** Active sale listings (not for-rent URL). */
  sell_on_sheet: number;
  /** Rows to fix on the sheet (agent not in column B). */
  sheet_format_fixes: SheetFormatFix[];
  skipped: {
    sold: number;
    delisted: number;
    held_off_website: number;
    /** PG row active but Agent column B is empty. */
    missing_agent_column: number;
    /** Agent name is in Months Since Listing (or LO) instead of column B — fix the sheet row. */
    agent_in_wrong_column: number;
    no_url: number;
    invalid_url: number;
    unknown_agent: number;
    duplicate_id: number;
  };
  /** Non-empty cells in Agent column B (matches sheet COUNTA(B3:B220) intent). */
  sheet_agent_column_count: number;
  sheet_total_rows: number;
};

function isRentListingUrl(url: string): boolean {
  return /\/listing\/for-rent-/i.test(url) || /\/for-rent-/i.test(url);
}

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
    rent_on_sheet: 0,
    sell_on_sheet: 0,
    sheet_format_fixes: [],
    skipped: {
      sold: 0,
      delisted: 0,
      held_off_website: 0,
      missing_agent_column: 0,
      agent_in_wrong_column: 0,
      no_url: 0,
      invalid_url: 0,
      unknown_agent: 0,
      duplicate_id: 0,
    },
    sheet_agent_column_count: 0,
    sheet_total_rows: 0,
  };

  const seenIds = new Set<string>();

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const pgListingId = cell(row, col, "prtyguru id");
    if (!pgListingId || !/^\d+$/.test(pgListingId)) continue;

    result.sheet_total_rows++;

    const agentColumn = cell(row, col, "agent");
    if (agentColumn) result.sheet_agent_column_count++;

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

    if (!agentColumn) {
      const monthsLabel = cell(row, col, "months since listing");
      const loLabel = cell(row, col, "lo");
      const misplaced = agentSlugFromSheetLabels(monthsLabel, loLabel);
      if (misplaced) {
        result.skipped.agent_in_wrong_column++;
        result.sheet_format_fixes.push({
          pg_listing_id: parsed.pg_listing_id,
          client_name: cell(row, col, "client name"),
          misplaced_agent_label: monthsLabel || loLabel,
          remarks: remarksStatus || unitStatus,
        });
      } else {
        result.skipped.missing_agent_column++;
      }
      continue;
    }

    const agentSlug = agentSlugFromSheetLabels(agentColumn);

    if (!agentSlug) {
      result.skipped.unknown_agent++;
      continue;
    }

    const agent = AGENTS.find((a) => a.slug === agentSlug);
    const isRent = isRentListingUrl(parsed.pg_url);

    result.active.push({
      pg_url: parsed.pg_url,
      pg_listing_id: parsed.pg_listing_id,
      agent_slug: agentSlug,
      agent_name: agent?.name ?? agentSlug,
      client_name: cell(row, col, "client name"),
      status: remarksStatus || unitStatus,
    });

    if (isRent) result.rent_on_sheet++;
    else result.sell_on_sheet++;
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
