/**
 * HomeUP proprietary transaction-data moat.
 *
 * Reads from the `transactions` table (populated via the admin CSV-upload page)
 * and returns aggregate-only stats for injection into the draft prompt.
 *
 * Privacy guarantee (query-time):
 *   Any (town, property_type) cohort with fewer than MIN_SAMPLE rows is silently
 *   skipped — it contributes NO stat to the output. Individual rows are never
 *   returned or stored in any prompt or response.
 */

import { createServiceClient } from "@/lib/supabase/service";
import type { TopicCategory } from "./radarConfig";

const MIN_SAMPLE = 5;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  property_type: string;
  town: string;
  segment: string | null;
  sold_price: number;
  days_on_market: number;
  net_vs_valuation: number | null;
  year: number;
}

interface CohortStat {
  propertyType: string;
  town: string;
  count: number;
  avgSoldPrice: number;
  avgDaysOnMarket: number;
  avgNetVsValuation: number | null;
}

// ── Category → property-type mapping ─────────────────────────────────────────

const CATEGORY_PROPERTY_TYPES: Record<TopicCategory, string[]> = {
  hdb_upgrade: ["HDB"],
  hdb_resale: ["HDB"],
  hdb_bto: ["HDB"],
  condo_resale: ["Condo"],
  condo_new_launch: ["Condo"],
  ec: ["EC"],
  landed: ["Landed"],
  buying_first: ["HDB", "Condo", "EC"],
  investment: ["Condo", "EC", "Landed"],
  selling: ["HDB", "Condo", "EC", "Landed"],
  condo_tips: ["Condo"],
  finance: ["HDB", "Condo", "EC", "Landed"],
  legal: ["HDB", "Condo", "EC", "Landed"],
};

// ── Core query ────────────────────────────────────────────────────────────────

/**
 * Returns all individual transaction rows for the given property types.
 * Groups + aggregates in TypeScript (avoids Supabase RPC complexity).
 * Returns null if the DB is unreachable or completely empty for these types.
 */
async function fetchRows(propertyTypes: string[]): Promise<Transaction[] | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("transactions")
      .select("id, property_type, town, segment, sold_price, days_on_market, net_vs_valuation, year")
      .in("property_type", propertyTypes)
      .order("year", { ascending: false });

    if (error || !data || data.length === 0) return null;
    return data as Transaction[];
  } catch {
    return null;
  }
}

function groupAndAggregate(rows: Transaction[]): CohortStat[] {
  const map = new Map<string, Transaction[]>();

  for (const row of rows) {
    const key = `${row.property_type}||${row.town}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }

  const stats: CohortStat[] = [];

  for (const [key, cohort] of map.entries()) {
    // ── Min-5 privacy gate ──────────────────────────────────────────────────
    if (cohort.length < MIN_SAMPLE) continue;

    const [propertyType, town] = key.split("||");
    const count = cohort.length;
    const avgSoldPrice = Math.round(cohort.reduce((s, r) => s + r.sold_price, 0) / count);
    const avgDaysOnMarket = Math.round(
      cohort.reduce((s, r) => s + r.days_on_market, 0) / count,
    );

    const nvRows = cohort.filter((r) => r.net_vs_valuation !== null);
    const avgNetVsValuation =
      nvRows.length >= MIN_SAMPLE
        ? Math.round((nvRows.reduce((s, r) => s + (r.net_vs_valuation ?? 0), 0) / nvRows.length) * 100) / 100
        : null;

    stats.push({ propertyType, town, count, avgSoldPrice, avgDaysOnMarket, avgNetVsValuation });
  }

  // Most sales first
  return stats.sort((a, b) => b.count - a.count);
}

function formatStats(stats: CohortStat[]): string {
  if (stats.length === 0) return "";

  const total = stats.reduce((s, c) => s + c.count, 0);
  const lines = stats.slice(0, 8).map((c) => {
    const price = `avg S$${c.avgSoldPrice.toLocaleString()}`;
    const dom = `avg ${c.avgDaysOnMarket} days on market`;
    const nv =
      c.avgNetVsValuation !== null
        ? `, avg ${c.avgNetVsValuation > 0 ? "+" : ""}${c.avgNetVsValuation}% vs valuation`
        : "";
    return `• ${c.propertyType} in ${c.town} (${c.count} sales): ${price}, ${dom}${nv}`;
  });

  return `HomeUP first-party transaction data (${total} sales, aggregates only):\n${lines.join("\n")}`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns a formatted stats string to inject into the draft prompt, or null if
 * there is no qualifying data (graceful degradation — caller must handle null).
 *
 * @param category  Topic category — used to select relevant property types.
 */
export async function getTransactionStats(category: TopicCategory): Promise<string | null> {
  const propertyTypes = CATEGORY_PROPERTY_TYPES[category] ?? ["HDB", "Condo", "EC", "Landed"];

  const rows = await fetchRows(propertyTypes);
  if (!rows) return null;

  const stats = groupAndAggregate(rows);
  if (stats.length === 0) return null;

  return formatStats(stats);
}

/**
 * Returns raw row count per (property_type, town) cohort for the admin UI.
 * Never returns individual rows.
 */
export async function getTransactionCohortSummary(): Promise<
  { propertyType: string; town: string; count: number; minYear: number; maxYear: number }[]
> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("transactions")
      .select("property_type, town, year");

    if (error || !data) return [];

    const map = new Map<string, { count: number; years: number[] }>();
    for (const row of data) {
      const key = `${row.property_type}||${row.town}`;
      if (!map.has(key)) map.set(key, { count: 0, years: [] });
      map.get(key)!.count++;
      map.get(key)!.years.push(row.year);
    }

    return Array.from(map.entries())
      .map(([key, val]) => {
        const [propertyType, town] = key.split("||");
        return {
          propertyType,
          town,
          count: val.count,
          minYear: Math.min(...val.years),
          maxYear: Math.max(...val.years),
          meetsMinSample: val.count >= MIN_SAMPLE,
        };
      })
      .sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}

export { MIN_SAMPLE };
